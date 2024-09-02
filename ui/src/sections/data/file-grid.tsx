import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FileIcon, FolderIcon } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Data } from "@/types/data";
import createHumanReadableDate from "@/lib/date"; 
import { Input } from "@/components/ui/input";

type FileGridProps = {
    data: Data[];
    isLoading: boolean;
};

const FileGrid: React.FC<FileGridProps> = ({ data, isLoading }) => {
    const [currentPath, setCurrentPath] = useState<string | null>(''); // Track the current folder path
    const [currentFiles, setCurrentFiles] = useState<Data[]>([]);

    // Update the current files to display based on the current path
    useEffect(() => {
        if (!isLoading) {
            console.log(data)
            const filteredFiles = data.filter((item) => item.parent === currentPath);
            setCurrentFiles(filteredFiles);
        }
    }, [currentPath, data, isLoading]);

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
        <div className="flex flex-col gap-4 p-4">
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
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Search your data..."
                    className="max-w-sm"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentFiles.map((file) => (
                    <Card
                        key={file.id}
                        className="hover:bg-muted hover:scale-[1.03] cursor-pointer"
                        onClick={() => file.type === "folder" && handleFolderClick(file.id)}
                    >
                        <CardHeader>
                            <CardTitle>
                                <div className="flex flex-row gap-2 items-center text-sm">
                                    {file.type === "folder" ? <FolderIcon /> : <FileIcon />}
                                    {file.name}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {file.type === "file" && (
                                <>
                                    <CardDescription>Size: {file.size}</CardDescription>
                                    <CardDescription>User: {file.user}</CardDescription>
                                    <CardDescription>
                                        Updated: {file.updated?.toLocaleDateString()}
                                    </CardDescription>
                                </>
                            )}
                        </CardContent>
                        <CardFooter>
                            <div className="text-muted-foreground text-xs">
                                {file.created && createHumanReadableDate(file.created)}
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default FileGrid;
