import { FOOTER_COPY } from "./footerContent";

export default function AppFooter({ dark = false }) {
  return (
    <footer className={`no-print border-t px-5 py-4 text-center text-[11px] font-medium tracking-[0.12em] ${dark ? "border-white/10 text-white/45" : "border-slate-200 text-slate-400"}`}>
      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-500 align-middle" />
      {FOOTER_COPY}
    </footer>
  );
}
