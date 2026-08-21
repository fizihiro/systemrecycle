"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  createSackCatalog,
  deleteSackCatalog,
  updateSackCatalog,
  type SackCatalogRecord,
} from "@/lib/actions/sack-catalog";
import {
  MATERIAL_TYPES,
  PRODUCT_CATEGORIES,
  SIZE_KG_BY_CATEGORY,
  type ProductCategory,
} from "@/lib/sack-catalog";
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

function resetDialogState(setters: {
  setEditing: (value: SackCatalogRecord | null) => void;
  setError: (value: string | null) => void;
  setProductCategory: (value: string) => void;
  setMaterialType: (value: string) => void;
  setSizeKg: (value: string) => void;
}) {
  setters.setEditing(null);
  setters.setError(null);
  setters.setProductCategory("");
  setters.setMaterialType("");
  setters.setSizeKg("");
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
  const [productCategory, setProductCategory] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [sizeKg, setSizeKg] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialogState({
        setEditing,
        setError,
        setProductCategory,
        setMaterialType,
        setSizeKg,
      });
    }
  }

  function openCreate() {
    resetDialogState({
      setEditing,
      setError,
      setProductCategory,
      setMaterialType,
      setSizeKg,
    });
    setOpen(true);
  }

  function openEdit(item: SackCatalogRecord) {
    setEditing(item);
    setError(null);
    setProductCategory(item.productCategory);
    setMaterialType(item.materialType);
    setSizeKg(String(item.sizeKg));
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

  const sizeOptions = (
    productCategory
      ? SIZE_KG_BY_CATEGORY[productCategory as ProductCategory]
      : []
  ).map((size) => ({
    value: String(size),
    label: `${size} kg`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sack Catalog"
        description="Manage product category, material type, sack size, and return discount values."
        action={
          <Button onClick={openCreate}>
            <Plus />
            Add Catalog Item
          </Button>
        }
      />

      {pagination.total === 0 ? (
        <EmptyState message="No sack catalog entries yet. Add your first catalog item." />
      ) : (
        <DataTable pagination={pagination}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Product Category</TableHead>
                <TableHead>Material Type</TableHead>
                <TableHead>Size (kg)</TableHead>
                <TableHead>Discount (RM)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.productCategory}</TableCell>
                  <TableCell className="max-w-xs">{item.materialType}</TableCell>
                  <TableCell>{item.sizeKg}</TableCell>
                  <TableCell>{formatCurrency(item.discountValueRm)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditRecordButton
                        label={item.label}
                        onClick={() => openEdit(item)}
                      />
                      <DeleteRecordButton
                        itemLabel={item.label}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Catalog Item" : "Add Catalog Item"}
            </DialogTitle>
          </DialogHeader>
          <form key={dialogKey} action={handleSubmit} className="space-y-4">
            <FormSelect
              id="productCategory"
              name="productCategory"
              label="Product Category"
              value={productCategory}
              onValueChange={(value) => {
                setProductCategory(value);
                setSizeKg("");
              }}
              placeholder="Select category"
              options={PRODUCT_CATEGORIES.map((category) => ({
                value: category,
                label: category,
              }))}
            />
            <FormSelect
              id="materialType"
              name="materialType"
              label="Material Type"
              value={materialType}
              onValueChange={setMaterialType}
              placeholder="Select material type"
              options={MATERIAL_TYPES.map((material) => ({
                value: material,
                label: material,
              }))}
            />
            <FormSelect
              id="sizeKg"
              name="sizeKg"
              label="Size (kg)"
              value={sizeKg}
              onValueChange={setSizeKg}
              placeholder={
                productCategory ? "Select sack size" : "Select category first"
              }
              options={sizeOptions}
            />
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
                label={editing ? "Save Changes" : "Create Catalog Item"}
                pending={isPending}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
