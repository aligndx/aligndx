'use client'

import { useApiService } from "@/services/api";
import { useSearchParams } from "@/routes";
import { useEffect, useState } from "react";  // Import useState for state management
import { Tracker } from "@/components/ui/tracker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { events } from "./mock";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Submission() {
    const [submissionUpdates, setSubmissionUpdates] = useState<any>(events);
    const searchParams = useSearchParams();
    const submissionId = searchParams.get('id');
    const { submissions } = useApiService();
    const { subscribeToSubmission, useGetSubmission } = submissions;

    const { data } = useGetSubmission(submissionId || "");

    // State to manage the expanded rows
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

    const toggleRowExpansion = (index: number) => {
        setExpandedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    useEffect(() => {
        if (submissionId) {
            const handleSubmissionUpdate = (event: MessageEvent) => {
                console.log('Received new submission update:', event);
                const parsedData = JSON.parse(event.data);
                console.table(parsedData);

                // Append new submission data to the state array
                setSubmissionUpdates(prevUpdates => [...prevUpdates, parsedData]);
            };

            const unsubscribe = subscribeToSubmission(submissionId, handleSubmissionUpdate);

            return () => {
                unsubscribe();
            };
        }

        return () => { };
    }, [submissionId, subscribeToSubmission]);

    return (
        <div className="flex flex-col gap-4 h-full flex-grow">
            <div className="flex flex-col gap-4 p-4">
                <div className="flex justify-between">
                    <h1 className="text-lg">
                        {data?.name}
                    </h1>
                    <Badge>Status {data?.status}</Badge>
                </div>
                <Tracker data={generateTrackerData(submissionUpdates)} />
            </div>
            <div className="flex flex-grow">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Event Type</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead className="w-[50px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissionUpdates.map((event, index) => (
                            <>
                                <TableRow
                                    className={cn("",
                                        event.task ? "cursor-pointer" : null
                                    )}
                                    key={index}
                                    onClick={() => toggleRowExpansion(index)}
                                >
                                    <TableCell className="font-medium">{event.type}</TableCell>
                                    <TableCell>{event.message}</TableCell>
                                    <TableCell>{event.timestamp}</TableCell>
                                    <TableCell>
                                        {event.task ?

                                            <Button
                                                variant="icon"
                                                size="sm"
                                                onClick={() => toggleRowExpansion(index)}
                                            >
                                                <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${expandedRows[index] ? 'rotate-180' : 'rotate-0'}`} />
                                            </Button>
                                            : null}
                                    </TableCell>
                                </TableRow>
                                {expandedRows[index] && event.task && (
                                    <TableRow key={`${index}-expanded`}>
                                        <TableCell colSpan={4} className="p-4 bg-muted">
                                            <div><strong>Task ID:</strong> {event.task.id}</div>
                                            <div><strong>Task Name:</strong> {event.task.name}</div>
                                            <div><strong>Status:</strong> {event.task.status}</div>
                                            <div><strong>Start:</strong> {event.task.start}</div>
                                            <div><strong>Complete:</strong> {event.task.complete}</div>
                                            <div><strong>Realtime:</strong> {event.task.realtime}</div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function generateTrackerData(events) {
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
    events.forEach((event) => {
        // Check if the event is related to a process (task)
        if (event.type.startsWith("process.") && event.task) {
            const task = event.task;
            const status = task.status.toUpperCase();

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
