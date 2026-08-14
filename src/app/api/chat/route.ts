import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  runAssistant,
  streamFinalResponse,
  classifyOffTopic,
  type ChatUser,
} from "@/lib/ai";
import { notifySuspiciousActivity, notifyUserBlocked } from "@/lib/notifications";

export const runtime = "nodejs";

const BLOCK_THRESHOLD = 3;
const NEUTRAL_ERROR = "Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo.";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user: ChatUser = {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email || "",
    role: (session.user as { role?: string }).role || "user",
  };

  const body = await req.json().catch(() => null);
  const message = String(body?.message || "").trim();
  if (!message) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  let conversationId = body?.conversationId as string | undefined;
  let conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId: user.id } })
    : null;
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { userId: user.id } });
    conversationId = conversation.id;
  }

  await prisma.message.create({
    data: { conversationId: conversation!.id, role: "user", content: message },
  });

  const historyRows = await prisma.message.findMany({
    where: { conversationId: conversation!.id },
    orderBy: { createdAt: "asc" },
    take: 80,
  });
  const history = historyRows
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      const finish = (done: unknown) => {
        send(done);
        controller.close();
      };

      try {
        if (dbUser?.isBlocked) {
          return finish({ error: NEUTRAL_ERROR });
        }

        const offTopic = await classifyOffTopic(message);

        if (offTopic) {
          const nextCount = (dbUser?.offTopicCount ?? 0) + 1;
          await prisma.user.update({ where: { id: user.id }, data: { offTopicCount: nextCount } });

          if (nextCount >= BLOCK_THRESHOLD) {
            const reason = "Mensajes repetidos fuera del tema de la organización";
            await prisma.user.update({
              where: { id: user.id },
              data: { isBlocked: true, blockedReason: reason, blockedAt: new Date() },
            });
            await prisma.blockLog.create({
              data: {
                userId: user.id,
                reason,
                conversation: historyRows.map((m) => ({
                  role: m.role,
                  content: m.content,
                  createdAt: m.createdAt,
                })),
              },
            });
            await notifyUserBlocked({
              userName: user.name,
              userEmail: user.email,
              reason,
              conversation: history.map((m) => ({ role: m.role, content: m.content })),
            });
            return finish({ error: NEUTRAL_ERROR });
          }

          if (nextCount === 2) {
            await notifySuspiciousActivity({
              userName: user.name,
              userEmail: user.email,
              message,
              offenseCount: nextCount,
            });
          }
        }

        const { content, messages } = await runAssistant({ user, history });

        let full = content || "";
        if (!full) {
          full = await streamFinalResponse({
            messages,
            onDelta: (d) => send({ delta: d }),
          });
        } else {
          send({ delta: full });
        }

        await prisma.message.create({
          data: { conversationId: conversation!.id, role: "assistant", content: full },
        });
        await prisma.conversation.update({
          where: { id: conversation!.id },
          data: { updatedAt: new Date() },
        });

        finish({ done: true, conversationId: conversation!.id });
      } catch (e) {
        console.error("chat error:", e);
        send({ error: NEUTRAL_ERROR });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
