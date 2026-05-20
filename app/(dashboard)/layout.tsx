import { Sidebar } from "@/components/shell/sidebar";
import { Topbar }  from "@/components/shell/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:ml-[260px]">
        <Topbar />
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-6 pb-20 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
