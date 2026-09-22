"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createSackReturn,
  deleteSackReturn,
  updateSackReturn,
  type SackReturnRecord,
} from "@/lib/actions/sack-returns";
import { computeDiscount } from "@/lib/discount";
import { formatCurrency, formatDate, toInputDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormSelect } from "@/components/crud/form-select";
import {
  DeleteRecordButton,
  EditRecordButton,
} from "@/components/crud/record-actions";
import { DataTable } from "@/components/crud/data-table";
import {
  EmptyState,
  FormError,
  PageHeader,
  SubmitButton,
} from "@/components/crud/shared";
import type { PaginationMeta } from "@/lib/pagination";

type Option = { id: number; label: string };
type SackOption = { id: number; label: string; discountValueRm: number };

export function SackReturnsManager({
  items,
  pagination,
  collectors,
  suppliers,
  farmers,
  sacks,
}: {
  items: SackReturnRecord[];
  pagination: PaginationMeta;
  collectors?: Option[];
  suppliers?: Option[];
  farmers: Option[];
  sacks: SackOption[];
}) {
  const effectiveCollectors = collectors ?? suppliers ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SackReturnRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [batchId, setBatchId] = useState("");
  const [collectorId, setCollectorId] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [sackId, setSackId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [totalDiscountRm, setTotalDiscountRm] = useState("0");
  const [discountTouched, setDiscountTouched] = useState(false);

  const selectedSack = sacks.find((item) => String(item.id) === sackId);
  const suggestedDiscount = selectedSack
    ? computeDiscount(Number(quantity || 0), selectedSack.discountValueRm)
    : 0;
  const discountDisplay = discountTouched
    ? totalDiscountRm
    : suggestedDiscount.toFixed(2);

  function resetForm() {
    setEditing(null);
    setError(null);
    setBatchId("");
    setCollectorId("");
    setFarmerId("");
    setSackId("");
    setQuantity("1");
    setTotalDiscountRm("0");
    setDiscountTouched(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(item: SackReturnRecord) {
    setEditing(item);
    setError(null);
    setBatchId(item.batchId ?? "");
    setCollectorId(String(item.collectorId ?? item.supplierId));
    setFarmerId(String(item.farmerId));
    setSackId(String(item.sackId));
    setQuantity(String(item.quantity));
    setTotalDiscountRm(String(item.totalDiscountRm));
    setDiscountTouched(true);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateSackReturn(editing.id, formData)
        : await createSackReturn(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
    });
  }

  const dialogKey = useMemo(
    () => (editing ? `edit-${editing.id}` : "create"),
    [editing],
  );

  const collectorOptions = effectiveCollectors.map((item) => ({
    value: String(item.id),
    label: item.label,
  }));
  const farmerOptions = farmers.map((item) => ({
    value: String(item.id),
    label: item.label,
  }));
  const sackOptions = sacks.map((item) => ({
    value: String(item.id),
    label: `${item.label} (${formatCurrency(item.discountValueRm)} discount)`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sack Returns"
        description="Record returned sacks with batch IDs, collector locations, and discount incentives."
        action={
          <Button
            onClick={openCreate}
            disabled={effectiveCollectors.length === 0 || farmers.length === 0 || sacks.length === 0}
          >
            <Plus />
            Add Sack Return
          </Button>
        }
      />

      {(effectiveCollectors.length === 0 || farmers.length === 0 || sacks.length === 0) && (
        <EmptyState message="Add at least one collector, farmer, and sack catalog entry before recording sack returns." />
      )}

      {pagination.total === 0 ? (
        effectiveCollectors.length > 0 &&
        farmers.length > 0 &&
        sacks.length > 0 && (
          <EmptyState message="No sack returns recorded yet." />
        )
      ) : (
        <DataTable pagination={pagination}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Sack</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total Discount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{item.batchId}</TableCell>
                  <TableCell>{item.farmerName}</TableCell>
                  <TableCell>{item.collectorName ?? item.supplierName}</TableCell>
                  <TableCell className="max-w-xs">{item.sackLabel}</TableCell>
                  <TableCell className="font-medium">{item.quantity.toLocaleString()} pcs</TableCell>
                  <TableCell>{formatCurrency(item.totalDiscountRm)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-4">
                      <EditRecordButton
                        label={`sack return ${item.id}`}
                        onClick={() => openEdit(item)}
                      />
                      <DeleteRecordButton
                        itemLabel={`sack return ${item.id}`}
                        onDelete={() => deleteSackReturn(item.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Sack Return" : "Add Sack Return"}</DialogTitle>
          </DialogHeader>
          <form key={dialogKey} action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchId">Batch ID</Label>
              <Input
                id="batchId"
                name="batchId"
                type="text"
                placeholder="e.g. BATCH-2025-08-001"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={toInputDate(editing?.date)}
                required
              />
            </div>
            <FormSelect
              id="farmerId"
              name="farmerId"
              label="Farmer"
              value={farmerId}
              onValueChange={setFarmerId}
              placeholder="Select farmer"
              options={farmerOptions}
            />
            <FormSelect
              id="collectorId"
              name="collectorId"
              label="Collector"
              value={collectorId}
              onValueChange={setCollectorId}
              placeholder="Select collector"
              options={collectorOptions}
            />
            <FormSelect
              id="sackId"
              name="sackId"
              label="Sack Catalog Item"
              value={sackId}
              onValueChange={(value) => {
                setSackId(value);
                setDiscountTouched(false);
              }}
              placeholder="Select catalog item"
              options={sackOptions}
            />
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (pcs)</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setDiscountTouched(false);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalDiscountRm">Total Discount (RM)</Label>
              <Input
                id="totalDiscountRm"
                name="totalDiscountRm"
                type="number"
                min="0"
                step="0.01"
                value={discountDisplay}
                onChange={(event) => {
                  setTotalDiscountRm(event.target.value);
                  setDiscountTouched(true);
                }}
                required
              />
              <p className="text-muted-foreground text-xs">
                Auto-calculated from quantity × discount value. You can override before saving.
              </p>
            </div>
            <FormError message={error} />
            <DialogFooter>
              <SubmitButton
                label={editing ? "Save Changes" : "Create Sack Return"}
                pending={isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
