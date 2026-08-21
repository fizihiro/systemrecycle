import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DashboardAnalytics } from "@/lib/actions/dashboard";

function FarmerCard({
  title,
  icon: Icon,
  farmer,
  accent,
}: {
  title: string;
  icon: typeof TrendingUp;
  farmer: NonNullable<DashboardAnalytics["farmerPerformance"]["top"]>;
  accent: string;
}) {
  return (
    <div className={accent}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      <p className="font-heading text-lg font-bold">{farmer.farmerName}</p>
      <Separator className="my-3 opacity-60" />
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Return rate</dt>
          <dd className="font-semibold tabular-nums">{farmer.returnRate}%</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Returned / distributed</dt>
          <dd className="font-semibold tabular-nums">
            {farmer.returnedPassQty.toLocaleString()} /{" "}
            {farmer.distributedQty.toLocaleString()} pcs
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Discount earned</dt>
          <dd className="font-semibold tabular-nums">
            {farmer.actualDiscountRmFormatted}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Max potential discount</dt>
          <dd className="font-semibold tabular-nums">
            {farmer.potentialDiscountRmFormatted}
          </dd>
        </div>
      </dl>
      <div className="bg-background/60 mt-4 rounded-lg border p-3">
        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
          Savings Analysis
        </p>
        <p className="font-heading mt-1 text-2xl font-bold text-teal">
          {farmer.savingsPct}%
        </p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Percentage of original order value covered if repurchasing using
          accumulated discount credits (actual ÷ potential at 100% return).
        </p>
      </div>
    </div>
  );
}

export function DashboardFarmerPerformance({
  data,
}: {
  data: DashboardAnalytics;
}) {
  const { top, lowest } = data.farmerPerformance;

  if (!top) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Farmer Performance</CardTitle>
          <CardDescription>
            Top and lowest performing farmers by return rate and savings analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Farmer performance data will appear once distribution records exist.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sameFarmer = lowest && top.farmerId === lowest.farmerId;

  return (
    <Card className="border-border/60 overflow-hidden shadow-md">
      <CardHeader className="border-b bg-gradient-to-r from-gold/12 via-card to-sage/20 pb-4">
        <CardTitle className="font-heading text-lg tracking-tight">
          Farmer Performance &amp; Savings Analysis
        </CardTitle>
        <CardDescription>
          Highlights farmers at opposite ends of the return loop — and how much of
          their reorder could be funded by discount credits.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <FarmerCard
            title="Top Performing Farmer"
            icon={TrendingUp}
            farmer={top}
            accent="rounded-xl border border-teal/30 bg-teal/5 p-5"
          />
          {sameFarmer || !lowest ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed p-5 text-center">
              <div>
                <AlertTriangle className="text-muted-foreground mx-auto mb-2 size-5" />
                <p className="text-muted-foreground text-sm">
                  Only one qualifying farmer in the dataset (min. 10 sacks
                  distributed).
                </p>
              </div>
            </div>
          ) : (
            <FarmerCard
              title="Lowest Performing Farmer"
              icon={TrendingDown}
              farmer={lowest}
              accent="rounded-xl border border-destructive/25 bg-destructive/5 p-5"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
