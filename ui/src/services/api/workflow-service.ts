import PocketBase, { RecordModel } from 'pocketbase';
import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Workflow } from '@/types/workflow';

export const mapRecordToWorkflow = (record: RecordModel): Workflow => {
  return {
      id: record.id,
      name: record.name,
      repository: record.repository,
      description: record.description,
      schema: record.schema,
      created: new Date(record.created),
      updated: new Date(record.updated)
  };
};

export const getWorkflow = async (pb: PocketBase, id: string): Promise<Workflow> => {
  const record = await pb.collection('workflows').getOne(id);
  return mapRecordToWorkflow(record);
};

export const getWorkflows = async (pb: PocketBase): Promise<Workflow[]> => {
  const records = await pb.collection('workflows').getFullList();
  return records.map(mapRecordToWorkflow);
};

export const createWorkflow = async (pb: PocketBase, data: any): Promise<Workflow> => {
  const record = await pb.collection('workflows').create(data);
  return mapRecordToWorkflow(record);
};

export const updateWorkflow = async (pb: PocketBase, id: string, data: any): Promise<void> => {
  await pb.collection('workflows').update(id, data);
};

export const deleteWorkflow = async (pb: PocketBase, id: string): Promise<void> => {
  await pb.collection('workflows').delete(id);
};
interface CreateWorkflowData {
  data: any;
}

interface UpdateWorkflowData {
  id: string;
  data: any;
}

interface DeleteWorkflowData {
  id: string;
}
const useWorkflowService = (pb: PocketBase) => {
  const queryClient = useQueryClient();

  const useGetWorkflow = (id: string): UseQueryResult<Workflow, Error> =>
    useQuery({ queryKey: ['workflow', id], queryFn: () => getWorkflow(pb, id) });

  const getWorkflowsQuery: UseQueryResult<Workflow[], Error> = useQuery({
    queryKey: ['workflows'], queryFn: () => getWorkflows(pb)
  });

  const createWorkflowMutation: UseMutationResult<Workflow, Error, CreateWorkflowData> = useMutation(
    {
      mutationFn: (data: CreateWorkflowData) => createWorkflow(pb, data.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
      },
    }
  );

  const updateWorkflowMutation: UseMutationResult<void, Error, UpdateWorkflowData> = useMutation(
    {
      mutationFn: (data: UpdateWorkflowData) => updateWorkflow(pb, data.id, data.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
      },
    }
  );

  const deleteWorkflowMutation: UseMutationResult<void, Error, DeleteWorkflowData> = useMutation(
    {
      mutationFn: (data: DeleteWorkflowData) => deleteWorkflow(pb, data.id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
      },
    }
  );

  return {
    useGetWorkflow,
    getWorkflowsQuery,
    createWorkflowMutation,
    updateWorkflowMutation,
    deleteWorkflowMutation,
  };
};

export default useWorkflowService;
