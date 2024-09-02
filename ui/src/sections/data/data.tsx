'use client'

import React, { useEffect } from 'react';
import { useApiService } from '@/services/api';
import FileGrid from './file-grid';

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

    return (
        <div className="p-4">
            <FileGrid data={data ?? []} isLoading={isLoading} />
        </div>
    );
}
