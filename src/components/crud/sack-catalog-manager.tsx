"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createSackCatalog,
  deleteSackCatalog,
  updateSackCatalog,
  type SackCatalogRecord,
} from "@/lib/actions/sack-catalog";
import { formatCurrency } from "@/lib/format";
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

function resetDialogState(setters: {
  setEditing: (value: SackCatalogRecord | null) => void;
  setError: (value: string | null) => void;
}) {
  setters.setEditing(null);
  setters.setError(null);
}

export function SackCatalogManager({
  items,
  pagination,
}: {
  items: SackCatalogRecord[];
  pagination: PaginationMeta;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SackCatalogRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialogState({ setEditing, setError });
    }
  }

  function openCreate() {
    resetDialogState({ setEditing, setError });
    setOpen(true);
  }

  function openEdit(item: SackCatalogRecord) {
    setEditing(item);
    setError(null);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateSackCatalog(editing.id, formData)
        : await createSackCatalog(formData);

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
        title="Sack Catalog"
        description="Manage fertilizer sack types and discount values used during sack returns."
        action={
          <Button onClick={openCreate}>
            <Plus />
            Add Sack Type
          </Button>
        }
      />

      {pagination.total === 0 ? (
        <EmptyState message="No sack catalog entries yet. Add your first fertilizer sack type." />
      ) : (
        <DataTable pagination={pagination}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fertilizer Type</TableHead>
                <TableHead>Discount Value (RM)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.fertilizerType}</TableCell>
                  <TableCell>{formatCurrency(item.discountValueRm)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditRecordButton
                        label={item.fertilizerType}
                        onClick={() => openEdit(item)}
                      />
                      <DeleteRecordButton
                        itemLabel={item.fertilizerType}
                        onDelete={() => deleteSackCatalog(item.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Sack Type" : "Add Sack Type"}
            </DialogTitle>
          </DialogHeader>
          <form key={dialogKey} action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fertilizerType">Fertilizer Type</Label>
              <Input
                id="fertilizerType"
                name="fertilizerType"
                defaultValue={editing?.fertilizerType ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValueRm">Discount Value (RM)</Label>
              <Input
                id="discountValueRm"
                name="discountValueRm"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editing?.discountValueRm ?? ""}
                required
              />
            </div>
            <FormError message={error} />
            <DialogFooter>
              <SubmitButton
                label={editing ? "Save Changes" : "Create Sack Type"}
                pending={isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
