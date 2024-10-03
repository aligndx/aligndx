"use client"

import { DataTableColumnHeader } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Workflow } from "@/types/workflow"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowRight, GitBranch } from "@/components/icons"
import { routes, useUpdateSearchParams } from "@/routes"

export const useColumns = () => {
  const updateSearchParams = useUpdateSearchParams();

  const columns: ColumnDef<Workflow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const originalRow = row.original
        const name = originalRow.name
        const url = originalRow.repository
        const description = originalRow.description
        return (
          <div className="flex flex-col gap-4 font-medium text-lg">
            <div>{name}</div>
            <div className="flex">
              <a className="flex flex-row  gap-2 underline items-center text-sm hover:text-muted-foreground"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { e.stopPropagation(); }}
              >
                <GitBranch />
                {url}
              </a>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "updated",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Updated" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.updated);
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        }).format(date);

        return (
          <div>
            {formattedDate}
          </div>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const workflowId = row.original.id

        return (
          <div className="text-right">
            <Button variant={"icon"} onClick={(e) => {
              e.stopPropagation(); updateSearchParams({"id" : workflowId}, routes.dashboard.workflows.workflow);
            }}> <ArrowRight /></Button>
          </div>
        )
      },
    },
  ]

  return columns
}
