import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
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

type UserRow = {
  id: string;
  offTopicCount: number;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: Date | null;
};

type ConversationRow = {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type MessageRow = {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  toolCalls: unknown;
  userId: string | null;
  createdAt: Date;
};

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

  const dbUser = await queryOne<UserRow>('SELECT * FROM "User" WHERE id = $1', [user.id]);

  let conversationId = body?.conversationId as string | undefined;
  let conversation = conversationId
    ? await queryOne<ConversationRow>(
        'SELECT * FROM "Conversation" WHERE id = $1 AND "userId" = $2',
        [conversationId, user.id]
      )
    : null;
  if (!conversation) {
    const rows = await query<ConversationRow>(
      `INSERT INTO "Conversation" ("userId") VALUES ($1) RETURNING *`,
      [user.id]
    );
    conversation = rows[0];
    conversationId = conversation.id;
  }

  await query(
    `INSERT INTO "Message" ("conversationId", role, content) VALUES ($1, $2, $3)`,
    [conversation!.id, "user", message]
  );

  const historyRows = await query<MessageRow>(
    `SELECT * FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC LIMIT 80`,
    [conversation!.id]
  );
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
          await query(`UPDATE "User" SET "offTopicCount" = $2 WHERE id = $1`, [
            user.id,
            nextCount,
          ]);

          if (nextCount >= BLOCK_THRESHOLD) {
            const reason = "Mensajes repetidos fuera del tema de la organización";
            await query(
              `UPDATE "User" SET "isBlocked" = true, "blockedReason" = $2, "blockedAt" = $3 WHERE id = $1`,
              [user.id, reason, new Date()]
            );
            await query(
              `INSERT INTO "BlockLog" ("userId", reason, conversation) VALUES ($1, $2, $3::jsonb)`,
              [
                user.id,
                reason,
                JSON.stringify(
                  historyRows.map((m) => ({
                    role: m.role,
                    content: m.content,
                    createdAt: m.createdAt,
                  }))
                ),
              ]
            );
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

        await query(
          `INSERT INTO "Message" ("conversationId", role, content) VALUES ($1, $2, $3)`,
          [conversation!.id, "assistant", full]
        );
        await query(`UPDATE "Conversation" SET "updatedAt" = $2 WHERE id = $1`, [
          conversation!.id,
          new Date(),
        ]);

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
