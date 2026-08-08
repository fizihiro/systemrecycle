"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createRecyclerDelivery,
  deleteRecyclerDelivery,
  updateRecyclerDelivery,
  type RecyclerDeliveryRecord,
} from "@/lib/actions/recycler-delivery";
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

export function RecyclerDeliveryManager({
  items,
  pagination,
  suppliers,
  recyclers,
}: {
  items: RecyclerDeliveryRecord[];
  pagination: PaginationMeta;
  suppliers: Option[];
  recyclers: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecyclerDeliveryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [supplierId, setSupplierId] = useState("");
  const [recyclerId, setRecyclerId] = useState("");

  function resetForm() {
    setEditing(null);
    setError(null);
    setSupplierId("");
    setRecyclerId("");
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

  function openEdit(item: RecyclerDeliveryRecord) {
    setEditing(item);
    setError(null);
    setSupplierId(String(item.supplierId));
    setRecyclerId(String(item.recyclerId));
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateRecyclerDelivery(editing.id, formData)
        : await createRecyclerDelivery(formData);

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
        title="Recycler Delivery"
        description="Record deliveries of collected sacks from suppliers to recyclers."
        action={
          <Button
            onClick={openCreate}
            disabled={suppliers.length === 0 || recyclers.length === 0}
          >
            <Plus />
            Add Delivery
          </Button>
        }
      />

      {(suppliers.length === 0 || recyclers.length === 0) && (
        <EmptyState message="Add at least one supplier and recycler before recording deliveries." />
      )}

      {pagination.total === 0 ? (
        suppliers.length > 0 &&
        recyclers.length > 0 && (
          <EmptyState message="No recycler deliveries recorded yet." />
        )
      ) : (
        <DataTable pagination={pagination}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Recycler</TableHead>
                <TableHead>Sack Qty</TableHead>
                <TableHead>Input Weight (KG)</TableHead>
                <TableHead>Output Weight (KG)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.supplierName}</TableCell>
                  <TableCell>{item.recyclerName}</TableCell>
                  <TableCell>{item.sackQty}</TableCell>
                  <TableCell>{formatNumber(item.inputWeightKg)}</TableCell>
                  <TableCell>{formatNumber(item.outputWeightKg)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditRecordButton
                        label={`delivery ${item.id}`}
                        onClick={() => openEdit(item)}
                      />
                      <DeleteRecordButton
                        itemLabel={`delivery ${item.id}`}
                        onDelete={() => deleteRecyclerDelivery(item.id)}
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
            <DialogTitle>{editing ? "Edit Delivery" : "Add Delivery"}</DialogTitle>
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
            <FormSelect
              id="supplierId"
              name="supplierId"
              label="Supplier"
              value={supplierId}
              onValueChange={setSupplierId}
              placeholder="Select supplier"
              options={suppliers.map((item) => ({
                value: String(item.id),
                label: item.label,
              }))}
            />
            <FormSelect
              id="recyclerId"
              name="recyclerId"
              label="Recycler"
              value={recyclerId}
              onValueChange={setRecyclerId}
              placeholder="Select recycler"
              options={recyclers.map((item) => ({
                value: String(item.id),
                label: item.label,
              }))}
            />
            <div className="space-y-2">
              <Label htmlFor="sackQty">Sack Qty</Label>
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
                <Label htmlFor="inputWeightKg">Input Weight (KG)</Label>
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
                <Label htmlFor="outputWeightKg">Output Weight (KG)</Label>
                <Input
                  id="outputWeightKg"
                  name="outputWeightKg"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editing?.outputWeightKg ?? ""}
                  required
                />
              </div>
            </div>
            <FormError message={error} />
            <DialogFooter>
              <SubmitButton
                label={editing ? "Save Changes" : "Create Delivery"}
                pending={isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
