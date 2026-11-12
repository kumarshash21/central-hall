import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

const NAME = "ch_admin";
const secret = () => process.env.SESSION_SECRET || "dev-secret";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

export function checkPassword(pw: string) {
  const a = Buffer.from(pw), b = Buffer.from(process.env.ADMIN_PASSWORD || "");
  return a.length === b.length && b.length > 0 && timingSafeEqual(a, b);
}

export async function startSession() {
  const exp = String(Date.now() + 8 * 3600_000);
  (await cookies()).set(NAME, `${exp}.${sign(exp)}`, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 8 * 3600,
    secure: process.env.NODE_ENV === "production",
  });
}
export async function endSession() { (await cookies()).delete(NAME); }

export async function isAdmin() {
  const v = (await cookies()).get(NAME)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
