"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createManufacturer,
  deleteManufacturer,
  updateManufacturer,
  type ManufacturerRecord,
} from "@/lib/actions/manufacturers";
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

export function ManufacturersManager({
  items,
  pagination,
}: {
  items: ManufacturerRecord[];
  pagination: PaginationMeta;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManufacturerRecord | null>(null);
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
        ? await updateManufacturer(editing.id, formData)
        : await createManufacturer(formData);

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
        title="Manufacturers"
        description="Manage manufacturers purchasing recycled plastic output."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setError(null);
              setOpen(true);
            }}
          >
            <Plus />
            Add Manufacturer
          </Button>
        }
      />

      {pagination.total === 0 ? (
        <EmptyState message="No manufacturers yet. Add your first manufacturer record." />
      ) : (
        <DataTable pagination={pagination}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.companyName}</TableCell>
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
                        onDelete={() => deleteManufacturer(item.id)}
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
              {editing ? "Edit Manufacturer" : "Add Manufacturer"}
            </DialogTitle>
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
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={editing?.phone ?? ""} required />
            </div>
            <FormError message={error} />
            <DialogFooter>
              <SubmitButton
                label={editing ? "Save Changes" : "Create Manufacturer"}
                pending={isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
