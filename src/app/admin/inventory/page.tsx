import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { InventoryTable } from "@/components/admin/inventory-table";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <PageHeader title="Inventario" subtitle="Papel, pilas y periféricos" />
      <div className="p-6">
        <InventoryTable items={items} />
      </div>
    </div>
  );
}
