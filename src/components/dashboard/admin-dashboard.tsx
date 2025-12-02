'use client';

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RevenueCard } from "./revenue-card";
import { useEffect, useState } from "react";
import { getRevenueData } from "@/lib/actions/dashboard";
import { Skeleton } from "../ui/skeleton";
import { DollarSign, Wallet } from "lucide-react";

type RevenueData = {
  dailyRevenue: number;
  monthlyRevenue: number;
}

export function AdminDashboard() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        setIsLoading(true);
        const data = await getRevenueData();
        setRevenueData(data);
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRevenue();
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
           {isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <RevenueCard
                title="Today's Revenue"
                amount={revenueData?.dailyRevenue ?? 0}
                icon={DollarSign}
                description="Total revenue for today"
              />
              <RevenueCard
                title="This Month's Revenue"
                amount={revenueData?.monthlyRevenue ?? 0}
                icon={Wallet}
                description="Total revenue for this month"
              />
            </>
          )}
        </div>
        <DashboardClient />
      </main>
    </div>
  );
}
