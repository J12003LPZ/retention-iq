import { Sidebar } from "@/components/shell/sidebar";
import { Topbar }  from "@/components/shell/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface text-on-surface">
      <Sidebar />
      <div className="relative z-10 flex min-h-screen flex-col lg:ml-[280px]">
        <Topbar />
        <main className="mx-auto w-full max-w-[1480px] flex-1 px-8 py-10 pb-24 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
