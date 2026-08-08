import { Suspense } from "react";

import { DataTablePagination } from "@/components/crud/data-table-pagination";
import type { PaginationMeta } from "@/lib/pagination";

function PaginationFallback() {
  return <div className="h-[57px] border-t" />;
}

export function DataTable({
  pagination,
  children,
}: {
  pagination: PaginationMeta;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border">
      {children}
      <Suspense fallback={<PaginationFallback />}>
        <DataTablePagination pagination={pagination} />
      </Suspense>
    </div>
  );
}
