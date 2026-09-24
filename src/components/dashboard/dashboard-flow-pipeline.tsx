import { Fragment } from "react";
import {
  ArrowDown,
  ArrowRight,
  Factory,
  Package,
  Recycle,
  RotateCcw,
  type LucideIcon,
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

type PipelineStep = {
  key: string;
  stage: number;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  flowColor: string;
  iconColor: string;
  connectorFrom: string;
  connectorTo: string;
  lightText: boolean;
  dualUnits: boolean;
  getMetrics: (data: DashboardAnalytics["kpis"]) => {
    pcs: number | null;
    kg: number;
    detail?: string;
  };
};

const pipelineSteps: PipelineStep[] = [
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
      detail: undefined,
    }),
  },
  {
    key: "returns",
    stage: 2,
    label: "Collection",
    sublabel: "Empty sacks returned by farmers",
    icon: RotateCcw,
    flowColor: "bg-flow-2",
    iconColor: "text-teal-foreground bg-teal/20",
    connectorFrom: "from-flow-2",
    connectorTo: "to-flow-3",
    lightText: false,
    dualUnits: true,
    getMetrics: (data: DashboardAnalytics["kpis"]) => ({
      pcs: data.sacksCollected,
      kg: data.collectedWeightKg,
      detail: `${data.collectionRate}% collection rate`,
    }),
  },
  {
    key: "recycler",
    stage: 3,
    label: "Recycler",
    sublabel: "Accepted input & recycling output",
    icon: Recycle,
    flowColor: "bg-flow-3",
    iconColor: "text-white bg-white/20",
    connectorFrom: "from-flow-3",
    connectorTo: "to-flow-4",
    lightText: true,
    dualUnits: true,
    getMetrics: (data: DashboardAnalytics["kpis"]) => ({
      pcs: data.sacksToCollector,
      kg: data.totalInputWeightKg || data.sacksToCollector * 0.1,
      detail: `${data.totalOutputWeightFormatted} (${data.totalOutputWeightTonnes.toFixed(3)} t) output · ${data.recoveryYieldPct}% yield`,
    }),
  },
  {
    key: "manufacturer",
    stage: 4,
    label: "Downstream Manufacturer",
    sublabel: "Confirmed downstream use",
    icon: Factory,
    flowColor: "bg-flow-4",
    iconColor: "text-white bg-white/20",
    connectorFrom: "from-flow-4",
    connectorTo: "to-flow-4",
    lightText: true,
    dualUnits: true,
    getMetrics: (data: DashboardAnalytics["kpis"]) => {
      const kg = data.downstreamWeightKg ?? data.totalManufacturerPurchasedKg ?? data.totalOutputWeightKg;
      const pcs = data.downstreamSacks ?? Math.round(kg / 0.1);
      const mfgCount = data.manufacturers;
      const valueFormatted = data.totalManufacturerSalesRmFormatted
        ?? (data.rppEconomicValueFormatted ? `${data.rppEconomicValueFormatted} value` : "");
      return {
        pcs,
        kg,
        detail: valueFormatted
          ? `${valueFormatted} · ${mfgCount} manufacturer${mfgCount === 1 ? "" : "s"}`
          : `${mfgCount} partner manufacturer${mfgCount === 1 ? "" : "s"}`,
      };
    },
  },
];

