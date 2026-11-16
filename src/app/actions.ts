"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { q, log } from "@/lib/db";
import { requireAdmin, checkPassword, startSession, endSession } from "@/lib/auth";

export async function login(_: unknown, fd: FormData) {
  if (!checkPassword(String(fd.get("password") ?? ""))) return { error: "Wrong password" };
  await startSession();
  redirect("/");
}
export async function logout() { await endSession(); redirect("/"); }

const refresh = () => revalidatePath("/", "layout");

/** Add (id=null) or edit a card. */
export async function saveCard(id: number | null, fd: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const s = (k: string) => String(fd.get(k) ?? "").trim();
  const name = s("name");
  if (!name) return { error: "Name is required" };

  let url = s("url");
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try { new URL(url); } catch { return { error: "Please enter a valid link" }; }

  // category: pick an existing one or type a new one
  let categoryId: number | null = s("category_id") ? Number(s("category_id")) : null;
  const newCat = s("new_category");
  if (newCat) {
    const [c] = await q(
      "INSERT INTO categories(name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", [newCat]);
    categoryId = c.id;
  }

  const status = ["live", "beta", "deprecated"].includes(s("status")) ? s("status") : "live";
  const v = [name, s("description"), url, s("icon") || "🧰", categoryId, s("owner"), status,
    s("access_note"), fd.get("featured") === "on", fd.get("published") !== null, Number(s("sort_order")) || 0];
  if (id) {
    await q(`UPDATE tools SET name=$1,description=$2,url=$3,icon=$4,category_id=$5,owner=$6,status=$7,
      access_note=$8,featured=$9,published=$10,sort_order=$11,updated_at=now() WHERE id=$12`, [...v, id]);
    await log("edit card", name);
  } else {
    await q(`INSERT INTO tools(name,description,url,icon,category_id,owner,status,access_note,featured,published,sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, v);
    await log("add card", name);
  }
  refresh();
  return {};
}

export async function deleteTool(id: number) {
  await requireAdmin();
  const [t] = await q("DELETE FROM tools WHERE id=$1 RETURNING name", [id]);
  if (t) await log("delete card", t.name);
  refresh();
}

export async function togglePublished(id: number) {
  await requireAdmin();
  await q("UPDATE tools SET published = NOT published, updated_at=now() WHERE id=$1", [id]);
  refresh();
}

export async function addCategory(fd: FormData) {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  if (name) {
    await q("INSERT INTO categories(name) VALUES ($1) ON CONFLICT DO NOTHING", [name]);
    await log("add category", name);
  }
  refresh();
}

export async function deleteCategory(id: number) {
  await requireAdmin();
  const [c] = await q("DELETE FROM categories WHERE id=$1 RETURNING name", [id]);
  if (c) await log("delete category", c.name);
  refresh();
}
