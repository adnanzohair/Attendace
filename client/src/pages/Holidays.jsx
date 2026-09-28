import { useEffect, useState } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { api, messageOf } from "../services/api";
import { Empty, Modal, PageHeader } from "../components/ui";

export default function Holidays() {
  const [data, setData] = useState([]),
    [open, setOpen] = useState(false),
    [form, setForm] = useState({ date: "", name: "", description: "" }),
    [error, setError] = useState("");

  const load = () => api.get("/holidays").then((r) => setData(r.data));

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      await api.post("/holidays", form);
      setOpen(false);
      setForm({ date: "", name: "", description: "" });
      load();
    } catch (e) {
      setError(messageOf(e));
    }
  }

  async function remove(id) {
    if (confirm("Remove this holiday?")) {
      await api.delete(`/holidays/${id}`);
      load();
    }
  }

  return (
    <>
      <PageHeader
        title="Holiday calendar"
        subtitle="Company-wide holidays are excluded from attendance calculations."
      >
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={17} />
          Add holiday
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        {data.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Holiday</th>
                  <th>Description</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((x) => (
                  <tr key={x._id}>
                    <td className="font-mono text-xs text-slate-500">{x.date}</td>
                    <td className="cell-strong">{x.name}</td>
                    <td className="whitespace-normal text-slate-500">{x.description || "—"}</td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          className="btn-icon-danger"
                          title="Remove holiday"
                          aria-label={`Remove ${x.name}`}
                          onClick={() => remove(x._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No holidays configured" />
        )}
      </div>

      {open && (
        <Modal title="Add company holiday" onClose={() => setOpen(false)}>
          <form onSubmit={save}>
            {error && (
              <div className="alert-error mb-4">
                <AlertCircle size={17} className="mt-px shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <label className="block">
              <span className="label">Date</span>
              <input
                className="field"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>
            <label className="mt-4 block">
              <span className="label">Holiday name</span>
              <input
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Pakistan Day"
                required
              />
            </label>
            <label className="mt-4 block">
              <span className="label">Description</span>
              <textarea
                className="field"
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary">Save holiday</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
