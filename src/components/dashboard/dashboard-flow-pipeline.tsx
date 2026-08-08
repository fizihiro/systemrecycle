import {
  ArrowRight,
  Factory,
  Package,
  Recycle,
  RotateCcw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardAnalytics } from "@/lib/actions/dashboard";

const pipelineSteps = [
  {
    key: "distribution",
    label: "Distribution",
    sublabel: "Fertilizer sacks to farmers",
    icon: Package,
    flowColor: "bg-flow-1",
    iconColor: "text-sage-foreground bg-sage/40",
    connectorFrom: "from-flow-1",
    connectorTo: "to-flow-2",
    getValue: (data: DashboardAnalytics["kpis"]) => ({
      value: data.sacksDistributed,
      unit: "sacks",
      detail: undefined as string | undefined,
    }),
  },
  {
    key: "returns",
    label: "Returns",
    sublabel: "Pass & reject intake",
    icon: RotateCcw,
    flowColor: "bg-flow-2",
    iconColor: "text-teal-foreground bg-teal/20",
    connectorFrom: "from-flow-2",
    connectorTo: "to-flow-3",
    getValue: (data: DashboardAnalytics["kpis"]) => ({
      value: data.sacksReturnedPass + data.sacksReturnedReject,
      unit: "sacks",
      detail: `${data.sacksReturnedPass.toLocaleString()} pass`,
    }),
  },
  {
    key: "recycler",
    label: "To Recycler",
    sublabel: "Passed sacks only",
    icon: Recycle,
    flowColor: "bg-flow-3",
    iconColor: "text-white bg-white/20",
    lightText: true,
    connectorFrom: "from-flow-3",
    connectorTo: "to-flow-4",
    getValue: (data: DashboardAnalytics["kpis"]) => ({
      value: data.sacksToRecycler,
      unit: "sacks",
      detail: undefined as string | undefined,
    }),
  },
  {
    key: "manufacturing",
    label: "Manufacturing",
    sublabel: "Recycled material purchase",
    icon: Factory,
    flowColor: "bg-flow-4",
    iconColor: "text-white bg-white/20",
    lightText: true,
    connectorFrom: "from-flow-4",
    connectorTo: "to-flow-4",
    getValue: (data: DashboardAnalytics["kpis"]) => ({
      value: Math.round(data.totalPurchaseWeightKg),
      unit: "kg",
      detail: undefined as string | undefined,
    }),
  },
] as const;

function PipelineConnector({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  return (
    <div className="hidden flex-1 items-center px-1 lg:flex">
      <div
        className={cn(
          "h-1 w-full rounded-full bg-gradient-to-r",
          from,
          to,
        )}
      />
      <ArrowRight className="text-muted-foreground mx-1 size-4 shrink-0" />
    </div>
  );
}

export function DashboardFlowPipeline({ data }: { data: DashboardAnalytics }) {
  const returnRate = data.kpis.returnRate;

  return (
    <Card className="border-border/60 overflow-hidden shadow-md">
      <CardHeader className="border-b bg-gradient-to-r from-sage/30 via-background to-teal/10 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-heading text-lg tracking-tight">
              Circular Flow Pipeline
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl">
              End-to-end sack movement from fertilizer distribution through
              recycling to manufacturer purchase.
            </CardDescription>
          </div>
          <div className="bg-gold/15 text-gold-foreground inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-xs font-medium">
            <span className="bg-gold size-2 rounded-full" />
            {returnRate}% return rate
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon;
            const { value, unit, detail } = step.getValue(data.kpis);
            const isLast = index === pipelineSteps.length - 1;
            const lightText = "lightText" in step && step.lightText;

            return (
              <div key={step.key} className="flex flex-1 flex-col lg:flex-row">
                <div
                  className={cn(
                    "relative flex flex-1 flex-col rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md",
                    step.flowColor,
                    lightText ? "border-white/20" : "border-white/40",
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl shadow-sm",
                        step.iconColor,
                      )}
                    >
                      <Icon className="size-5" strokeWidth={2.25} />
                    </div>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        lightText
                          ? "bg-white/20 text-slate-100"
                          : "bg-white/50 text-foreground/70",
                      )}
                    >
                      Stage {index + 1}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "font-heading text-2xl font-bold tracking-tight",
                      lightText ? "text-white" : "text-foreground",
                    )}
                  >
                    {value.toLocaleString()}
                    <span
                      className={cn(
                        "ml-1 text-sm font-medium",
                        lightText ? "text-slate-100" : "text-foreground/70",
                      )}
                    >
                      {unit}
                    </span>
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm font-semibold",
                      lightText ? "text-white" : "text-foreground/90",
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs",
                      lightText ? "text-slate-100" : "text-muted-foreground",
                    )}
                  >
                    {step.sublabel}
                  </p>
                  {detail ? (
                    <p
                      className={cn(
                        "mt-2 text-xs font-medium",
                        lightText ? "text-slate-100" : "text-teal",
                      )}
                    >
                      {detail}
                    </p>
                  ) : null}
                </div>
                {!isLast ? (
                  <PipelineConnector
                    from={step.connectorFrom}
                    to={step.connectorTo}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="bg-flow-1 size-2.5 rounded-full" />
            Sage — Distribution
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-flow-2 size-2.5 rounded-full" />
            Mid-teal — Returns
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-flow-3 size-2.5 rounded-full" />
            Rich teal — Recycling
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-flow-4 size-2.5 rounded-full" />
            Deep teal — Manufacturing
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-gold size-2.5 rounded-full" />
            Gold — Performance highlight
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
