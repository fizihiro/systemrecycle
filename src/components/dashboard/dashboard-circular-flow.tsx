"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Factory,
  Package,
  Recycle,
  RotateCcw,
  Store,
  Truck,
  Users,
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

const NODE_ICONS = {
  supplier: Truck,
  farmer: Users,
  collection: Store,
  recycler: Recycle,
  manufacturer: Factory,
  newSacks: Package,
} as const;

type NodeKey = keyof typeof NODE_ICONS;

const FLOW_ORDER: NodeKey[] = [
  "supplier",
  "farmer",
  "collection",
  "recycler",
  "manufacturer",
  "newSacks",
];

type LeakageEdge = {
  afterNode: NodeKey;
  pctKey: keyof DashboardAnalytics["circularFlow"]["leakages"];
  label: string;
};

const LEAKAGE_EDGES: LeakageEdge[] = [
  { afterNode: "farmer", pctKey: "returnGapPct", label: "Return Gap" },
  { afterNode: "collection", pctKey: "rejectRatePct", label: "Reject Rate" },
  {
    afterNode: "recycler",
    pctKey: "recyclingYieldLossPct",
    label: "Yield Loss",
  },
];

function FlowNodeCard({
  node,
}: {
  node: DashboardAnalytics["circularFlow"]["nodes"][number];
}) {
  const Icon = NODE_ICONS[node.key as NodeKey];
  const showDual = node.pcs !== null;

  return (
    <div className="border-border/70 bg-card flex w-[132px] shrink-0 flex-col rounded-xl border p-3 shadow-sm sm:w-[148px]">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-teal/15 text-teal flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" strokeWidth={2.25} />
        </div>
        <p className="text-[11px] font-semibold leading-snug">{node.label}</p>
      </div>
      {showDual ? (
        <div className="space-y-0.5">
          <p className="font-heading text-sm font-bold tabular-nums">
            {node.pcs!.toLocaleString()} pcs
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {node.kg!.toLocaleString("en-MY")} kg
          </p>
        </div>
      ) : node.kg !== null ? (
        <p className="font-heading text-sm font-bold tabular-nums">
          {node.kg.toLocaleString("en-MY")} kg
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">Entry point</p>
      )}
      {"sublabel" in node && node.sublabel ? (
        <p className="text-muted-foreground mt-2 text-[10px] leading-snug">
          {node.sublabel}
        </p>
      ) : null}
    </div>
  );
}

function MainConnector({
  leakage,
}: {
  leakage?: { label: string; pct: number };
}) {
  return (
    <div className="flex min-w-[56px] flex-1 flex-col items-center self-center">
      <div className="flex w-full max-w-[88px] items-center px-1">
        <div className="bg-teal/70 h-0.5 flex-1 rounded-full" />
        <ArrowRight className="text-teal size-4 shrink-0" strokeWidth={2.5} />
      </div>

      {leakage && leakage.pct > 0 ? (
        <div className="mt-3 flex w-full flex-col items-center gap-1 pt-1">
          <div className="bg-destructive/70 h-7 w-0.5 rounded-full" />
          <ArrowDown className="text-destructive size-3.5 shrink-0" strokeWidth={2.5} />
          <div className="bg-destructive/8 border-destructive/25 max-w-[108px] rounded-md border px-2 py-1 text-center">
            <p className="text-destructive text-[10px] font-bold leading-tight">
              {leakage.label}
            </p>
            <p className="text-destructive text-xs font-bold tabular-nums">
              {leakage.pct}%
            </p>
          </div>
        </div>
      ) : (
        <div className="h-[88px]" aria-hidden />
      )}
    </div>
  );
}

function ReturnLoopConnector() {
  return (
    <div className="border-teal/35 mt-2 flex flex-col items-stretch border-t border-dashed pt-6">
      <div className="flex items-center justify-end gap-2 px-2 sm:px-4">
        <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
          New PP Sacks
        </span>
        <ArrowRight className="text-teal size-4 shrink-0" strokeWidth={2.5} />
      </div>

      <div className="relative mx-4 mt-2 h-14 sm:mx-8">
        <div className="border-teal/50 absolute inset-x-0 top-0 h-10 rounded-br-3xl rounded-bl-3xl border-r-2 border-b-2 border-l-2 border-dashed" />
        <ArrowLeft className="text-teal absolute bottom-0 left-0 size-4 -translate-x-1/2 translate-y-1/2" strokeWidth={2.5} />
      </div>

      <div className="mt-1 flex items-center gap-2 px-2 sm:px-4">
        <RotateCcw className="text-teal size-3.5 shrink-0" />
        <span className="text-muted-foreground text-xs">
          Loop closes back to{" "}
          <span className="text-foreground font-medium">Supplier</span>
        </span>
      </div>
    </div>
  );
}

export function DashboardCircularFlow({ data }: { data: DashboardAnalytics }) {
  const nodeMap = new Map(
    data.circularFlow.nodes.map((n) => [n.key as NodeKey, n]),
  );

  const leakageByAfterNode = new Map(
    LEAKAGE_EDGES.map((edge) => [
      edge.afterNode,
      {
        label: edge.label,
        pct: data.circularFlow.leakages[edge.pctKey],
      },
    ]),
  );

  return (
    <Card className="border-border/60 overflow-hidden shadow-md">
      <CardHeader className="border-b bg-gradient-to-r from-sage/30 via-background to-teal/10 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-heading text-lg tracking-tight">
              Sack2Loop Material Flow
            </CardTitle>
            <CardDescription>
              Point-to-point flowchart with outward leakage branches. Stages 1–2
              show pcs + estimated kg ({data.circularFlow.weightEstimateKg}{" "}
              kg/pc).
            </CardDescription>
          </div>
          <div className="bg-gold/15 text-gold-foreground inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-xs font-medium">
            <span className="bg-gold size-2 rounded-full" />
            {data.kpis.discountCaptureRate}% discount capture
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[920px]">
            <div className="flex items-start justify-between gap-1 px-1">
              {FLOW_ORDER.map((key, index) => {
                const node = nodeMap.get(key);
                if (!node) return null;
                const isLast = index === FLOW_ORDER.length - 1;

                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-start",
                      isLast ? "shrink-0" : "min-w-0 flex-1",
                    )}
                  >
                    <FlowNodeCard node={node} />
                    {!isLast ? (
                      <MainConnector
                        leakage={leakageByAfterNode.get(key)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <ReturnLoopConnector />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Return Gap",
              value: `${data.leakages.returnGapPct}%`,
              detail: `${data.leakages.returnGapPieces.toLocaleString()} sacks never returned`,
            },
            {
              label: "Reject Rate",
              value: `${data.leakages.rejectRatePct}%`,
              detail: `${data.leakages.rejectPieces.toLocaleString()} rejected at collection`,
            },
            {
              label: "Recycling Yield Loss",
              value: `${data.leakages.recyclingYieldLossPct}%`,
              detail: `${data.leakages.yieldLossKg.toLocaleString("en-MY")} kg lost before purchase`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-destructive/20 bg-destructive/5 p-3"
            >
              <p className="text-destructive text-[10px] font-semibold uppercase tracking-wider">
                {item.label}
              </p>
              <p className="font-heading text-xl font-bold text-destructive">
                {item.value}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">{item.detail}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
