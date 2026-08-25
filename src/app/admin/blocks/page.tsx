import { query } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { BlocksManager } from "@/components/admin/blocks-manager";

export const dynamic = "force-dynamic";

type BlockLogRow = {
  id: string;
  reason: string;
  conversation: unknown;
  blockedAt: Date;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  blockedAt: Date | null;
  blockedReason: string | null;
  offTopicCount: number;
  blockLogs: BlockLogRow[];
};

export default async function BlocksPage() {
  const users = await query<UserRow>(
    `SELECT u.*,
       COALESCE((
         SELECT json_agg(json_build_object('id', bl.id, 'reason', bl.reason, 'conversation', bl.conversation, 'blockedAt', bl."blockedAt") ORDER BY bl."blockedAt" DESC)
         FROM "BlockLog" bl WHERE bl."userId" = u.id
       ), '[]') AS "blockLogs"
     FROM "User" u
     WHERE u."isBlocked" = true
     ORDER BY u."blockedAt" DESC`
  );

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
