import createHumanReadableDate from "@/lib/date";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Data } from "@/types/data";
import { FileIcon, FolderIcon, MoreVerticalIcon, DownloadIcon, EditIcon, Trash } from "@/components/icons";

import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
    Card,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
interface DataCardProps {
    file: Data;
    onDownload: (file: Data) => void;
    onRename: (file: Data, newName: string) => void;
    onDelete: (id: string) => void;
    onOpen: (file: Data) => void;
}

const DataCard = ({ file, onDownload, onRename, onDelete, onOpen }: DataCardProps) => {
    const [renameDialog, setRenameDialog] = useState<boolean>(false);
    const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
    const [newFileName, setNewFileName] = useState<string>(file.name || '');
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewFileName(e.target.value);
    };

    const handleRename = () => {
        if (newFileName && newFileName !== file.name) {
            onRename(file, newFileName);
            setRenameDialog(false);
        }
    };

    const handleDelete = () => {
        onDelete(file.id || '');
        setDeleteDialog(false)
    }

    return (
        <Card
            className="hover:bg-muted hover:scale-[1.03]"
            onDoubleClick={() => file.type === "folder" && onOpen(file)}
        >
            <CardHeader>
                <CardTitle>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2 justify-between ">
                            <div className="flex gap-2 items-center text-sm overflow-hidden">
                                <div>
                                    {file.type === "folder" ? <FolderIcon /> : <FileIcon />}
                                </div>
                                <div className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                                    {file.name}
                                </div>
                            </div>
                            <div>
                                <DropdownMenu
                                    key={file.id}
                                    open={dropdownOpen}
                                    onOpenChange={setDropdownOpen}
                                >
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="icon" size="icon">
                                            <MoreVerticalIcon className="h-4 w-4" />
                                            <span className="sr-only">More</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem disabled={file.type === "folder"} onClick={() => onDownload(file)}>
                                            <div className="flex flex-row items-center gap-4 text-sm">
                                                <div>
                                                    <DownloadIcon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    Download
                                                </div>
                                            </div>
                                        </DropdownMenuItem>


                                        <Dialog open={renameDialog} onOpenChange={() => setRenameDialog(!renameDialog)}>
                                            <DialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => {
                                                    e.preventDefault();
                                                }}>
                                                    <div className="flex flex-row items-center gap-4 text-sm"
                                                    >
                                                        <EditIcon className="h-4 w-4" />
                                                        Rename
                                                    </div>
                                                </DropdownMenuItem>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle className="py-2">Rename</DialogTitle>
                                                    <DialogDescription />
                                                    <div className="flex flex-col gap-4">
                                                        <Input
                                                            placeholder={file.name}
                                                            value={newFileName}
                                                            onChange={handleNameChange}
                                                        />
                                                        <div className="flex flex-row gap-2 justify-end">
                                                            <Button variant="outline" onClick={() => setRenameDialog(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button variant="default" onClick={handleRename}>
                                                                Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogHeader>
                                            </DialogContent>
                                        </Dialog>
                                        <DropdownMenuSeparator />
                                        <Dialog open={deleteDialog} onOpenChange={() => setDeleteDialog(!deleteDialog)}>
                                            <DialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => {
                                                    e.preventDefault();
                                                }}>
                                                    <div className="flex flex-row items-center gap-4 text-sm"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                        Delete
                                                    </div>
                                                </DropdownMenuItem>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle className="py-2">Delete</DialogTitle>
                                                    <DialogDescription>Are you sure you want to proceed? This is a destructive action.</DialogDescription>
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex flex-row gap-2 justify-end">
                                                            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button variant="destructive" onClick={handleDelete}>
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogHeader>
                                            </DialogContent>
                                        </Dialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardFooter>
                <div className="text-muted-foreground text-xs">
                    {file.updated && createHumanReadableDate(file.updated)}
                </div>
            </CardFooter>
        </Card>
    )
}

export default DataCard;