import Link from "next/link";
import { q, TOOL_SELECT, type Tool, type Category } from "@/lib/db";
import Nav from "@/components/Nav";
import { requireAdmin } from "@/lib/auth";
import { logout, deleteTool, togglePublished, addCategory, deleteCategory } from "../actions";

export const dynamic = "force-dynamic";

export default async function Admin() {
  await requireAdmin();
  const tools = await q<Tool>(`${TOOL_SELECT} ORDER BY COALESCE(t.parent_id,t.id), t.parent_id NULLS FIRST, t.sort_order, t.name`);
  const cats = await q<Category>("SELECT * FROM categories ORDER BY sort_order, name");
  const logs = await q<{ id: number; action: string; detail: string; created_at: string }>(
    "SELECT * FROM audit_log ORDER BY id DESC LIMIT 15");
  return (
    <>
    <Nav />
    <main className="wrap">
      <div className="row">
        <h1 className="page-title">Admin</h1>
        <div className="actions">
          <Link href="/" className="ghost">View site</Link>
          <form action={logout}><button className="ghost">Log out</button></form>
        </div>
      </div>

      <section>
        <div className="row"><h2>Tools ({tools.length})</h2><Link className="btn" href="/">Edit cards on the site</Link></div>
        <div className="table-wrap"><table>
          <thead><tr><th></th><th>Name</th><th>Under</th><th>Category</th><th>Status</th><th>Clicks</th><th>Visible</th><th></th></tr></thead>
          <tbody>
            {tools.map((t) => (
              <tr key={t.id}>
                <td>{t.icon}</td>
                <td><b>{t.name}</b>{t.is_group && <small className="muted"> · group · {t.child_count} inside</small>}<br /><small className="muted">{t.url}</small></td>
                <td>{t.parent_id ? tools.find((p) => p.id === t.parent_id)?.name : "—"}</td>
                <td>{t.category_name ?? "—"}</td>
                <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                <td>{t.clicks}</td>
                <td><form action={togglePublished.bind(null, t.id)}><button className="link">{t.published ? "Published" : "Hidden"}</button></form></td>
                <td className="actions">
                  <form action={deleteTool.bind(null, t.id)}><button className="link danger">Delete</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>

      <section>
        <h2>Categories</h2>
        <div className="chips">
          {cats.map((c) => (
            <form key={c.id} action={deleteCategory.bind(null, c.id)} className="chip">
              {c.name} <button className="link danger" title="Delete">✕</button>
            </form>
          ))}
        </div>
        <form action={addCategory} className="inline">
          <input name="name" placeholder="New category" required />
          <button className="btn">Add</button>
        </form>
      </section>

      <section>
        <h2>Recent changes</h2>
        <ul className="log">
          {logs.map((l) => <li key={l.id}><b>{l.action}</b> — {l.detail} <small className="muted">{new Date(l.created_at).toLocaleString()}</small></li>)}
        </ul>
      </section>
    </main>
    </>
  );
}
