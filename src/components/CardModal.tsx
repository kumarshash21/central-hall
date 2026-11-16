"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCard } from "@/app/actions";
import type { Tool, Category } from "@/lib/db";

export default function CardModal({ tool, categories, onClose }: {
  tool?: Tool; categories: Category[]; onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await saveCard(tool?.id ?? null, fd);
      if (r.error) return setError(r.error);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal form" onSubmit={submit}>
        <h2>{tool ? "Edit card" : "Add card"}</h2>
        <label>Name *<input name="name" required autoFocus defaultValue={tool?.name} /></label>
        <label>Description<textarea name="description" rows={2} defaultValue={tool?.description} /></label>
        <label>Link (URL) *
          <input name="url" required defaultValue={tool?.url} placeholder="https://…" />
        </label>
        <div className="two">
          <label>Icon (emoji)<input name="icon" defaultValue={tool?.icon ?? "🧰"} maxLength={8} /></label>
          <label>Status
            <select name="status" defaultValue={tool?.status ?? "live"}>
              <option value="live">Live</option><option value="beta">Beta</option><option value="deprecated">Deprecated</option>
            </select>
          </label>
        </div>
        <div className="two">
          <label>Category
            <select name="category_id" defaultValue={tool?.category_id ?? ""}>
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>…or new category<input name="new_category" placeholder="Type to create" /></label>
        </div>
        <input type="hidden" name="owner" defaultValue={tool?.owner} />
        <label>Access note<input name="access_note" defaultValue={tool?.access_note} placeholder="e.g. VPN only" /></label>
        <label>Sort order (lower = earlier)<input name="sort_order" type="number" defaultValue={tool?.sort_order ?? 0} /></label>
        <div className="checks">
          <label className="check"><input type="checkbox" name="published" defaultChecked={tool?.published ?? true} /> Published</label>
          <label className="check"><input type="checkbox" name="featured" defaultChecked={tool?.featured ?? false} /> Featured</label>
        </div>
        {error && <p className="err">{error}</p>}
        <div className="actions end">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
