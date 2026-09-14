import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashToken, randomToken } from "@/lib/security";

const COOKIE_NAME = "shangdian_admin";

export async function createAdminSession(adminId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.adminSession.create({
    data: { adminId, tokenHash: hashToken(token), expiresAt },
  });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(COOKIE_NAME);
}

export async function getAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });
  if (!session || session.expiresAt < new Date() || !session.admin.active) return null;
  return session.admin;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
