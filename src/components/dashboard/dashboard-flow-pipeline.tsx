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
import { estimateSackWeightKg } from "@/lib/dashboard/constants";
import type { DashboardAnalytics } from "@/lib/actions/dashboard";

const pipelineSteps = [
  {
    key: "distribution",
    stage: 1,
    label: "Distribution",
    sublabel: "Sacks distributed to farmers",
    icon: Package,
    flowColor: "bg-flow-1",
    iconColor: "text-sage-foreground bg-sage/40",
    connectorFrom: "from-flow-1",
    connectorTo: "to-flow-2",
    lightText: false,
    dualUnits: true,
    getMetrics: (data: DashboardAnalytics["kpis"]) => ({
      pcs: data.sacksDistributed,
      kg: data.distributedWeightKg,
      detail: undefined as string | undefined,
    }),
  },
  {
    key: "returns",
    stage: 2,
    label: "Returns",
    sublabel: "Pass & reject intake",
    icon: RotateCcw,
    flowColor: "bg-flow-2",
    iconColor: "text-teal-foreground bg-teal/20",
    connectorFrom: "from-flow-2",
    connectorTo: "to-flow-3",
    lightText: false,
    dualUnits: true,
    getMetrics: (data: DashboardAnalytics["kpis"]) => ({
      pcs: data.sacksReturnedTotal,
      kg: data.returnedWeightKg,
      detail: `${data.sacksReturnedPass.toLocaleString()} pass · ${data.sacksReturnedReject.toLocaleString()} reject`,
    }),
  },
  {
    key: "recycler",
    stage: 3,
    label: "To Recycler",
    sublabel: "Passed sacks forwarded",
    icon: Recycle,
    flowColor: "bg-flow-3",
    iconColor: "text-white bg-white/20",
    connectorFrom: "from-flow-3",
    connectorTo: "to-flow-4",
    lightText: true,
    dualUnits: true,
    getMetrics: (data: DashboardAnalytics["kpis"]) => ({
      pcs: data.sacksToRecycler,
      kg: estimateSackWeightKg(data.sacksToRecycler),
      detail: data.totalInputWeightFormatted,
    }),
  },
  {
    key: "manufacturing",
    stage: 4,
    label: "Manufacturing",
    sublabel: "Recycled material purchase",
    icon: Factory,
    flowColor: "bg-flow-4",
    iconColor: "text-white bg-white/20",
    connectorFrom: "from-flow-4",
    connectorTo: "to-flow-4",
    lightText: true,
    dualUnits: false,
    getMetrics: (data: DashboardAnalytics["kpis"]) => ({
      pcs: null as number | null,
      kg: data.totalPurchaseWeightKg,
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
    <div className="hidden flex-1 items-center px-2 lg:flex">
      <div
        className={cn(
          "h-1 w-full rounded-full bg-gradient-to-r",
          from,
          to,
        )}
      />
      <ArrowRight
        className="text-muted-foreground mx-1.5 size-4 shrink-0"
        strokeWidth={2.25}
      />
    </div>
  );
}

function MetricDisplay({
  pcs,
  kg,
  dualUnits,
  lightText,
}: {
  pcs: number | null;
  kg: number;
  dualUnits: boolean;
  lightText: boolean;
}) {
  if (dualUnits && pcs !== null) {
    return (
      <div className="space-y-1">
        <p
          className={cn(
            "font-heading text-2xl font-bold tracking-tight tabular-nums",
            lightText ? "text-white" : "text-foreground",
          )}
        >
          {pcs.toLocaleString()}
          <span
            className={cn(
              "ml-1.5 text-sm font-semibold",
              lightText ? "text-slate-100" : "text-foreground/75",
            )}
          >
            pcs
          </span>
        </p>
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            lightText ? "text-slate-100/90" : "text-muted-foreground",
          )}
        >
          {kg.toLocaleString("en-MY")} kg
          <span className="ml-1 text-xs font-normal opacity-80">(est.)</span>
        </p>
      </div>
    );
  }

  return (
    <p
      className={cn(
        "font-heading text-2xl font-bold tracking-tight tabular-nums",
        lightText ? "text-white" : "text-foreground",
      )}
    >
      {kg.toLocaleString("en-MY")}
      <span
        className={cn(
          "ml-1.5 text-sm font-semibold",
          lightText ? "text-slate-100" : "text-foreground/75",
        )}
      >
        kg
      </span>
    </p>
  );
}

export function DashboardFlowPipeline({ data }: { data: DashboardAnalytics }) {
  const { returnRate } = data.kpis;

  return (
    <Card className="border-border/60 overflow-hidden shadow-md">
      <CardHeader className="border-b bg-gradient-to-r from-sage/30 via-background to-teal/10 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-heading text-lg tracking-tight">
              Sack2Loop Flow Pipeline
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-relaxed">
              Linear view of sack movement from distribution through returns,
              recycling, and manufacturer purchase. Stages 1–3 show pcs with
              estimated weight at 0.1 kg per sack.
            </CardDescription>
          </div>
          <div className="bg-gold/15 text-gold-foreground inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-xs font-medium">
            <span className="bg-gold size-2 rounded-full" />
            {returnRate}% return rate
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon;
            const { pcs, kg, detail } = step.getMetrics(data.kpis);
            const isLast = index === pipelineSteps.length - 1;

            return (
              <div key={step.key} className="flex flex-1 flex-col lg:flex-row">
                <div
                  className={cn(
                    "relative flex flex-1 flex-col rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md",
                    step.flowColor,
                    step.lightText ? "border-white/20" : "border-white/40",
                  )}
                >
                  <div className="mb-4 flex items-start justify-between gap-2">
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
                        step.lightText
                          ? "bg-white/20 text-slate-100"
                          : "bg-white/50 text-foreground/70",
                      )}
                    >
                      Stage {step.stage}
                    </span>
                  </div>

                  <MetricDisplay
                    pcs={pcs}
                    kg={kg}
                    dualUnits={step.dualUnits}
                    lightText={step.lightText}
                  />

                  <p
                    className={cn(
                      "mt-3 text-sm font-semibold",
                      step.lightText ? "text-white" : "text-foreground/90",
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs leading-relaxed",
                      step.lightText ? "text-slate-100/90" : "text-muted-foreground",
                    )}
                  >
                    {step.sublabel}
                  </p>
                  {detail ? (
                    <p
                      className={cn(
                        "mt-2.5 text-xs font-medium",
                        step.lightText ? "text-slate-100" : "text-teal",
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

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="bg-flow-1 size-2.5 rounded-full" />
            Distribution
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-flow-2 size-2.5 rounded-full" />
            Returns
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-flow-3 size-2.5 rounded-full" />
            Recycling
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-flow-4 size-2.5 rounded-full" />
            Manufacturing
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-gold size-2.5 rounded-full" />
            1 sack = 0.1 kg (100 g)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
