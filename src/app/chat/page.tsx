import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Chat from "@/components/chat";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return <Chat />;
}
