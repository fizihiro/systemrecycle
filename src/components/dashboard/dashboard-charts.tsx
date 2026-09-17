"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import type { DashboardAnalytics } from "@/lib/actions/dashboard";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/crud/shared";
import { cn } from "@/lib/utils";

const sackFlowConfig = {
  distributed: { label: "Distributed", color: "var(--chart-1)" },
  collected: { label: "Collected", color: "var(--chart-2)" },
  toCollector: { label: "To Collector", color: "var(--chart-3)" },
} satisfies ChartConfig;

const discountConfig = {
  discountRm: { label: "Discount (RM)", color: "var(--chart-5)" },
} satisfies ChartConfig;

const discountComparisonConfig = {
  actualDiscountRm: { label: "Actual Discount", color: "var(--chart-5)" },
  potentialDiscountRm: { label: "Max Potential", color: "var(--chart-2)" },
} satisfies ChartConfig;

const weightConfig = {
  distributed: { label: "Distributed (est.)", color: "var(--chart-1)" },
  collected: { label: "Collected (est.)", color: "var(--chart-2)" },
  input: { label: "Collector Input", color: "var(--chart-3)" },
  output: { label: "Collector Output", color: "var(--chart-4)" },
} satisfies ChartConfig;

const supplierFlowConfig = {
  distributed: { label: "Distributed", color: "var(--chart-1)" },
  returned: { label: "Collected", color: "var(--chart-3)" },
} satisfies ChartConfig;

function ChartCard({
  title,
  description,
  children,
  className,
  accent,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <Card
      className={cn(
        "border-border/60 overflow-hidden shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <CardHeader
        className={cn(
          "border-b pb-3",
          accent ?? "bg-gradient-to-r from-muted/40 to-card",
        )}
      >
        <CardTitle className="font-heading text-base tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-sm",
        accent,
      )}
    >
      <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
        {label}
      </p>
      <p className="font-heading mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <Separator className="my-3 opacity-60" />
      <p className="text-muted-foreground text-sm leading-relaxed">{detail}</p>
    </div>
  );
}

