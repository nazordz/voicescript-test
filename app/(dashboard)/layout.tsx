"use client";

import { BottomNav } from "@/components/dashboard/BottomNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="main-sidebar" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex min-h-screen flex-col bg-base-200">
        <div className="navbar bg-base-100 shadow-sm lg:hidden">
          <label
            htmlFor="main-sidebar"
            className="btn btn-ghost drawer-button"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </label>
          <span className="text-lg font-semibold">Voicescript</span>
        </div>
        <section className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">{children}</section>
        <BottomNav />
      </div>
      <div className="drawer-side">
        <label
          htmlFor="main-sidebar"
          aria-label="Close sidebar"
          className="drawer-overlay"
        />
        <Sidebar />
      </div>
    </div>
  );
}
