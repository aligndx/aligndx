import PocketBase, { RecordModel, RecordSubscription } from 'pocketbase';
import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Submission } from '@/types/submission';

export const mapRecordToSubmission = (record: RecordModel): Submission => {
  return {
    id: record.id,
    name: record.name,
    inputs: record.inputs,
    user: record.user,
    outputs: record.expand?.outputs || record.outputs,  // Use expanded data if available
    workflow: record.expand?.workflow || record.workflow,
    status: record.status,
    created: new Date(record.created),
    updated: new Date(record.updated)
  };
};

export const getSubmission = async (pb: PocketBase, id: string): Promise<Submission> => {
  const record = await pb.collection('submissions').getOne(id, {
    expand: "workflow, outputs"
  });
  return mapRecordToSubmission(record);
};

export const getSubmissions = async (pb: PocketBase): Promise<Submission[]> => {
  const records = await pb.collection('submissions').getFullList({
    expand: "workflow, outputs"
  });
  return records.map(mapRecordToSubmission);
};

export const createSubmission = async (pb: PocketBase, data: any): Promise<Submission> => {
  const record = await pb.collection('submissions').create(data);
  return mapRecordToSubmission(record);
};

export const updateSubmission = async (pb: PocketBase, id: string, data: any): Promise<void> => {
  await pb.collection('submissions').update(id, data);
};

export const deleteSubmission = async (pb: PocketBase, id: string): Promise<void> => {
  await pb.collection('submissions').delete(id);
};

export const _subscribeToSubmission = (
  pb: PocketBase,
  id: string,
  emitter: (data: RecordSubscription<Submission>) => void
) => {
  pb.collection('submissions').subscribe(id, emitter);
  // Return the unsubscribe function
  return () => pb.collection('submissions').unsubscribe(id);
};

export const _subscribeToSubmissionEvents = (pb: PocketBase, id: string, onMessage: (event: MessageEvent) => void) => {
  // Initialize EventSource with the PocketBase SSE endpoint
  const evtSource = new EventSource(`${pb.baseUrl}/jobs/subscribe/${id}`);

  // Handle incoming messages from the SSE stream
  evtSource.onmessage = (event: MessageEvent) => {
    onMessage(event)
  };

  evtSource.onerror = (error) => {
    console.error('SSE error:', error);
    evtSource.close();
  };

  return () => evtSource.close();
};

type CreateSubmissionData = {
  name: string;
  params: any;
  workflow: string;
  user: string;
}

interface UpdateSubmissionData {
  id: string;
  data: any;
}

interface DeleteSubmissionData {
  id: string;
}
const useSubmissionService = (pb: PocketBase) => {
  const queryClient = useQueryClient();

  const useGetSubmission = (id: string): UseQueryResult<Submission, Error> =>
    useQuery({ queryKey: ['submission', id], queryFn: () => getSubmission(pb, id) });

  const getSubmissionsQuery: UseQueryResult<Submission[], Error> = useQuery({
    queryKey: ['submissions'], queryFn: () => getSubmissions(pb)
  });

  const createSubmissionMutation: UseMutationResult<Submission, Error, CreateSubmissionData> = useMutation(
    {
      mutationFn: (data: CreateSubmissionData) => createSubmission(pb, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['submissions'] });
      },
    }
  );

  const updateSubmissionMutation: UseMutationResult<void, Error, UpdateSubmissionData> = useMutation(
    {
      mutationFn: (data: UpdateSubmissionData) => updateSubmission(pb, data.id, data.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['submissions'] });
      },
    }
  );

  const deleteSubmissionMutation: UseMutationResult<void, Error, DeleteSubmissionData> = useMutation(
    {
      mutationFn: (data: DeleteSubmissionData) => deleteSubmission(pb, data.id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['submissions'] });
      },
    }
  );

  const subscribeToSubmissionEvents = (id: string, onMessage: (event: MessageEvent) => void) => {
    return _subscribeToSubmissionEvents(pb, id, onMessage)
  }


  const subscribeToSubmission = (
    id: string,
    onMessage: (data: RecordSubscription<Submission>) => void
  ) => {
    return _subscribeToSubmission(pb, id, onMessage);
  };
  

  return {
    subscribeToSubmission,
    subscribeToSubmissionEvents,
    useGetSubmission,
    getSubmissionsQuery,
    createSubmissionMutation,
    updateSubmissionMutation,
    deleteSubmissionMutation,
  };
};

export default useSubmissionService;
