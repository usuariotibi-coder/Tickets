import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { EmailsManager } from "@/components/admin/emails-manager";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const emails = await prisma.allowedEmail.findMany({ orderBy: { createdAt: "desc" } });
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
