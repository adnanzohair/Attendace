import { Sparkles } from "lucide-react";

export default function ComingSoon({ title }) {
  return (
    <div className="card grid min-h-[420px] place-items-center p-8 text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Sparkles size={24} />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Coming in Phase 2. The employee, attendance, finalization, and configurable payroll
          data model is ready for this module.
        </p>
      </div>
    </div>
  );
}
