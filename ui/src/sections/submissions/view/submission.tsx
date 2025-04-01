'use client'

import { useApiService } from "@/services/api";
import { routes, useSearchParams, useUpdateSearchParams } from "@/routes";
import { memo, useEffect, useState } from "react";
import { Tracker } from "@/components/ui/tracker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { capitalize, cn } from "@/lib/utils";
import { Event } from "@/types/event";
import { Badge } from "@/components/ui/badge";
import { MagnifyingGlass } from "@/components/icons";
import { Status, type Submission } from "@/types/submission";
import { RecordSubscription } from "pocketbase";
import { useAutoScroll } from "@/hooks/use-autoscroll";
import { TextAnimate } from "@/components/ui/text-animate";
import { toast } from "sonner";

const MemoizedTextAnimate = memo(function MemoizedTextAnimate({ text }: { text: string }) {
    return (
        <TextAnimate animation="slideLeft" by="character">
            {text}
        </TextAnimate>
    );
});


export default function Submission() {
    const searchParams = useSearchParams();
    const submissionId = searchParams.get('id');
    const { submissions } = useApiService();
    const { subscribeToSubmission, subscribeToSubmissionEvents, useGetSubmission } = submissions;

    const { data: initialData } = useGetSubmission(submissionId || "");
    const [submissionUpdates, setSubmissionUpdates] = useState<Event[]>([]);
    const [data, setData] = useState<Submission | null>(null);

    const updateSearchParams = useUpdateSearchParams();


    useEffect(() => {
        setData(initialData ?? null);
    }, [initialData]);

    useEffect(() => {
        if (!submissionId) return; // Make sure the ID is valid

        // Define the callback to handle subscription updates
        const handleSubmissionUpdate = (data: RecordSubscription<Submission>) => {
            setData(data.record);
        };

        // Subscribe to submission updates
        const unsubscribe = subscribeToSubmission(submissionId, handleSubmissionUpdate);

        // Clean up subscription on unmount
        return () => {
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submissionId]);

    useEffect(() => {
        if (!submissionId) return; // Ensure submissionId is valid
        const handleSubmissionUpdate = (event: MessageEvent) => {
            const parsedData = JSON.parse(event.data);
            setSubmissionUpdates(prevUpdates => [...prevUpdates, parsedData]);
        };

        const unsubscribe = subscribeToSubmissionEvents(submissionId, handleSubmissionUpdate);

        return () => {
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submissionId]);


    return (
        <div className="flex flex-col gap-4 h-full flex-grow">

            <div className="flex flex-col gap-4 p-4">
                <Button
                    variant="secondary"
                    disabled={data?.status != "completed"}
                    onClick={() => {
                        updateSearchParams({ "id": data?.id }, routes.dashboard.explore);
                    }}
                    className="flex items-center justify-center gap-2"
                >
                    <MagnifyingGlass />
                    Explore Results
                </Button>
                <div className="flex justify-between items-center">
                    <h1 className="text-lg">
                        <MemoizedTextAnimate text={data?.name || ""} />
                    </h1>

                    <Badge>Status | {capitalize(data?.status || "")}</Badge>
                </div>
                {submissionUpdates.length > 0 &&
                    <Tracker data={generateTrackerData(submissionUpdates)} />
                }
            </div>
            {submissionUpdates.length > 0 &&
                <EventViewer events={submissionUpdates} />
            }
        </div>
    );
}


function generateTrackerData(events: Event[]) {
    // Define a color map for different statuses
    const statusColorMap = {
        NEW: "bg-gray-500",
        SUBMITTED: "bg-blue-500",
        RUNNING: "bg-emerald-600",
        COMPLETED: "bg-green-500",
        FAILED: "bg-red-600",
        ABORTED: "bg-yellow-600",
    };

    // Use a Map to keep track of tasks by their ID
    const taskMap = new Map();

    // Iterate through each event
    events.forEach((event: Event) => {
        // Check if the event is related to a process (task)
        if (event.type && event.type.startsWith("process.") && event.metadata) {
            const task = event.metadata;
            type Status = keyof typeof statusColorMap;

            const status = task?.status.toUpperCase() as Status;

            // Determine the color based on the status
            const color = statusColorMap[status] || "bg-gray-400"; // Default color if status is not recognized

            // Create a tooltip message combining task name and status
            const tooltip = `Task: ${task.name}\nStatus: ${status}`;

            // Create the block data object
            const blockData = {
                key: task.id, // Use task ID as the key
                color: color, // Determine color dynamically
                tooltip: tooltip, // Combine name and status for tooltip
                hoverEffect: true, // Enable hover effect
            };

            // Update the task map with the latest event data
            taskMap.set(task.id, blockData);
        }
    });

    // Convert the Map to an array for the tracker component
    return Array.from(taskMap.values());
}


function EventViewer({ events }: { events: Event[] }) {
    const { containerRef, handleScroll, handleTouchStart } = useAutoScroll([events]);
    // State to manage the expanded rows
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

    const toggleRowExpansion = (index: number) => {
        setExpandedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <div
            className="flex flex-col h-[40rem]"
        >
            <Table
                viewportRef={containerRef}
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
            >
                <TableHeader
                    className="sticky top-0 z-10 bg-background h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                    <TableRow>
                        <TableHead className="w-[150px]">Event Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead className="w-[50px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {events.map((event, index) => (
                        <>
                            <TableRow
                                className={cn("",
                                    event.metadata ? "cursor-pointer" : null
                                )}
                                key={index}
                                onClick={() => toggleRowExpansion(index)}
                            >
                                <TableCell className="font-medium">{event.type}</TableCell>
                                <TableCell>{event.message}</TableCell>
                                <TableCell>{event.timestamp}</TableCell>
                                <TableCell>
                                    {event.metadata ?

                                        <Button
                                            variant="icon"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleRowExpansion(index);
                                            }}
                                        >
                                            <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${expandedRows[index] ? 'rotate-180' : 'rotate-0'}`} />
                                        </Button>
                                        : null}
                                </TableCell>
                            </TableRow>
                            {expandedRows[index] && event.metadata && (
                                <TableRow key={`${index}-expanded`}>
                                    <TableCell colSpan={4} className="p-4 bg-muted">
                                        {Object.entries(event.metadata).map(([key, value]) => (
                                            <div key={key}>
                                                <pre>
                                                    <code>
                                                        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}</strong>: {value}
                                                    </code>
                                                </pre>
                                            </div>
                                        ))}
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}