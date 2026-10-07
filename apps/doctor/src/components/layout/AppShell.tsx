import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** White navigation rail and content surfaces on a soft lavender canvas. */
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="portal-shell h-screen w-full md:p-4">
      <div className="flex h-full gap-4 overflow-hidden">
        {/* Desktop rail */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full shadow-xl">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main className="scroll-area flex-1 overflow-y-auto">
            <div className="portal-watermarked min-h-full bg-white px-4 py-5 md:px-3 md:py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
