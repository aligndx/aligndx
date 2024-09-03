import PocketBase, { RecordModel } from 'pocketbase';
import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult, UseQueryOptions } from '@tanstack/react-query';
import { Data } from '@/types/data';

export const mapRecordToData = (record: RecordModel): Data => {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    file: record.file,
    size: record.size,
    parent: record.parent,
    user: record.user,
    created: new Date(record.created),
    updated: new Date(record.updated),
  };
};

export const getData = async (pb: PocketBase, id: string): Promise<Data> => {
  const record = await pb.collection('data').getOne(id);
  return mapRecordToData(record);
};

export const getDatas = async (pb: PocketBase): Promise<Data[]> => {
  const records = await pb.collection('data').getFullList();
  return records.map(mapRecordToData);
};

export const createData = async (pb: PocketBase, data: any): Promise<Data> => {
  const record = await pb.collection('data').create(data);
  return mapRecordToData(record);
};

export const updateData = async (pb: PocketBase, id: string, data: any): Promise<void> => {
  await pb.collection('data').update(id, data);
};

export const deleteData = async (pb: PocketBase, id: string): Promise<void> => {
  await pb.collection('data').delete(id);
};

export const _getDataURL = async (pb: PocketBase, id: string): Promise<string> => {
  const record = await pb.collection('data').getOne(id);
  const url = await pb.files.getUrl(record, record.file);
  return url;
};

export const _getPrivateDataURL = async (pb: PocketBase, id: string): Promise<string> => {
  try {
    const fileToken = await pb.files.getToken();

    const record = await pb.collection('data').getOne(id);
    if (!record) {
      console.error("No record found for ID:", id);
      return '';
    }

    const url = pb.files.getUrl(record, record.file, { token: fileToken });

    return url;
  } catch (error) {
    console.error("Error fetching private data URL:", error);
    throw error;
  }
};

type UpdateDataData = {
  id: string;
  data: any;
};

interface DeleteDataData {
  id: string;
}

const useDataService = (pb: PocketBase) => {
  const queryClient = useQueryClient();

  const useGetDataQuery = (
    id: string,
    options?: UseQueryOptions<Data, Error>
  ): UseQueryResult<Data, Error> => {
    return useQuery({
      queryKey: ['Data', id],
      queryFn: () => getData(pb, id),
      ...options,
    });
  };

  const useGetDatasQuery = (queryOptions?: UseQueryOptions<Data[], Error>): UseQueryResult<Data[], Error> => {
    return useQuery({
      queryKey: ['datas'],
      queryFn: () => getDatas(pb),
      enabled: false, // Default to disabled
      ...queryOptions, // Override with user-provided options
    });
  };

  const useCreateDataMutation = (): UseMutationResult<Data, Error, FormData> => {
    return useMutation({
      mutationFn: (data: FormData) => createData(pb, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['datas'] });
      },
    });
  };

  const useUpdateDataMutation = (): UseMutationResult<void, Error, UpdateDataData> => {
    return useMutation({
      mutationFn: (data: UpdateDataData) => updateData(pb, data.id, data.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['datas'] });
      },
    });
  };

  const useDeleteDataMutation = (): UseMutationResult<void, Error, DeleteDataData> => {
    return useMutation({
      mutationFn: (data: DeleteDataData) => deleteData(pb, data.id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['datas'] });
      },
    });
  };

  const getPrivateDataURLQuery = async (id: string) => {
    return await _getPrivateDataURL(pb, id);
  };

  const getDataURLQuery = async (id: string) => {
    return await _getDataURL(pb, id);
  };

  return {
    getDataURLQuery,
    getPrivateDataURLQuery,
    useGetDataQuery,
    useGetDatasQuery,
    useCreateDataMutation,
    useUpdateDataMutation,
    useDeleteDataMutation,
  };
};

export default useDataService;
