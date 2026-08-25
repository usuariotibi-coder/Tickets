import { query } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { InventoryTable } from "@/components/admin/inventory-table";

export const dynamic = "force-dynamic";

type InventoryRow = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default async function InventoryPage() {
  const items = await query<InventoryRow>(`SELECT * FROM "InventoryItem" ORDER BY name ASC`);
  return (
    <div>
      <PageHeader title="Inventario" subtitle="Papel, pilas y periféricos" />
      <div className="p-6">
        <InventoryTable items={items} />
      </div>
    </div>
  );
}
