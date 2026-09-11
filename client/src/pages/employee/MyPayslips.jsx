import { useEffect, useState } from "react";
import { Download, Eye, ExternalLink, X } from "lucide-react";
import { api, messageOf } from "../../services/api";
import { employeePayslipPdfUrl } from "../../utils/employeePayslipPdfUrl";

export default function MyPayslips() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/employee-portal/payslips")
      .then((response) => setItems(response.data.payslips))
      .catch((requestError) => setError(messageOf(requestError)));
  }, []);

  return <>
    {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}
    <div className="grid gap-4">
      {items.map((payslip) => <div className="card flex flex-wrap items-center justify-between gap-3 p-4" key={payslip._id}>
        <div><b>{payslip.periodStart} — {payslip.periodEnd}</b><div className="muted">Net payable: {payslip.currency} {Number(payslip.netSalary).toLocaleString()}</div></div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setSelected(payslip)}><Eye size={16}/> View full payslip</button>
          <a className="btn-primary" href={employeePayslipPdfUrl(payslip._id)}><Download size={16}/> Download PDF</a>
        </div>
      </div>)}
      {!items.length && <div className="card p-8 text-center muted">No payslips have been published yet.</div>}
    </div>

    {selected && <section className="card mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div><h2 className="text-lg font-bold">Published payslip</h2><p className="muted">{selected.periodStart} to {selected.periodEnd} · Exact emailed PDF format</p></div>
        <div className="flex flex-wrap gap-2">
          <a className="btn-secondary" href={employeePayslipPdfUrl(selected._id, true)} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Open full screen</a>
          <button type="button" className="btn-secondary" onClick={() => setSelected(null)}><X size={16}/> Close</button>
        </div>
      </div>
      <iframe className="h-[75vh] min-h-[650px] w-full bg-slate-100" src={employeePayslipPdfUrl(selected._id, true)} title={`Payslip ${selected.periodStart} to ${selected.periodEnd}`}/>
    </section>}
  </>;
}
