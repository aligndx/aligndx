import React from "react"; 
import { Skeleton } from "@/components/ui/skeleton";
import { Data } from "@/types/data";
import DataCard from "./data-card";


type FileGridProps = {
    data: Data[];
    isLoading: boolean;
    onDownload: (file: Data) => void;
    onRename: (file: Data, newName: string) => void;
    onDelete: (id: string) => void;
    onOpen: (file: Data) => void;
};

const FileGrid: React.FC<FileGridProps> = ({ data, isLoading, onDownload, onRename, onDelete, onOpen }) => {
    const folders = data.filter((file: Data) => file.type === 'folder');
    const files = data.filter((file: Data) => file.type === 'file');

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
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
                {folders.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h3>Folders</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {folders.map((file) => (
                                <DataCard
                                    key={file.id}
                                    file={file}
                                    onOpen={onOpen}
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
                                    onOpen={onOpen}
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
    );
};





export default FileGrid;
