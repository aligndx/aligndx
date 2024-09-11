"use client"

import { DataTableColumnHeader } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { Chart, StatusIcon } from "@/components/icons"
import { routes, useUpdateSearchParams } from "@/routes"
import { Status, StatusColorMap, Submission } from "@/types/submission"
import { Data } from "@/types/data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

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
      cell: ({ row }) => {
        const workflow = row.original.workflow;

        if (typeof workflow === 'string') {
          return <div>{workflow}</div>;
        }

        return (
          <div>
            {workflow?.name}
          </div>
        );
      },
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
      accessorKey: "outputs",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Outputs" />
      ),
      cell: ({ row }) => {
        const outputs = row.original.outputs;

        if (typeof outputs === 'string') {
          return <div>{outputs}</div>;
        }

        return (
          <div>
            {outputs.map((output: Data, index: number) => (
              <Button
                key={index}
                variant="linkHover2"
                onClick={(e) => {
                  e.stopPropagation();
                  updateSearchParams({ "id": output.id }, routes.dashboard.data);
                }}>
                {output?.name}
              </Button>
            ))}
          </div>
        );
      },
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
          [Status.Queued]: "#f39c12",       // Orange
          [Status.Processing]: "#f1c40f",   // Yellow
          [Status.Finished]: "#2ecc71",     // Green
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

        return (
          <div className="flex">
            <div className="text-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant={"icon"} onClick={(e) => {
                      e.stopPropagation();
                      updateSearchParams({ "id": submissionId }, routes.dashboard.visualize);
                    }}> <Chart /> </Button></TooltipTrigger>
                  <TooltipContent>
                    <p>Visualize</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant={"icon"} onClick={(e) => {
                      e.stopPropagation();
                      updateSearchParams({ "id": submissionId }, routes.dashboard.submissions.submission);
                    }}> <StatusIcon /></Button></TooltipTrigger>
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
