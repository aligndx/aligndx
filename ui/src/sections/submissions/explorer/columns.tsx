"use client"

import { DataTableColumnHeader } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowRight, GitBranch } from "@/components/icons"
import { routes, useUpdateSearchParams } from "@/routes"
import { Submission } from "@/types/submission"

export const useColumns = () => {
  const updateSearchParams = useUpdateSearchParams();

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "workflow",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Workflow" />
      ),
    },
    {
      accessorKey: "created",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.created);
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
      accessorKey: "data",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const submissionId = row.original.id

        return (
          <div className="text-right">
            <Button variant={"icon"} onClick={(e) => {
              e.stopPropagation(); updateSearchParams({"id" : submissionId}, routes.dashboard.submissions.submission);
            }}> <ArrowRight /></Button>
          </div>
        )
      },
    },
  ]

  return columns
}
