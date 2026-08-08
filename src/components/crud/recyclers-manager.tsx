"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createRecycler,
  deleteRecycler,
  updateRecycler,
  type RecyclerRecord,
} from "@/lib/actions/recyclers";
import { formatNumber } from "@/lib/format";
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

export function RecyclersManager({
  items,
  pagination,
}: {
  items: RecyclerRecord[];
  pagination: PaginationMeta;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecyclerRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setEditing(null);
      setError(null);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateRecycler(editing.id, formData)
        : await createRecycler(formData);

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
        title="Recyclers"
        description="Manage recycler companies and their processing capacity."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setError(null);
              setOpen(true);
            }}
          >
            <Plus />
            Add Recycler
          </Button>
        }
      />

      {pagination.total === 0 ? (
        <EmptyState message="No recyclers yet. Add your first recycler record." />
      ) : (
        <DataTable pagination={pagination}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Process Capacity (KG)</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.companyName}</TableCell>
                  <TableCell>{formatNumber(item.processCapacityKg)}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditRecordButton
                        label={item.companyName}
                        onClick={() => {
                          setEditing(item);
                          setError(null);
                          setOpen(true);
                        }}
                      />
                      <DeleteRecordButton
                        itemLabel={item.companyName}
                        onDelete={() => deleteRecycler(item.id)}
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
            <DialogTitle>{editing ? "Edit Recycler" : "Add Recycler"}</DialogTitle>
          </DialogHeader>
          <form key={dialogKey} action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={editing?.companyName ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processCapacityKg">Process Capacity (KG)</Label>
              <Input
                id="processCapacityKg"
                name="processCapacityKg"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={editing?.processCapacityKg ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={editing?.phone ?? ""} required />
            </div>
            <FormError message={error} />
            <DialogFooter>
              <SubmitButton
                label={editing ? "Save Changes" : "Create Recycler"}
                pending={isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
