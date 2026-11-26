import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminApp } from "@/components/admin/AdminApp";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Painel Admin • Batatas da Val" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Segunda camada de proteção (além do middleware).
  if (!supabaseConfigured) redirect("/admin/login");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return <AdminApp userEmail={user.email ?? ""} />;
}
