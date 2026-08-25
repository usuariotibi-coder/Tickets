import { query } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { EmailsManager } from "@/components/admin/emails-manager";

export const dynamic = "force-dynamic";

type AllowedEmailRow = {
  id: string;
  email: string;
  note: string | null;
  createdAt: Date;
};

export default async function EmailsPage() {
  const emails = await query<AllowedEmailRow>(
    `SELECT * FROM "AllowedEmail" ORDER BY "createdAt" DESC`
  );
  return (
    <div>
      <PageHeader
        title="Correos permitidos"
        subtitle="Usuarios que pueden ingresar al Centro de Asistencia TI con solo su correo"
      />
      <div className="p-6">
        <EmailsManager
          emails={emails.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
