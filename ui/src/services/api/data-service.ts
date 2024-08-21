import PocketBase, { RecordModel } from 'pocketbase';
import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
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
      updated: new Date(record.updated)
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
type CreateDataData = {
  name : string;
  inputs: any;
  workflow: string;
  user: string;
}

interface UpdateDataData {
  id: string;
  data: any;
}

interface DeleteDataData {
  id: string;
}
const useDataService = (pb: PocketBase) => {
  const queryClient = useQueryClient();

  const useGetData = (id: string): UseQueryResult<Data, Error> =>
    useQuery({ queryKey: ['data', id], queryFn: () => getData(pb, id) });

  const getDatasQuery: UseQueryResult<Data[], Error> = useQuery({
    queryKey: ['datas'], queryFn: () => getDatas(pb)
  });

  const createDataMutation: UseMutationResult<Data, Error, CreateDataData> = useMutation(
    {
      mutationFn: (data: CreateDataData) => createData(pb, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['datas'] });
      },
    }
  );

  const updateDataMutation: UseMutationResult<void, Error, UpdateDataData> = useMutation(
    {
      mutationFn: (data: UpdateDataData) => updateData(pb, data.id, data.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['datas'] });
      },
    }
  );

  const deleteDataMutation: UseMutationResult<void, Error, DeleteDataData> = useMutation(
    {
      mutationFn: (data: DeleteDataData) => deleteData(pb, data.id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['datas'] });
      },
    }
  );

  return {
    useGetData,
    getDatasQuery,
    createDataMutation,
    updateDataMutation,
    deleteDataMutation,
  };
};

export default useDataService;
