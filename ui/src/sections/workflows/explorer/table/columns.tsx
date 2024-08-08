"use client"

import { DataTableColumnHeader } from "@/components/data-table/column-header"
import { Button } from "@/components/ui/button"
import { Workflow } from "@/types/workflow"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowRight } from "@/components/icons"

export const columns: ColumnDef<Workflow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const originalRow = row.original
      const name = originalRow.name
      const description = originalRow.description
      return (
        <div className="flex flex-col gap-4 font-medium">
          <h1 className="text-lg ">
            {name}
          </h1>
          <p className="text-sm">
            {description}
          </p>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original
 
      return (
        <div className="text-right">
          <Button variant={"icon"} onClick={() => null}> <ArrowRight /></Button>
        </div>
      )
    },
  },
]
