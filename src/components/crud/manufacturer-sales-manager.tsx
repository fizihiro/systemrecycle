"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createManufacturerSales,
  deleteManufacturerSales,
  updateManufacturerSales,
  type ManufacturerSalesRecord,
} from "@/lib/actions/manufacturer-sales";
import { formatCurrency, formatDate, formatNumber, toInputDate } from "@/lib/format";
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

export function ManufacturerSalesManager({
  items,
  pagination,
  recyclers,
  manufacturers,
}: {
  items: ManufacturerSalesRecord[];
  pagination: PaginationMeta;
  recyclers: Option[];
  manufacturers: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManufacturerSalesRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [recyclerId, setRecyclerId] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");

  function resetForm() {
    setEditing(null);
    setError(null);
    setRecyclerId("");
    setManufacturerId("");
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

  function openEdit(item: ManufacturerSalesRecord) {
    setEditing(item);
    setError(null);
    setRecyclerId(String(item.recyclerId));
    setManufacturerId(String(item.manufacturerId));
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateManufacturerSales(editing.id, formData)
        : await createManufacturerSales(formData);

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
        title="Manufacturer Sales"
        description="Record sales of recycled plastic from recyclers to manufacturers."
        action={
          <Button
            onClick={openCreate}
            disabled={recyclers.length === 0 || manufacturers.length === 0}
          >
            <Plus />
            Add Sale
          </Button>
        }
      />

      {(recyclers.length === 0 || manufacturers.length === 0) && (
        <EmptyState message="Add at least one recycler and manufacturer before recording sales." />
      )}

      {pagination.total === 0 ? (
        recyclers.length > 0 &&
        manufacturers.length > 0 && (
          <EmptyState message="No manufacturer sales recorded yet." />
        )
      ) : (
        <DataTable pagination={pagination}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Recycler</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Purchase Weight (KG)</TableHead>
                <TableHead>Sales Price (RM)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.recyclerName}</TableCell>
                  <TableCell>{item.manufacturerName}</TableCell>
                  <TableCell>{formatNumber(item.purchaseWeightKg)}</TableCell>
                  <TableCell>{formatCurrency(item.salesPriceRm)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditRecordButton
                        label={`sale ${item.id}`}
                        onClick={() => openEdit(item)}
                      />
                      <DeleteRecordButton
                        itemLabel={`sale ${item.id}`}
                        onDelete={() => deleteManufacturerSales(item.id)}
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
            <DialogTitle>{editing ? "Edit Sale" : "Add Sale"}</DialogTitle>
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
            <FormSelect
              id="manufacturerId"
              name="manufacturerId"
              label="Manufacturer"
              value={manufacturerId}
              onValueChange={setManufacturerId}
              placeholder="Select manufacturer"
              options={manufacturers.map((item) => ({
                value: String(item.id),
                label: item.label,
              }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaseWeightKg">Purchase Weight (KG)</Label>
                <Input
                  id="purchaseWeightKg"
                  name="purchaseWeightKg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={editing?.purchaseWeightKg ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesPriceRm">Sales Price (RM)</Label>
                <Input
                  id="salesPriceRm"
                  name="salesPriceRm"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editing?.salesPriceRm ?? ""}
                  required
                />
              </div>
            </div>
            <FormError message={error} />
            <DialogFooter>
              <SubmitButton
                label={editing ? "Save Changes" : "Create Sale"}
                pending={isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
