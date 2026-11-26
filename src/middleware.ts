import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authConfigured, verifySession } from "@/lib/auth/session";

/** Protege /admin: só entra quem tem sessão assinada. Sem sessão → /admin/login. */
export async function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname.startsWith("/admin/login");

  // Falha fechada: sem AUTH_SECRET ninguém acessa o painel.
  if (!authConfigured()) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isLogin) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }
  if (session && isLogin) return NextResponse.redirect(new URL("/admin", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
