import { query } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { ProceduresEditor } from "@/components/admin/procedures-editor";

export const dynamic = "force-dynamic";

type ProcedureRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
};

export default async function ProceduresPage() {
  const procedures = await query<ProcedureRow>(
    `SELECT * FROM "Procedure" ORDER BY "updatedAt" DESC`
  );
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
