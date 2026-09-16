import {
  AlertTriangle,
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
    key: "sacksCollected",
    label: "Stage 2 · Collected",
    description: "Empty sacks collected from farmers",
    icon: RotateCcw,
    accent: "border-l-flow-2 bg-gradient-to-br from-sage/30 to-card",
    iconWrap: "bg-sage/50 text-sage-foreground",
    format: ({ kpis }) => `${kpis.sacksCollected.toLocaleString()} pcs`,
    badge: ({ kpis }) =>
      `${kpis.collectedWeightFormatted} · ${kpis.collectionRate}% collected`,
  },
  {
    key: "recoveryYield",
    label: "Stage 3 · Recovery Yield",
    description: "Collector processing output vs input weight",
    icon: Scale,
    accent: "border-l-primary bg-gradient-to-br from-primary/8 to-card",
    iconWrap: "bg-primary/12 text-primary",
    format: ({ kpis }) => `${kpis.recoveryYieldPct}%`,
    badge: ({ kpis }) =>
      `${kpis.totalOutputWeightFormatted} / ${kpis.totalInputWeightFormatted}`,
  },
  {
    key: "returnGap",
    label: "Return Gap",
    description: "Distributed sacks not yet returned",
    icon: AlertTriangle,
    accent: "border-l-destructive bg-gradient-to-br from-destructive/8 to-card",
    iconWrap: "bg-destructive/15 text-destructive",
    format: ({ leakages }) => `${leakages.returnGapPct}%`,
    badge: ({ leakages }) =>
      `${leakages.returnGapPieces.toLocaleString()} pcs unreturned`,
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
    key: "farmers",
    label: "Farmers",
    description: "Registered in the system",
    icon: Users,
    accent: "border-l-flow-1 bg-gradient-to-br from-flow-1/40 to-card",
    iconWrap: "bg-sage/40 text-sage-foreground",
    format: ({ kpis }) => String(kpis.farmers),
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
    key: "collectors",
    label: "Collectors",
    description: "Collection & recovery hubs",
    icon: Recycle,
    accent: "border-l-flow-3 bg-gradient-to-br from-flow-3/15 to-card",
    iconWrap: "bg-primary/15 text-primary",
    format: ({ kpis }) => String(kpis.collectors),
    badge: ({ kpis }) => `${kpis.totalInputWeightFormatted} processed`,
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
