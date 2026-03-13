import { NextResponse } from "next/server";
import { resolveRoleFromRequest } from "@/lib/auth/server-role";

export async function GET(request: Request) {
  const auth = await resolveRoleFromRequest(request);

  if (!auth.userId) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  return NextResponse.json({
    role: auth.role,
    userId: auth.userId,
  });
}
