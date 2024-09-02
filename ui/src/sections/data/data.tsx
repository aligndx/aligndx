'use client'

import React, { useEffect } from 'react';
import { useApiService } from '@/services/api';
import FileGrid from './file-grid';
import { Data } from '@/types/data';

export default function FileManager() {
    const { data: dataService } = useApiService();
    const {
        useGetDatasQuery,
        deleteDataMutation,
        getDataURLQuery,
        getPrivateDataURLQuery,
    } = dataService

    const { data, refetch, isLoading} = useGetDatasQuery()

    useEffect(() => {
        refetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onDownload = async (file : Data) => {
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

    return (
        <div className="p-4">
            <FileGrid data={data ?? []} isLoading={isLoading} onDownload={onDownload} />
        </div>
    );
}

function generateThumbnail(id: string) {

}
