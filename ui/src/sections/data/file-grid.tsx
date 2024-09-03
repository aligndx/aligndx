import React, { useState, useEffect } from "react";
import {
    Card,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FileIcon, FolderIcon, MoreVerticalIcon, DownloadIcon, EditIcon, Trash } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Data } from "@/types/data";
import createHumanReadableDate from "@/lib/date";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";

type FileGridProps = {
    data: Data[];
    isLoading: boolean;
    onDownload: (file: Data) => void;
    onRename: (file: Data, newName: string) => void;
    onDelete: (id: string) => void;
};

const FileGrid: React.FC<FileGridProps> = ({ data, isLoading, onDownload, onRename, onDelete }) => {
    const [currentPath, setCurrentPath] = useState<string | null>(''); // Track the current folder path
    const [currentData, setCurrentData] = useState<Data[]>([]);

    // Update the current files to display based on the current path
    useEffect(() => {
        if (!isLoading) {
            const filteredFiles = data.filter((item) => item.parent === currentPath);
            setCurrentData(filteredFiles);
        }
    }, [currentPath, data, isLoading]);

    const folders = currentData.filter((file: Data) => file.type === 'folder');
    const files = currentData.filter((file: Data) => file.type === 'file');

    const handleFolderClick = (folderId: string | undefined) => {
        if (folderId) {
            setCurrentPath(folderId); // Update the current path to the selected folder's ID
        }
    };

    const handleBackClick = () => {
        // Find the parent of the current folder and navigate back
        const parentFolder = data.find((item) => item.id === currentPath)?.parent;
        setCurrentPath(parentFolder || null); // If no parent, go back to root (null)
    };

    // Show loading skeletons if data is loading
    if (isLoading) {
        return (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(24)].map((_, index) => (
                    <Skeleton key={index} className="h-40 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-2">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                    {currentPath ? `Folder: ${currentPath}` : "My Data"}
                </h2>
                {currentPath && (
                    <Button
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        onClick={handleBackClick}
                    >
                        Back
                    </Button>
                )}
            </div>
            <div>
                <div className="flex flex-col gap-4">
                    {folders.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <h3>Folders</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {folders.map((file) => (
                                    <DataCard
                                        key={file.id}
                                        file={file}
                                        handleFolderClick={handleFolderClick}
                                        onDownload={onDownload}
                                        onRename={onRename}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {files.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <h3>Files</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {files.map((file) => (
                                    <DataCard
                                        key={file.id}
                                        file={file}
                                        handleFolderClick={handleFolderClick}
                                        onDownload={onDownload}
                                        onRename={onRename}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface DataCardProps {
    file: Data;
    handleFolderClick: (id: string) => void;
    onDownload: (file: Data) => void;
    onRename: (file: Data, newName: string) => void;
    onDelete: (id: string) => void;
}

const DataCard = ({ file, handleFolderClick, onDownload, onRename, onDelete }: DataCardProps) => {
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

    const handleDelete  = () => {
        onDelete(file.id || '');
        setDeleteDialog(false)
    }

    return (
        <Card
            className="hover:bg-muted hover:scale-[1.03]"
        // onClick={() => file.type === "folder" && handleFolderClick(file.id)}
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

export default FileGrid;
