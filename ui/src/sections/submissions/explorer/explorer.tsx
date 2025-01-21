'use client'

import { useApiService } from "@/services/api";
import { useColumns } from "./columns"
import { DataTable } from "./data-table"
import { Submission } from "@/types/submission";
import { Row } from "@tanstack/react-table";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react";
import { Button } from "@/components/ui/button";


export default function SubmissionExplorer() {
    const { submissions } = useApiService();
    const { data, isLoading } = submissions.getSubmissionsQuery;
    const columns = useColumns()
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [rowsToDelete, setRowsToDelete] = useState<Row<Submission>[]>([]);
    const deleteMut = submissions.deleteSubmissionMutation

    const deleteAction = (rows: Row<Submission>[]) => {
        setIsDialogOpen(true);
        setRowsToDelete(rows);
    }

    const confirmDeletion = async () => {
        rowsToDelete.map((row: Row<Submission>) => {
            let id = row.original.id
            deleteMut.mutate({ id})
        })
        setIsDialogOpen(false);
        setRowsToDelete([]);
    };

    const cancelDeletion = () => {
        setIsDialogOpen(false);
        setRowsToDelete([]);
    };

    return (
        <div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete the selected submissions? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2 ">
                        <Button variant="outline" onClick={cancelDeletion}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeletion}>
                            Delete Permanently
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <DataTable columns={columns} data={data || []} loading={isLoading} deleteAction={deleteAction} />

        </div>
    )
}