"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createFertilizerDistribution,
  deleteFertilizerDistribution,
  updateFertilizerDistribution,
  type FertilizerDistributionRecord,
} from "@/lib/actions/fertilizer-distribution";
import { formatDate, toInputDate } from "@/lib/format";
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

export function FertilizerDistributionManager({
  items,
  pagination,
  suppliers,
  farmers,
  sacks,
}: {
  items: FertilizerDistributionRecord[];
  pagination: PaginationMeta;
  suppliers: Option[];
  farmers: Option[];
  sacks: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FertilizerDistributionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [supplierId, setSupplierId] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [sackId, setSackId] = useState("");

  function resetForm() {
    setEditing(null);
    setError(null);
    setSupplierId("");
    setFarmerId("");
    setSackId("");
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

  function openEdit(item: FertilizerDistributionRecord) {
    setEditing(item);
    setError(null);
    setSupplierId(String(item.supplierId));
    setFarmerId(String(item.farmerId));
    setSackId(String(item.sackId));
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateFertilizerDistribution(editing.id, formData)
        : await createFertilizerDistribution(formData);

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

  const supplierOptions = suppliers.map((item) => ({
    value: String(item.id),
    label: item.label,
  }));
  const farmerOptions = farmers.map((item) => ({
    value: String(item.id),
    label: item.label,
  }));
  const sackOptions = sacks.map((item) => ({
    value: String(item.id),
    label: item.label,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fertilizer Distribution"
        description="Record fertilizer sack distributions from suppliers to farmers."
        action={
          <Button
            onClick={openCreate}
            disabled={suppliers.length === 0 || farmers.length === 0 || sacks.length === 0}
          >
            <Plus />
            Add Distribution
          </Button>
        }
      />

      {(suppliers.length === 0 || farmers.length === 0 || sacks.length === 0) && (
        <EmptyState message="Add at least one supplier, farmer, and sack catalog entry before creating distributions." />
      )}

      {pagination.total === 0 ? (
        suppliers.length > 0 &&
        farmers.length > 0 &&
        sacks.length > 0 && (
          <EmptyState message="No fertilizer distributions recorded yet." />
        )
      ) : (
        <DataTable pagination={pagination}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Sack</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.supplierName}</TableCell>
                  <TableCell>{item.farmerName}</TableCell>
                  <TableCell className="max-w-xs">{item.sackLabel}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditRecordButton
                        label={`distribution ${item.id}`}
                        onClick={() => openEdit(item)}
                      />
                      <DeleteRecordButton
                        itemLabel={`distribution ${item.id}`}
                        onDelete={() => deleteFertilizerDistribution(item.id)}
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
            <DialogTitle>
              {editing ? "Edit Distribution" : "Add Distribution"}
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
            <FormSelect
              id="supplierId"
              name="supplierId"
              label="Supplier"
              value={supplierId}
              onValueChange={setSupplierId}
              placeholder="Select supplier"
              options={supplierOptions}
            />
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
              id="sackId"
              name="sackId"
              label="Sack Catalog Item"
              value={sackId}
              onValueChange={setSackId}
              placeholder="Select catalog item"
              options={sackOptions}
            />
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                defaultValue={editing?.quantity ?? ""}
                required
              />
            </div>
            <FormError message={error} />
            <DialogFooter>
              <SubmitButton
                label={editing ? "Save Changes" : "Create Distribution"}
                pending={isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
