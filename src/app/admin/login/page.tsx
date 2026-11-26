import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { supabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Entrar • Painel Batatas da Val" };

export default function LoginPage() {
  return <LoginForm configured={supabaseConfigured} />;
}
