import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { BlocksManager } from "@/components/admin/blocks-manager";

export const dynamic = "force-dynamic";

export default async function BlocksPage() {
  const users = await prisma.user.findMany({
    where: { isBlocked: true },
    include: { blockLogs: { orderBy: { blockedAt: "desc" }, take: 1 } },
    orderBy: { blockedAt: "desc" },
  });

  const data = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    blockedAt: u.blockedAt?.toISOString() ?? null,
    reason: u.blockedReason,
    offTopicCount: u.offTopicCount,
    blockLogId: u.blockLogs[0]?.id ?? null,
    conversation:
      (u.blockLogs[0]?.conversation as unknown as {
        role: string;
        content: string;
      }[]) ?? [],
  }));

  return (
    <div>
      <PageHeader
        title="Usuarios bloqueados"
        subtitle="Bloqueados por interacciones fuera del tema. Revisa la conversación y desbloquéalos cuando lo decidas."
      />
      <div className="p-6">
        <BlocksManager users={data} />
      </div>
    </div>
  );
}
