"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
  returnedPass: { label: "Returned (Pass)", color: "var(--chart-2)" },
  toRecycler: { label: "To Recycler", color: "var(--chart-3)" },
} satisfies ChartConfig;

const discountConfig = {
  discountRm: { label: "Discount (RM)", color: "var(--chart-5)" },
} satisfies ChartConfig;

const discountByTypeConfig = {
  discountRm: { label: "Total Discount", color: "var(--chart-5)" },
} satisfies ChartConfig;

const weightConfig = {
  input: { label: "Input Weight", color: "var(--chart-3)" },
  output: { label: "Output Weight", color: "var(--chart-2)" },
  purchase: { label: "Purchase Weight", color: "var(--chart-4)" },
} satisfies ChartConfig;

const returnQualityConfig = {
  pass: { label: "Pass", color: "var(--chart-2)" },
  reject: { label: "Reject", color: "var(--chart-5)" },
} satisfies ChartConfig;

const supplierFlowConfig = {
  distributed: { label: "Distributed", color: "var(--chart-1)" },
  returned: { label: "Returned", color: "var(--chart-3)" },
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
      item.returnedPass > 0 ||
      item.returnedReject > 0 ||
      item.toRecycler > 0,
  );
  const hasDiscountData = data.discountBySackType.length > 0;
  const hasWeightData = data.weightTotals.some((item) => item.value > 0);
  const hasReturnQuality = data.returnQuality.some((item) => item.value > 0);
  const hasSupplierFlow = data.supplierFlow.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Sack Flow Over Time"
          description="Monthly comparison of distribution, returns, and recycler intake."
          accent="bg-gradient-to-r from-sage/25 via-card to-teal/10"
        >
          {hasSackFlow ? (
            <ChartContainer config={sackFlowConfig} className="aspect-[16/7] w-full">
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
                  dataKey="returnedPass"
                  type="monotone"
                  fill="var(--color-returnedPass)"
                  fillOpacity={0.4}
                  stroke="var(--color-returnedPass)"
                  strokeWidth={2}
                  stackId="b"
                />
                <Area
                  dataKey="toRecycler"
                  type="monotone"
                  fill="var(--color-toRecycler)"
                  fillOpacity={0.35}
                  stroke="var(--color-toRecycler)"
                  strokeWidth={2}
                  stackId="c"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyState message="Sack flow trends will appear once distribution and return transactions are recorded." />
          )}
        </ChartCard>

        <ChartCard
          title="Return Quality"
          description="Share of passed versus rejected sack returns."
          accent="bg-gradient-to-br from-flow-2/20 to-card"
        >
          {hasReturnQuality ? (
            <ChartContainer config={returnQualityConfig} className="mx-auto aspect-square max-h-[320px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString()} sacks`,
                        returnQualityConfig[name as keyof typeof returnQualityConfig]
                          ?.label ?? name,
                      ]}
                    />
                  }
                />
                <Pie
                  data={data.returnQuality}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={72}
                  outerRadius={110}
                  paddingAngle={4}
                  strokeWidth={2}
                >
                  {data.returnQuality.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={`var(--color-${entry.name})`}
                    />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="label" />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <EmptyState message="Return quality breakdown will appear after sack returns are recorded." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Weight Totals"
          description="Plastic weight across recycler processing and manufacturer purchase."
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
                  tickMargin={10}
                  interval={0}
                  angle={-8}
                  textAnchor="end"
                  height={56}
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
            <EmptyState message="Weight totals will appear after recycler deliveries and manufacturer sales are recorded." />
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
          title="Discount by Sack Type"
          description="Total discount value grouped by fertilizer sack catalog."
          accent="bg-gradient-to-r from-gold/12 via-card to-sage/20"
        >
          {hasDiscountData ? (
            <ChartContainer
              config={discountByTypeConfig}
              className="aspect-[16/8] w-full"
            >
              <BarChart
                data={data.discountBySackType}
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
                  width={112}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => [
                        formatCurrency(Number(value)),
                        `${item?.payload?.passQty ?? 0} pass qty`,
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="discountRm"
                  fill="var(--color-discountRm)"
                  radius={[0, 10, 10, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="Discount breakdown by sack type will appear once returns are recorded." />
          )}
        </ChartCard>

        <ChartCard
          title="Supplier Activity"
          description="Top suppliers by sacks distributed and returned."
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
                  tickMargin={10}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={64}
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
        <CardHeader className="border-b bg-gradient-to-r from-flow-4/10 via-card to-gold/10 pb-4">
          <CardTitle className="font-heading text-lg tracking-tight">
            Analytics Summary
          </CardTitle>
          <CardDescription>
            Key operational ratios derived from live transaction data.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryMetric
              label="Return Rate"
              value={`${data.kpis.returnRate}%`}
              detail={`${data.kpis.sacksReturnedPass.toLocaleString()} pass sacks from ${data.kpis.sacksDistributed.toLocaleString()} distributed.`}
              accent="border-l-4 border-l-flow-2 bg-gradient-to-br from-sage/25 to-card"
            />
            <SummaryMetric
              label="Recovery Rate"
              value={`${data.kpis.recoveryRate}%`}
              detail={`${data.kpis.totalOutputWeightFormatted} output from ${data.kpis.totalInputWeightFormatted} recycler input.`}
              accent="border-l-4 border-l-primary bg-gradient-to-br from-primary/8 to-card"
            />
            <SummaryMetric
              label="Incentive Spend"
              value={data.kpis.totalDiscountRmFormatted}
              detail="Total farmer discount value across all sack returns."
              accent="border-l-4 border-l-gold bg-gradient-to-br from-gold/12 to-card"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