function PipelineConnector({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  return (
    <div
      className="hidden shrink-0 items-center justify-center self-center px-0.5 lg:flex lg:w-5 xl:w-7"
      aria-hidden
    >
      <div className="relative flex w-full items-center">
        <div
          className={cn(
            "h-1 w-full rounded-full bg-gradient-to-r",
            from,
            to,
          )}
        />
        <ArrowRight
          className="text-muted-foreground/70 -ml-1 size-3.5 shrink-0 xl:size-4"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}

function MobilePipelineConnector({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  return (
    <div className="flex items-center justify-center py-1 lg:hidden" aria-hidden>
      <div className="flex flex-col items-center">
        <div className={cn("h-3 w-0.5 rounded-full bg-gradient-to-b", from, to)} />
        <ArrowDown className="text-muted-foreground/70 -mt-0.5 size-3.5" strokeWidth={2.5} />
      </div>
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
  const tonnes = kg / 1000;
  if (dualUnits && pcs !== null) {
    return (
      <div className="space-y-0.5">
        <p
          className={cn(
            "font-heading text-xl xl:text-2xl font-bold tracking-tight tabular-nums",
            lightText ? "text-white" : "text-foreground",
          )}
        >
          {pcs.toLocaleString()}
          <span
            className={cn(
              "ml-1.5 text-xs xl:text-sm font-semibold",
              lightText ? "text-slate-100" : "text-foreground/75",
            )}
          >
            pcs
          </span>
        </p>
        <p
          className={cn(
            "text-xs font-mono font-medium tabular-nums tracking-tight",
            lightText ? "text-slate-100/90" : "text-muted-foreground",
          )}
        >
          {Number.isInteger(kg) ? kg.toLocaleString("en-MY") : kg.toFixed(2)} kg | {tonnes.toFixed(3)} t
        </p>
      </div>
    );
  }

  return (
    <p
      className={cn(
        "font-heading text-xl xl:text-2xl font-bold tracking-tight tabular-nums",
        lightText ? "text-white" : "text-foreground",
      )}
    >
      {Number.isInteger(kg) ? kg.toLocaleString("en-MY") : kg.toFixed(2)}
      <span
        className={cn(
          "ml-1.5 text-xs xl:text-sm font-semibold",
          lightText ? "text-slate-100" : "text-foreground/75",
        )}
      >
        kg | {tonnes.toFixed(3)} t
      </span>
    </p>
  );
}

export function DashboardFlowPipeline({ data }: { data: DashboardAnalytics }) {
  const { recoveryYieldPct, collectionRate } = data.kpis;

  return (
    <Card className="border-border/60 overflow-hidden shadow-md">
      <CardHeader className="border-b bg-gradient-to-r from-sage/30 via-background to-teal/10 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-heading text-lg tracking-tight">
              Sack2Loop Flow Pipeline
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl leading-relaxed">
              Linear view of sack movement from distribution through returns collection,
              recycler processing, and confirmed downstream manufacturer use.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-teal/15 text-teal inline-flex items-center gap-2 rounded-full border border-teal/30 px-3 py-1 text-xs font-medium">
              <span className="bg-teal size-2 rounded-full" />
              {collectionRate}% collected
            </div>
            <div className="bg-gold/15 text-gold-foreground inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-xs font-medium">
              <span className="bg-gold size-2 rounded-full" />
              {recoveryYieldPct}% recovery yield
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-1.5 xl:gap-2.5">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon;
            const { pcs, kg, detail } = step.getMetrics(data.kpis);
            const isLast = index === pipelineSteps.length - 1;

            return (
              <Fragment key={step.key}>
                <div
                  className={cn(
                    "relative flex flex-1 min-w-0 flex-col rounded-xl border p-4 xl:p-5 shadow-sm transition-shadow hover:shadow-md",
                    step.flowColor,
                    step.lightText ? "border-white/20" : "border-white/40",
                  )}
                >
                  <div className="mb-3.5 flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        "flex size-9 xl:size-10 items-center justify-center rounded-xl shadow-sm",
                        step.iconColor,
                      )}
                    >
                      <Icon className="size-4 xl:size-5" strokeWidth={2.25} />
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
                      "mt-3 text-sm font-semibold tracking-tight",
                      step.lightText ? "text-white" : "text-foreground/90",
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs leading-relaxed",
                      step.lightText ? "text-slate-100/90" : "text-foreground",
                    )}
                  >
                    {step.sublabel}
                  </p>
                  {detail ? (
                    <p
                      className={cn(
                        "mt-2.5 text-xs font-medium leading-relaxed",
                        step.lightText ? "text-slate-100" : "text-foreground font-semibold",
                      )}
                    >
                      {detail}
                    </p>
                  ) : null}
                </div>

                {!isLast ? (
                  <>
                    <PipelineConnector
                      from={step.connectorFrom}
                      to={step.connectorTo}
                    />
                    <MobilePipelineConnector
                      from={step.connectorFrom}
                      to={step.connectorTo}
                    />
                  </>
                ) : null}
              </Fragment>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="bg-flow-1 size-2.5 rounded-full" />
            Stage 1: Distribution
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-flow-2 size-2.5 rounded-full" />
            Stage 2: Collection
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-flow-3 size-2.5 rounded-full" />
            Stage 3: Recycler
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-flow-4 size-2.5 rounded-full" />
            Stage 4: Downstream Manufacturer
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
