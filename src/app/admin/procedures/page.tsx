import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { ProceduresEditor } from "@/components/admin/procedures-editor";

export const dynamic = "force-dynamic";

export default async function ProceduresPage() {
  const procedures = await prisma.procedure.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <PageHeader
        title="Procedimientos"
        subtitle="Documentos que el asistente usa para responder a los usuarios"
      />
      <div className="p-6">
        <ProceduresEditor
          procedures={procedures.map((p) => ({ ...p, updatedAt: p.updatedAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
