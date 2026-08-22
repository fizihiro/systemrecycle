import { BarChart3 } from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardFarmerPerformance } from "@/components/dashboard/dashboard-farmer-performance";
import { DashboardFlowPipeline } from "@/components/dashboard/dashboard-flow-pipeline";
import { DashboardKpiGrid } from "@/components/dashboard/dashboard-kpi-grid";
import { getDashboardAnalytics } from "@/lib/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const analytics = await getDashboardAnalytics();

  return (
    <div className="relative flex flex-col gap-8 pb-14">
      <section className="rounded-2xl border border-border/60 bg-sidebar p-6 text-sidebar-foreground shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="bg-gold/20 text-gold inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <BarChart3 className="size-3.5" />
              Circularity &amp; Financial Incentives
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Sack2Loop Dashboard
            </h1>
            <p className="text-sidebar-foreground/85 max-w-xl text-sm leading-relaxed sm:text-base">
              Track material leakages across the closed-loop chain, compare actual
              vs potential farmer discounts, and monitor weight-normalised flow
              from distribution through recycling.
            </p>
          </div>
          <div className="grid w-full max-w-xl shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
            {[
              {
                label: "Stage 1 · Distributed",
                value: `${analytics.kpis.sacksDistributed.toLocaleString()} pcs`,
                sub: analytics.kpis.distributedWeightFormatted,
              },
              {
                label: "Stage 2 · Returned",
                value: `${analytics.kpis.sacksReturnedTotal.toLocaleString()} pcs`,
                sub: analytics.kpis.returnedWeightFormatted,
              },
              {
                label: "Return Gap",
                value: `${analytics.leakages.returnGapPct}%`,
                sub: "never returned",
              },
              {
                label: "Reject Rate",
                value: `${analytics.leakages.rejectRatePct}%`,
                sub: "failed QC",
              },
              {
                label: "Yield Loss",
                value: `${analytics.leakages.recyclingYieldLossPct}%`,
                sub: "recycler → mfg",
              },
              {
                label: "Discount Capture",
                value: `${analytics.kpis.discountCaptureRate}%`,
                sub: "actual vs potential",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-sidebar-foreground/15 bg-sidebar-foreground/10 px-3 py-2.5"
              >
                <p className="text-sidebar-foreground/75 text-[10px] font-medium uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="font-heading mt-1 text-lg font-bold text-sidebar-foreground">
                  {item.value}
                </p>
                <p className="text-sidebar-foreground/65 text-[10px]">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DashboardFlowPipeline data={analytics} />
      <DashboardFarmerPerformance data={analytics} />
      <DashboardKpiGrid data={analytics} />
      <DashboardCharts data={analytics} />

      <p
        className="text-muted-foreground/35 pointer-events-none absolute bottom-0 left-0 select-none text-sm font-medium tracking-[0.2em] uppercase"
        aria-hidden
      >
        ByRecytra
      </p>
    </div>
  );
}
