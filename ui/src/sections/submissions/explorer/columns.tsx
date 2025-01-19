"use client"

import { DataTableColumnHeader } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { MagnifyingGlass, StatusIcon } from "@/components/icons"
import { routes, useUpdateSearchParams } from "@/routes"
import { Status, Submission } from "@/types/submission"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export const useColumns = () => {
  const updateSearchParams = useUpdateSearchParams();

  const columns: ColumnDef<Submission>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          className="border-primary-foreground"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          className="border-primary-foreground"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
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
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        const StatusColorMap: Record<Status, string> = {
          [Status.Created]: "#3498db",      // Blue
          [Status.Queued]: "#e67e22",       // Darker Orange 
          [Status.Processing]: "#f39c12",   // Bright Yellow 
          [Status.Completed]: "#2ecc71",    // Green
          [Status.Error]: "#e74c3c"         // Red
        };
        const statusColor = StatusColorMap[status || Status.Created]
        return (
          <Badge style={{ backgroundColor: statusColor }}>{status}</Badge>

        )
      }
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const submissionId = row.original.id
        const disabled = row.original.status != Status.Completed

        return (
          <div className="flex">
            <div className="text-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled={disabled} variant={"icon"} onClick={(e) => {
                      e.stopPropagation();
                      updateSearchParams({ "id": submissionId }, routes.dashboard.explore);
                    }}> <MagnifyingGlass /> </Button></TooltipTrigger>
                  <TooltipContent>
                    <p>Explore</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={"icon"} onClick={(e) => {
                      e.stopPropagation();
                      updateSearchParams({ "id": submissionId }, routes.dashboard.submissions.submission);
                    }}>
                      <StatusIcon />
                    </Button></TooltipTrigger>
                  <TooltipContent>
                    <p>Events</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )
      },
    },
  ]

  return columns
}
