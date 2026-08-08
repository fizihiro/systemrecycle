import {
  Factory,
  Leaf,
  Recycle,
  RotateCcw,
  Scale,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardAnalytics } from "@/lib/actions/dashboard";

const kpiConfig = [
  {
    key: "sacksDistributed",
    label: "Sacks Distributed",
    description: "Fertilizer sacks sent to farmers",
    icon: Leaf,
    accent: "border-l-teal bg-gradient-to-br from-teal/8 to-card",
    iconWrap: "bg-teal/15 text-teal",
    format: (data: DashboardAnalytics["kpis"]) => String(data.sacksDistributed),
  },
  {
    key: "returnRate",
    label: "Return Rate",
    description: "Passed sacks vs distributed",
    icon: RotateCcw,
    accent: "border-l-flow-2 bg-gradient-to-br from-sage/30 to-card",
    iconWrap: "bg-sage/50 text-sage-foreground",
    format: (data: DashboardAnalytics["kpis"]) => `${data.returnRate}%`,
    badge: (data: DashboardAnalytics["kpis"]) =>
      `${data.sacksReturnedPass.toLocaleString()} pass / ${data.sacksReturnedReject.toLocaleString()} reject`,
  },
  {
    key: "totalDiscountRmFormatted",
    label: "Total Discounts",
    description: "Farmer incentives issued",
    icon: Wallet,
    accent: "border-l-gold bg-gradient-to-br from-gold/12 to-card",
    iconWrap: "bg-gold/20 text-gold-foreground",
    format: (data: DashboardAnalytics["kpis"]) => data.totalDiscountRmFormatted,
  },
  {
    key: "totalInputWeightFormatted",
    label: "Recycler Input",
    description: "Plastic collected for processing",
    icon: Scale,
    accent: "border-l-primary bg-gradient-to-br from-primary/8 to-card",
    iconWrap: "bg-primary/12 text-primary",
    format: (data: DashboardAnalytics["kpis"]) => data.totalInputWeightFormatted,
    badge: (data: DashboardAnalytics["kpis"]) => `${data.recoveryRate}% recovery`,
  },
  {
    key: "farmers",
    label: "Farmers",
    description: "Registered in the system",
    icon: Users,
    accent: "border-l-flow-1 bg-gradient-to-br from-flow-1/40 to-card",
    iconWrap: "bg-sage/40 text-sage-foreground",
    format: (data: DashboardAnalytics["kpis"]) => String(data.farmers),
  },
  {
    key: "suppliers",
    label: "Suppliers",
    description: "Distribution & collection partners",
    icon: Truck,
    accent: "border-l-flow-2 bg-gradient-to-br from-flow-2/25 to-card",
    iconWrap: "bg-teal/15 text-teal",
    format: (data: DashboardAnalytics["kpis"]) => String(data.suppliers),
  },
  {
    key: "recyclers",
    label: "Recyclers",
    description: "Processing partners",
    icon: Recycle,
    accent: "border-l-flow-3 bg-gradient-to-br from-flow-3/15 to-card",
    iconWrap: "bg-primary/15 text-primary",
    format: (data: DashboardAnalytics["kpis"]) => String(data.recyclers),
  },
  {
    key: "totalSalesRevenueRmFormatted",
    label: "Sales Revenue",
    description: "Recycler to manufacturer sales",
    icon: Factory,
    accent: "border-l-flow-4 bg-gradient-to-br from-flow-4/12 to-card",
    iconWrap: "bg-gold/15 text-gold-foreground",
    format: (data: DashboardAnalytics["kpis"]) =>
      data.totalSalesRevenueRmFormatted,
  },
] as const;

export function DashboardKpiGrid({ data }: { data: DashboardAnalytics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiConfig.map((item) => {
        const Icon = item.icon;
        const badge =
          "badge" in item && item.badge ? item.badge(data.kpis) : null;

        return (
          <Card
            key={item.key}
            className={cn(
              "border-border/60 border-l-4 shadow-sm transition-shadow hover:shadow-md",
              item.accent,
            )}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1.5">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">
                  {item.label}
                </CardDescription>
                <CardTitle className="font-heading text-3xl font-bold tracking-tight">
                  {item.format(data.kpis)}
                </CardTitle>
              </div>
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  item.iconWrap,
                )}
              >
                <Icon className="size-5" strokeWidth={2.25} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <p className="text-muted-foreground text-sm leading-snug">
                {item.description}
              </p>
              {badge ? (
                <Badge
                  variant="secondary"
                  className="border-sage/40 bg-sage/25 font-normal text-sage-foreground"
                >
                  {badge}
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
