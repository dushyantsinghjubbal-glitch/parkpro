'use client';

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export function AdminDashboard() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-6">
        <DashboardClient />
      </main>
    </div>
  );
}
