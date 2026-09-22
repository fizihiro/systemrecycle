"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createCollectorDelivery,
  deleteCollectorDelivery,
  updateCollectorDelivery,
  type CollectorDeliveryRecord,
} from "@/lib/actions/collector-delivery";
import { formatDate, formatNumber, toInputDate } from "@/lib/format";
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
import { FormCombobox } from "@/components/crud/form-combobox";
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

export function CollectorDeliveryManager({
  items,
  pagination,
  suppliers,
  collectors,
  title = "Recycler Delivery & Receipts",
  description = "Record accepted deliveries of collected sacks from collectors and suppliers for processing into recycled PP.",
}: {
  items: CollectorDeliveryRecord[];
  pagination: PaginationMeta;
  suppliers: Option[];
  collectors: Option[];
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CollectorDeliveryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [supplierId, setSupplierId] = useState("");
  const [collectorId, setCollectorId] = useState("");

  function resetForm() {
    setEditing(null);
    setError(null);
    setSupplierId("");
    setCollectorId("");
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

  function openEdit(item: CollectorDeliveryRecord) {
    setEditing(item);
    setError(null);
    setSupplierId(String(item.supplierId));
    setCollectorId(String(item.collectorId));
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    const colId = formData.get("collectorId");
    if (!colId || String(colId).trim() === "") {
      setError("Selecting a Collector is mandatory.");
      return;
    }

    const inputWeightKg = Number(formData.get("inputWeightKg"));
    const outputWeightKg = Number(formData.get("outputWeightKg"));

    if (outputWeightKg > inputWeightKg) {
      setError("Strict validation failed: Recycled output weight cannot exceed accepted input weight.");
      return;
    }

    startTransition(async () => {
      const result = editing
        ? await updateCollectorDelivery(editing.id, formData)
        : await createCollectorDelivery(formData);

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <Button
            onClick={openCreate}
            disabled={suppliers.length === 0 || collectors.length === 0}
          >
            <Plus />
            Record Receipt
          </Button>
        }
      />

      {(suppliers.length === 0 || collectors.length === 0) && (
        <EmptyState message="Add at least one supplier and collector before recording receipts." />
      )}

      {pagination.total === 0 ? (
        suppliers.length > 0 &&
        collectors.length > 0 && (
          <EmptyState message="No recycler receipts recorded yet." />
        )
      ) : (
        <DataTable pagination={pagination}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead className="whitespace-nowrap">Accepted Input (pcs | kg | tonnes)</TableHead>
                <TableHead className="whitespace-nowrap">Recycled Output (kg | tonnes)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground font-medium">
                    {(pagination.page - 1) * pagination.pageSize + index + 1}
                  </TableCell>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.supplierName}</TableCell>
                  <TableCell className="font-medium">{item.collectorName}</TableCell>
                  <TableCell className="font-medium font-mono text-xs whitespace-nowrap">
                    {item.inputMassFormatted ?? `${item.sackQty.toLocaleString()} pcs | ${formatNumber(item.inputWeightKg)} kg`}
                  </TableCell>
                  <TableCell className="font-medium font-mono text-xs whitespace-nowrap">
                    {item.outputMassFormatted ?? `${formatNumber(item.outputWeightKg)} kg`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-4">
                      <EditRecordButton
                        label={`delivery ${item.id}`}
                        onClick={() => openEdit(item)}
                      />
                      <DeleteRecordButton
                        itemLabel={`delivery ${item.id}`}
                        onDelete={() => deleteCollectorDelivery(item.id)}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Recycler Receipt" : "Record Recycler Receipt"}
            </DialogTitle>
          </DialogHeader>
          <form key={dialogKey} action={handleSubmit} className="space-y-4">
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
            <FormCombobox
              id="collectorId"
              name="collectorId"
              label="Collector (Mandatory)"
              value={collectorId}
              onValueChange={setCollectorId}
              placeholder="Select collector"
              searchPlaceholder="Search collector by name..."
              options={collectors.map((item) => ({
                value: String(item.id),
                label: item.label,
              }))}
              required
            />
            <FormCombobox
              id="supplierId"
              name="supplierId"
              label="Supplier"
              value={supplierId}
              onValueChange={setSupplierId}
              placeholder="Select supplier"
              searchPlaceholder="Search supplier by name..."
              options={suppliers.map((item) => ({
                value: String(item.id),
                label: item.label,
              }))}
            />
            <div className="space-y-2">
              <Label htmlFor="sackQty">Sack Qty (pcs)</Label>
              <Input
                id="sackQty"
                name="sackQty"
                type="number"
                min="1"
                step="1"
                defaultValue={editing?.sackQty ?? ""}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inputWeightKg">Accepted Input Weight (KG)</Label>
                <Input
                  id="inputWeightKg"
                  name="inputWeightKg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={editing?.inputWeightKg ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outputWeightKg">Recycled Output Weight (KG)</Label>
                <Input
                  id="outputWeightKg"
                  name="outputWeightKg"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editing?.outputWeightKg ?? ""}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Must be ≤ Accepted Input Weight
                </p>
              </div>
            </div>
            <FormError message={error} />
            <DialogFooter>
              <SubmitButton
                label={editing ? "Save Changes" : "Save Receipt"}
                pending={isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
