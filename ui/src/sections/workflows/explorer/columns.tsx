"use client"

import { DataTableColumnHeader } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Workflow } from "@/types/workflow"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowRight, GitBranch } from "@/components/icons"

export const columns: ColumnDef<Workflow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const originalRow = row.original
      const name = originalRow.name
      const url = originalRow.repository
      return (
        <div className="flex flex-col gap-2 font-medium text-lg">
          <div>{name}</div>
          <a className="flex flex-row  gap-2 underline items-center text-sm hover:text-muted-foreground" href={url} target="_blank" rel="noopener noreferrer">
            <GitBranch /> 
            {url}
          </a> 
        </div>
      )
    },
  },
  {
    id: "description",
    cell: ({ row }) => {
      const originalRow = row.original
      const description = originalRow.description

      return (
        <div className="">
          {description}
        </div>
      )
    },
  },
  {
    accessorKey: "updated",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Updated" />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const workflow = row.original.id

      return (
        <div className="text-right">
          <Button variant={"icon"} onClick={() => null}> <ArrowRight /></Button>
        </div>
      )
    },
  },
]
