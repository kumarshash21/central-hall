"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Tool, Category } from "@/lib/db";
import { deleteTool } from "@/app/actions";
import CardModal from "./CardModal";

function hue(name?: string | null) {
  if (!name) return 160;
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export default function ToolGrid({ tools, categories, admin = false, parentId = null, allCategories = [], title = "All tools" }: {
  title?: string; tools: Tool[]; categories: string[]; admin?: boolean; parentId?: number | null; allCategories?: Category[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [cat, setCat] = useState("All");
  const [modal, setModal] = useState<{ tool?: Tool } | null>(null);
  const [, start] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function spot(e: React.PointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  const list = useMemo(() => {
    const t = text.toLowerCase();
    return tools.filter(
      (x) =>
        (cat === "All" || x.category_name === cat) &&
        (!t || `${x.name} ${x.description} ${x.owner}`.toLowerCase().includes(t)),
    );
  }, [tools, text, cat]);

  function remove(t: Tool) {
    const warn = t.is_group ? ` This also deletes the ${t.child_count} card(s) inside it.` : "";
    if (confirm(`Delete "${t.name}"?${warn}`)) start(async () => { await deleteTool(t.id); router.refresh(); });
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-h">
          <h2>{title}</h2>
          <div className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input ref={searchRef} placeholder="Search tools" aria-label="Search tools" value={text} onChange={(e) => setText(e.target.value)} />
            <kbd>⌘K</kbd>
          </div>
        </div>
        {categories.length > 0 && (
          <div className="chips">
            {["All", ...categories].map((c) => (
              <button key={c} className={c === cat ? "chip on" : "chip"} onClick={() => setCat(c)}>
                {c}<small>{c === "All" ? tools.length : tools.filter((x) => x.category_name === c).length}</small>
              </button>
            ))}
          </div>
        )}
      </div>
      {list.length === 0 && !admin && <p className="empty" style={{ display: "block" }}>{text ? "Nothing matches that search." : "No cards here yet."}</p>}
      <div className="grid">
        {list.map((t, i) => (
          <div key={t.id} className={`cardwrap ${t.featured ? "xl" : t.is_group ? "wide" : ""}`} style={{ "--i": i } as React.CSSProperties}>
            <a className={t.is_group ? "card group" : "card"} onPointerMove={spot} style={{ "--h": hue(t.category_name) } as React.CSSProperties}
              href={t.is_group ? `/group/${t.id}` : `/go/${t.id}`}>
              <span className="ghosticon" aria-hidden>{t.icon}</span>
              <div className="card-top">
                <span className="icon">{t.icon}</span>
                <span className={`badge ${t.status}`}>{t.status}</span>
              </div>
              <div className="card-body">
                <h3>{t.name}{t.featured && (
                  <svg className="star" viewBox="0 0 24 24" fill="currentColor" aria-label="Featured"><path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" /></svg>
                )}</h3>
                <p>{t.description}</p>
                {t.featured && t.access_note && <div className="note">Access · {t.access_note}</div>}
              </div>
              <div className="card-foot">
                <div className="meta">
                  {t.category_name && <span className="tag">{t.category_name}</span>}
                  {t.owner && <span className="tag">{t.owner}</span>}
                  {t.is_group && <span className="tag">{t.child_count} inside</span>}
                </div>
                <span className="go"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
              </div>
            </a>
            {admin && (
              <div className="tools-ctl">
                <button title="Edit" aria-label="Edit" onClick={() => setModal({ tool: t })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg></button>
                <button className="del" title="Delete" aria-label="Delete" onClick={() => remove(t)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg></button>
              </div>
            )}
          </div>
        ))}
        {admin && (
          <button className="card add" onClick={() => setModal({})} aria-label="Add card">
            <span className="plus">+</span>Add card
          </button>
        )}
      </div>
      {modal && (
        <CardModal tool={modal.tool} parentId={parentId} categories={allCategories} onClose={() => setModal(null)} />
      )}
    </>
  );
}
