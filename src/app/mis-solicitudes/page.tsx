import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MyTickets from "@/components/my-tickets";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return <MyTickets />;
}