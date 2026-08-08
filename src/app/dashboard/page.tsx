import { BarChart3 } from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardFlowPipeline } from "@/components/dashboard/dashboard-flow-pipeline";
import { DashboardKpiGrid } from "@/components/dashboard/dashboard-kpi-grid";
import { getDashboardAnalytics } from "@/lib/actions/dashboard";

export default async function DashboardPage() {
  const analytics = await getDashboardAnalytics();

  return (
    <div className="flex flex-col gap-8 pb-6">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-sidebar via-sidebar/95 to-teal/30 p-6 text-sidebar-foreground shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="bg-gold/20 text-gold inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <BarChart3 className="size-3.5" />
              Circular Economy Overview
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Plastic Sack Recycling Dashboard
            </h1>
            <p className="text-sidebar-foreground/80 max-w-xl text-sm leading-relaxed sm:text-base">
              Real-time analytics for sack flow, processing weights, and farmer
              discount performance across the full recycling loop.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {[
              { label: "Distributed", value: analytics.kpis.sacksDistributed },
              { label: "Returned", value: analytics.kpis.sacksReturnedPass },
              { label: "To Recycler", value: analytics.kpis.sacksToRecycler },
              { label: "Return Rate", value: `${analytics.kpis.returnRate}%` },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
              >
                <p className="text-sidebar-foreground/70 text-[10px] font-medium uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="font-heading mt-1 text-lg font-bold">
                  {typeof item.value === "number"
                    ? item.value.toLocaleString()
                    : item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-teal/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-gold/10 blur-3xl" />
      </section>

      <DashboardKpiGrid data={analytics} />
      <DashboardFlowPipeline data={analytics} />
      <DashboardCharts data={analytics} />
    </div>
  );
}
