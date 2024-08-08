import PocketBase, { RecordModel } from 'pocketbase';
import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export const getWorkflow = async (pb: PocketBase, id: string): Promise<RecordModel> => {
  const workflow = await pb.collection('workflows').getOne(id);
  return workflow as RecordModel;
};

export const getWorkflows = async (pb: PocketBase): Promise<RecordModel[]> => {
  const workflows = await pb.collection('workflows').getFullList();
  return workflows as RecordModel[];
};

export const createWorkflow = async (pb: PocketBase, data: any): Promise<RecordModel> => {
  const workflow = await pb.collection('workflows').create(data);
  return workflow as RecordModel;
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

  const useGetWorkflow = (id: string): UseQueryResult<RecordModel, Error> =>
    useQuery({ queryKey: ['workflow', id], queryFn: () => getWorkflow(pb, id) });

  const getWorkflowsQuery: UseQueryResult<RecordModel[], Error> = useQuery({
    queryKey: ['workflows'], queryFn:
      () => getWorkflows(pb)
  })

  const createWorkflowMutation: UseMutationResult<RecordModel, Error, CreateWorkflowData> = useMutation(
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
