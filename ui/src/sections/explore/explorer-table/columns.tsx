"use client"

import { DataTableColumnHeader } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

export const useColumns = () => {

  const columns: ColumnDef<any>[] = [
    // {
    //   id: "select",
    //   header: ({ table }) => (
    //     <div className="flex items-center justify-center">
    //       <Checkbox
    //         checked={
    //           table.getIsAllPageRowsSelected() ||
    //           (table.getIsSomePageRowsSelected() && "indeterminate")
    //         }
    //         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //         aria-label="Select all"
    //       />
    //     </div>
    //   ),
    //   cell: ({ row }) => (
    //     <div className="flex items-center justify-center">
    //       <Checkbox
    //         checked={row.getIsSelected()}
    //         onCheckedChange={(value) => row.toggleSelected(!!value)}
    //         aria-label="Select row"
    //       />
    //     </div>
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      accessorKey: "submission",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Submission" />
      ),
    },
    {
      accessorKey: "sample",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sample" />
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "taxonomy_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Taxonomy ID" />
      ),
    },
    {
      accessorKey: "taxonomy_lvl",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Taxonomy Level" />
      ),
    },
    {
      accessorKey: "abundance_num",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Numerical Abundance" />
      ),
    },
    {
      accessorKey: "abundance_frac",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fractional Abundance" />
      ),
    },
  ]

  return columns
}
