'use client'

import React, { useEffect, useState } from 'react';
import { useApiService } from '@/services/api';
import { Data } from '@/types/data';
import { toast } from 'sonner';
import { routes, useSearchParams, useUpdateSearchParams } from '@/routes';
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { FileGrid } from './file-grid';
import Image from 'next/image';

const ITEMS_TO_DISPLAY = 3;

export default function FileManager() {
    const { data: dataService } = useApiService();
    const {
        useGetDatasQuery,
        useUpdateDataMutation,
        useDeleteDataMutation,
        getPrivateDataURLQuery,
    } = dataService

    const { data, refetch, isLoading } = useGetDatasQuery()
    const updateData = useUpdateDataMutation()
    const deleteData = useDeleteDataMutation()

    const updateSearchParams = useUpdateSearchParams();
    const searchParams = useSearchParams();

    const [currentPath, setCurrentPath] = useState<string | null>(''); // Track the current folder path
    const [currentData, setCurrentData] = useState<Data[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<Data[]>([]);

    useEffect(() => {
        refetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPath])

    useEffect(() => {
        const itemId = searchParams.get('id');
        if (itemId) {
            setCurrentPath(itemId)
        } else {
            setCurrentPath('')
        }
    }, [searchParams])

    useEffect(() => {
        if (!isLoading && data) {
            const filteredFiles = data.filter((item) => item.parent === currentPath);
            setCurrentData(filteredFiles);
            setBreadcrumbs(generateBreadcrumbs(currentPath, data));

        }
    }, [currentPath, data, isLoading]);

    const generateBreadcrumbs = (pathId: string | null, allData: Data[]): Data[] => {
        const breadcrumbs: Data[] = [];
        let currentItem: Data | undefined = allData.find(item => item.id === pathId);

        while (currentItem) {
            breadcrumbs.unshift(currentItem); // Add to the front of the array

            // Before updating currentItem, ensure that currentItem.parent exists
            const parentItem = allData.find(item => item.id === currentItem!.parent);
            if (!parentItem) break; // Exit loop if no parent is found

            currentItem = parentItem;
        }

        // Add root breadcrumb
        breadcrumbs.unshift({ id: '', name: 'My Data' });

        return breadcrumbs;
    };

    const onDownload = async (file: Data) => {
        try {
            if (file.type === "folder") {
                return
            }
            // Get the file URL or make an API call to fetch the file data as a Blob
            const file_url = await getPrivateDataURLQuery(file.id || '');
            const filename = `${file.id}_${file.name}`
            if (file_url) {
                // Fetch the file as a blob
                const response = await fetch(file_url);
                const blob = await response.blob();

                // Create a URL for the blob
                const blobUrl = window.URL.createObjectURL(blob);

                // Create an anchor element and set its href to the blob URL
                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', filename); // Optional: set a specific filename
                document.body.appendChild(link);
                link.click();

                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Error downloading the file:', error);
        }
    }

    const onRename = async (file: Data, newName: string) => {
        const data = {
            name: newName
        }
        await updateData.mutateAsync({ id: file.id || '', data }, {
            onSuccess: (data) => {
                toast.success("Item was renamed");
                refetch();
            },
            onError: (error) => {
                toast.error("Couldn't rename that item");
            },
        })
    }


    const onDelete = async (id: string) => {
        await deleteData.mutateAsync({ id }, {
            onSuccess: (data) => {
                toast.success("Item Deleted");
                refetch();
            },
            onError: (error) => {
                toast.error("Couldn't delete that item");
            },
        })
    }

    const onOpen = async (file: Data) => {
        if (file.type === 'folder') {
            updateSearchParams({ "id": file.id }, routes.dashboard.data)
        }

    }

    return (
        <div className="flex flex-col gap-4 p-6 h-full">
            <Breadcrumb className="flex items-center space-x-2">
                <BreadcrumbList className=' text-1xl'>
                    {/* Display the first breadcrumb if there are more than ITEMS_TO_DISPLAY */}
                    {breadcrumbs.length > ITEMS_TO_DISPLAY && (
                        <>
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href={routes.dashboard.data}
                                    className="max-w-20 truncate md:max-w-none"
                                >
                                    {breadcrumbs[0].name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />

                            {/* Display ellipsis and dropdown for intermediate items */}
                            <BreadcrumbItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1">
                                        <BreadcrumbEllipsis className="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {breadcrumbs.slice(1, -2).map((item, index) => (
                                            <DropdownMenuItem key={item.id}>
                                                <Link href={item.id ? `${routes.dashboard.data}?id=${item.id}` : "#"}>
                                                    {item.name}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                        </>
                    )}

                    {/* Display the remaining breadcrumbs when the count is less than or equal to ITEMS_TO_DISPLAY */}
                    {(breadcrumbs.length <= ITEMS_TO_DISPLAY ? breadcrumbs : breadcrumbs.slice(-2)).map((item, index) => (
                        <React.Fragment key={item.id}>
                            {index === (breadcrumbs.length <= ITEMS_TO_DISPLAY ? breadcrumbs.length : 2) - 1 ? (
                                <BreadcrumbPage className="max-w-20 truncate md:max-w-none">
                                    {item.name}
                                </BreadcrumbPage>
                            ) : (
                                <>
                                    <Link
                                        href={item.id ? `${routes.dashboard.data}?id=${item.id}` : routes.dashboard.data}
                                        className="max-w-20 truncate md:max-w-none"
                                    >
                                        {item.name}
                                    </Link>
                                    <BreadcrumbSeparator />
                                </>
                            )}
                        </React.Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>

            {currentData.length > 0 ?
                <FileGrid data={currentData} isLoading={isLoading} onDownload={onDownload} onRename={onRename} onDelete={onDelete} onOpen={onOpen} />
                :
                <div className='flex flex-col items-center justify-center text-muted-foreground gap-4 h-full'>
                    <div>
                        Nothing here yet.
                    </div>
                </div>
            }
        </div>
    );
} 