export function DashboardCharts({ data }: { data: DashboardAnalytics }) {
  const hasSackFlow = data.sackFlowMonthly.some(
    (item) =>
      item.distributed > 0 ||
      item.collected > 0 ||
      item.toCollector > 0,
  );
  const hasDiscountData = data.discountComparison.length > 0;
  const hasWeightData = data.weightTotals.some((item) => item.value > 0);
  const hasSupplierFlow = data.supplierFlow.length > 0;

  return (
    <div className="space-y-6">
      <ChartCard
        title="Sack Flow Over Time"
        description="Monthly comparison of distributed sacks, collected sacks, and collector delivery."
        accent="bg-gradient-to-r from-sage/25 via-card to-teal/10"
      >
        {hasSackFlow ? (
          <ChartContainer config={sackFlowConfig} className="aspect-[16/6] w-full">
            <AreaChart data={data.sackFlowMonthly} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="distributed"
                type="monotone"
                fill="var(--color-distributed)"
                fillOpacity={0.35}
                stroke="var(--color-distributed)"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="collected"
                type="monotone"
                fill="var(--color-collected)"
                fillOpacity={0.4}
                stroke="var(--color-collected)"
                strokeWidth={2}
                stackId="b"
              />
              <Area
                dataKey="toCollector"
                type="monotone"
                fill="var(--color-toCollector)"
                fillOpacity={0.35}
                stroke="var(--color-toCollector)"
                strokeWidth={2}
                stackId="c"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <EmptyState message="Sack flow trends will appear once distribution and collection transactions are recorded." />
        )}
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Weight Totals by Stage"
          description="Material weight across distribution, collection, and collector recovery."
          accent="bg-gradient-to-r from-primary/8 to-card"
        >
          {hasWeightData ? (
            <ChartContainer config={weightConfig} className="aspect-[16/8] w-full">
              <BarChart data={data.weightTotals} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} width={56} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        `${Number(value).toLocaleString()} kg`,
                        "Weight",
                      ]}
                    />
                  }
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {data.weightTotals.map((entry) => (
                    <Cell key={entry.stage} fill={`var(--color-${entry.fill})`} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="Weight totals will appear after distribution, returns, and collector deliveries are recorded." />
          )}
        </ChartCard>

        <ChartCard
          title="Discount Trend"
          description="Monthly total discount value issued to farmers."
          accent="bg-gradient-to-r from-gold/15 to-card"
        >
          {data.discountMonthly.length > 0 ? (
            <ChartContainer config={discountConfig} className="aspect-[16/8] w-full">
              <AreaChart data={data.discountMonthly} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis tickLine={false} axisLine={false} width={56} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "Discount",
                      ]}
                    />
                  }
                />
                <Area
                  dataKey="discountRm"
                  type="monotone"
                  fill="var(--color-discountRm)"
                  fillOpacity={0.35}
                  stroke="var(--color-discountRm)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyState message="Discount trends will appear after sack returns with discounts are recorded." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Discount Analysis: Actual vs Potential"
          description="Actual discount earned compared to maximum potential if 100% of distributed sacks were returned."
          accent="bg-gradient-to-r from-gold/12 via-card to-sage/20"
        >
          {hasDiscountData ? (
            <ChartContainer
              config={discountComparisonConfig}
              className="aspect-[16/9] w-full"
            >
              <BarChart
                data={data.discountComparison}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="sackType"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tickFormatter={(value) =>
                    value.length > 15 ? value.substring(0, 15) + "..." : value
                  }
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }

                    const row = payload[0]?.payload as DashboardAnalytics["discountComparison"][number];
                    const actual = row?.actualDiscountRm ?? 0;
                    const potential = row?.potentialDiscountRm ?? 0;

                    return (
                      <div className="grid min-w-52 gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                        <p className="font-medium leading-snug">{label}</p>
                        <div className="grid gap-1.5 border-t pt-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Actual earned</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatCurrency(actual)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Max potential</span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatCurrency(potential)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Capture rate</span>
                            <span className="font-mono font-medium tabular-nums">
                              {row?.captureRate ?? 0}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Distributed</span>
                            <span className="font-mono font-medium tabular-nums">
                              {(row?.distributedQty ?? 0).toLocaleString("en-MY")} pcs
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="actualDiscountRm"
                  fill="var(--color-actualDiscountRm)"
                  radius={[0, 6, 6, 0]}
                  barSize={14}
                />
                <Bar
                  dataKey="potentialDiscountRm"
                  fill="var(--color-potentialDiscountRm)"
                  radius={[0, 6, 6, 0]}
                  barSize={14}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="Discount breakdown by sack type will appear once returns are recorded." />
          )}
        </ChartCard>

        <ChartCard
          title="Supplier Activity"
          description="Top suppliers by sacks distributed and collected."
          accent="bg-gradient-to-r from-teal/10 to-card"
        >
          {hasSupplierFlow ? (
            <ChartContainer config={supplierFlowConfig} className="aspect-[16/8] w-full">
              <BarChart data={data.supplierFlow} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="distributed"
                  fill="var(--color-distributed)"
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  dataKey="returned"
                  fill="var(--color-returned)"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="Supplier activity will appear once distribution and return records exist." />
          )}
        </ChartCard>
      </div>

      <Card className="border-border/60 overflow-hidden shadow-md">
        <CardHeader className="border-b bg-gradient-to-r from-flow-3/10 via-card to-gold/10 pb-4">
          <CardTitle className="font-heading text-lg tracking-tight">
            Analytics Summary
          </CardTitle>
          <CardDescription>
            Key operational ratios derived from live circular transaction data.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryMetric
              label="Collection Rate"
              value={`${data.kpis.collectionRate}%`}
              detail={`${data.kpis.sacksCollected.toLocaleString()} of ${data.kpis.sacksDistributed.toLocaleString()} distributed sacks collected.`}
              accent="border-l-4 border-l-flow-2 bg-gradient-to-br from-sage/30 to-card"
            />
            <SummaryMetric
              label="Recovery Yield"
              value={`${data.kpis.recoveryYieldPct}%`}
              detail={`${data.kpis.totalOutputWeightFormatted} recovered from ${data.kpis.totalInputWeightFormatted} collector input weight.`}
              accent="border-l-4 border-l-primary bg-gradient-to-br from-primary/8 to-card"
            />
            <SummaryMetric
              label="Discount Capture"
              value={`${data.kpis.discountCaptureRate}%`}
              detail={`${data.kpis.totalDiscountRmFormatted} earned of ${data.kpis.totalPotentialDiscountRmFormatted} max potential at 100% return.`}
              accent="border-l-4 border-l-gold bg-gradient-to-br from-gold/12 to-card"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
