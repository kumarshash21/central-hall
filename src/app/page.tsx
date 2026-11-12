import Link from "next/link";
import { q, TOOL_SELECT, type Tool, type Category } from "@/lib/db";
import ToolGrid from "@/components/ToolGrid";
import Nav from "@/components/Nav";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tools = await q<Tool>(`${TOOL_SELECT} WHERE t.published AND t.parent_id IS NULL ORDER BY t.sort_order < 0 DESC, t.featured DESC, t.sort_order, t.name`);
  const cats = await q<Category>("SELECT * FROM categories ORDER BY sort_order, name");
  const admin = await isAdmin();
  const ticker = [...tools, ...tools];
  return (
    <>
      <Nav right={<Link href="/admin" className="ghost">{admin ? "Dashboard" : "Admin"}</Link>} />
      <header className="hero">
        <div className="aurora" aria-hidden><b /><b /><b /></div>
        <div className="wrap">
          <span className="eyebrow mono">Leadership toolkit</span>
          <h1>Every tool. <span>One door.</span></h1>
          <p>Find, open and understand the tools the organisation runs on, without hunting through bookmarks or asking around.</p>
          <div className="stats">
            <div><b>{tools.length}</b><span className="mono">Tools</span></div>
            <div><b>{cats.length}</b><span className="mono">Categories</span></div>
          </div>
        </div>
      </header>
      {tools.length > 2 && (
        <div className="marquee" aria-hidden>
          <div className="track">
            {ticker.map((t, i) => <span key={i}><em>{t.icon}</em>{t.name}</span>)}
          </div>
        </div>
      )}
      <main className="wrap" style={{ paddingTop: 0 }}>
        <ToolGrid title="All tools" tools={tools} categories={cats.map((c) => c.name)} admin={admin} allCategories={cats} />
      </main>
    </>
  );
}
