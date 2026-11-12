import Link from "next/link";
import { notFound } from "next/navigation";
import { q, TOOL_SELECT, type Tool, type Category } from "@/lib/db";
import ToolGrid from "@/components/ToolGrid";
import Nav from "@/components/Nav";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Group({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [parent] = await q<Tool>(`${TOOL_SELECT} WHERE t.id=$1 AND t.is_group AND t.published`, [Number(id) || 0]);
  if (!parent) notFound();
  const kids = await q<Tool>(`${TOOL_SELECT} WHERE t.parent_id=$1 AND t.published ORDER BY t.featured DESC, t.sort_order, t.name`, [parent.id]);
  const allCats = await q<Category>("SELECT * FROM categories ORDER BY sort_order, name");
  const admin = await isAdmin();
  const cats = [...new Set(kids.map((k) => k.category_name).filter(Boolean))] as string[];
  return (
    <>
      <Nav right={<Link href="/admin" className="ghost">{admin ? "Dashboard" : "Admin"}</Link>} />
      <header className="hero">
        <div className="aurora" aria-hidden><b /><b /><b /></div>
        <div className="wrap" style={{ paddingTop: 56 }}>
          <Link href="/" className="back">← All tools</Link>
          <div className="hero-icon">{parent.icon}</div>
          <h1 style={{ fontSize: "clamp(40px,7vw,84px)" }}>{parent.name}</h1>
          {parent.description && <p>{parent.description}</p>}
        </div>
      </header>
      <main className="wrap" style={{ paddingTop: 0 }}>
        <ToolGrid title={`${kids.length} ${kids.length === 1 ? "card" : "cards"}`} tools={kids} categories={cats} admin={admin} parentId={parent.id} allCategories={allCats} />
      </main>
    </>
  );
}
