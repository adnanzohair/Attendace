import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Empty, PageHeader, StatusBadge } from "../components/ui";

export default function Exceptions() {
  const [data, setData] = useState([]),
    [status, setStatus] = useState("open");

  const load = () =>
    api.get("/attendance/exceptions", { params: { status } }).then((r) => setData(r.data));

  useEffect(() => {
    load();
  }, [status]);

  async function resolve(x) {
    await api.put(`/attendance/exceptions/${x._id}`, {
      status: "resolved",
      resolution: "Reviewed by HR",
    });
    load();
  }

  return (
    <>
      <PageHeader
        title="Attendance exceptions"
        subtitle="Records that need a human decision."
      />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
          <label>
            <span className="label">Status</span>
            <select
              className="field w-auto capitalize"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>open</option>
              <option>resolved</option>
              <option>ignored</option>
            </select>
          </label>
          <span className="ml-auto pb-2 text-xs font-medium text-slate-400">
            {data.length} exceptions
          </span>
        </div>

        {data.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Issue</th>
                  <th>Message</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((x) => (
                  <tr key={x._id}>
                    <td>{x.workDate || "—"}</td>
                    <td className="cell-strong">{x.employeeName || "Unknown"}</td>
                    <td className="font-mono text-xs text-slate-500">{x.employeeId || "—"}</td>
                    <td>
                      <StatusBadge value={x.type} />
                    </td>
                    <td className="max-w-sm truncate text-slate-500">{x.message}</td>
                    <td className="text-right">
                      {x.attendance ? (
                        <Link
                          className="btn-secondary btn-sm"
                          to={`/attendance/${x.attendance._id || x.attendance}`}
                        >
                          Review
                        </Link>
                      ) : status === "open" ? (
                        <button className="btn-secondary btn-sm" onClick={() => resolve(x)}>
                          Resolve
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text={`No ${status} exceptions.`} />
        )}
      </div>
    </>
  );
}
