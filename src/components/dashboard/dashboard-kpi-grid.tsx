import {
  AlertTriangle,
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

type KpiItem = {
  key: string;
  label: string;
  description: string;
  icon: typeof Leaf;
  accent: string;
  iconWrap: string;
  format: (analytics: DashboardAnalytics) => string;
  badge?: (analytics: DashboardAnalytics) => string;
};

const kpiConfig: KpiItem[] = [
  {
    key: "sacksDistributed",
    label: "Stage 1 · Distributed",
    description: "Sacks sent to farmers (pcs + estimated kg)",
    icon: Leaf,
    accent: "border-l-teal bg-gradient-to-br from-teal/8 to-card",
    iconWrap: "bg-teal/15 text-teal",
    format: ({ kpis }) => `${kpis.sacksDistributed.toLocaleString()} pcs`,
    badge: ({ kpis }) => kpis.distributedWeightFormatted,
  },
  {
    key: "sacksReturned",
    label: "Stage 2 · Returned",
    description: "Pass + reject intake at collection",
    icon: RotateCcw,
    accent: "border-l-flow-2 bg-gradient-to-br from-sage/30 to-card",
    iconWrap: "bg-sage/50 text-sage-foreground",
    format: ({ kpis }) => `${kpis.sacksReturnedTotal.toLocaleString()} pcs`,
    badge: ({ kpis }) =>
      `${kpis.returnedWeightFormatted} · ${kpis.returnRate}% pass rate`,
  },
  {
    key: "returnGap",
    label: "Return Gap",
    description: "Distributed sacks never returned",
    icon: AlertTriangle,
    accent: "border-l-destructive bg-gradient-to-br from-destructive/8 to-card",
    iconWrap: "bg-destructive/15 text-destructive",
    format: ({ leakages }) => `${leakages.returnGapPct}%`,
    badge: ({ leakages }) =>
      `${leakages.returnGapPieces.toLocaleString()} pcs lost`,
  },
  {
    key: "rejectRate",
    label: "Reject Rate",
    description: "Returned sacks failing quality check",
    icon: AlertTriangle,
    accent: "border-l-destructive bg-gradient-to-br from-destructive/6 to-card",
    iconWrap: "bg-destructive/12 text-destructive",
    format: ({ leakages }) => `${leakages.rejectRatePct}%`,
    badge: ({ kpis }) => `${kpis.sacksReturnedReject.toLocaleString()} reject pcs`,
  },
  {
    key: "discountCapture",
    label: "Discount Capture",
    description: "Actual incentives vs 100% return potential",
    icon: Wallet,
    accent: "border-l-gold bg-gradient-to-br from-gold/12 to-card",
    iconWrap: "bg-gold/20 text-gold-foreground",
    format: ({ kpis }) => `${kpis.discountCaptureRate}%`,
    badge: ({ kpis }) =>
      `${kpis.totalDiscountRmFormatted} / ${kpis.totalPotentialDiscountRmFormatted}`,
  },
  {
    key: "yieldLoss",
    label: "Recycling Yield Loss",
    description: "Weight lost from recycler output to manufacturer purchase",
    icon: Scale,
    accent: "border-l-primary bg-gradient-to-br from-primary/8 to-card",
    iconWrap: "bg-primary/12 text-primary",
    format: ({ leakages }) => `${leakages.recyclingYieldLossPct}%`,
    badge: ({ leakages }) =>
      `${leakages.yieldLossKg.toLocaleString("en-MY")} kg lost`,
  },
  {
    key: "farmers",
    label: "Farmers",
    description: "Registered in the system",
    icon: Users,
    accent: "border-l-flow-1 bg-gradient-to-br from-flow-1/40 to-card",
    iconWrap: "bg-sage/40 text-sage-foreground",
    format: ({ kpis }) => String(kpis.farmers),
  },
  {
    key: "recyclers",
    label: "Recyclers",
    description: "Processing partners",
    icon: Recycle,
    accent: "border-l-flow-3 bg-gradient-to-br from-flow-3/15 to-card",
    iconWrap: "bg-primary/15 text-primary",
    format: ({ kpis }) => String(kpis.recyclers),
    badge: ({ kpis }) =>
      `${kpis.totalInputWeightFormatted} input · ${kpis.recoveryRate}% recovery`,
  },
  {
    key: "suppliers",
    label: "Suppliers",
    description: "Distribution & collection partners",
    icon: Truck,
    accent: "border-l-flow-2 bg-gradient-to-br from-flow-2/25 to-card",
    iconWrap: "bg-teal/15 text-teal",
    format: ({ kpis }) => String(kpis.suppliers),
  },
  {
    key: "totalSalesRevenueRmFormatted",
    label: "Sales Revenue",
    description: "Recycler to manufacturer sales",
    icon: Factory,
    accent: "border-l-flow-4 bg-gradient-to-br from-flow-4/12 to-card",
    iconWrap: "bg-gold/15 text-gold-foreground",
    format: ({ kpis }) => kpis.totalSalesRevenueRmFormatted,
    badge: ({ kpis }) => kpis.totalPurchaseWeightFormatted,
  },
];

export function DashboardKpiGrid({ data }: { data: DashboardAnalytics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiConfig.map((item) => {
        const Icon = item.icon;
        const badge = item.badge?.(data);

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
                  {item.format(data)}
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
