import PocketBase, { RecordModel } from 'pocketbase';
import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Submission } from '@/types/submission';
import { useEffect } from 'react';

export const mapRecordToSubmission = (record: RecordModel): Submission => {
  return {
    id: record.id,
    name: record.name,
    inputs: record.inputs,
    user: record.user,
    workflow: record.workflow,
    created: new Date(record.created),
    updated: new Date(record.updated)
  };
};

export const getSubmission = async (pb: PocketBase, id: string): Promise<Submission> => {
  const record = await pb.collection('submissions').getOne(id);
  return mapRecordToSubmission(record);
};

export const getSubmissions = async (pb: PocketBase): Promise<Submission[]> => {
  const records = await pb.collection('submissions').getFullList();
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

export const _subscribeToSubmission = (pb: PocketBase, id: string, onUpdate: (submission: Submission) => void) => {
  // Initialize EventSource with the PocketBase SSE endpoint
  const evtSource = new EventSource(`${pb.baseUrl}/jobs/subscribe/${id}`);

  // Handle incoming messages from the SSE stream
  evtSource.onmessage = (event) => {
    const update = JSON.parse(event.data);
    console.log('Received submission update:', update);

    if (update.action === 'create' || update.action === 'update') {
      const submission = mapRecordToSubmission(update.record);
      onUpdate(submission);
    }
  };

  evtSource.onerror = (error) => {
    console.error('SSE error:', error);
    evtSource.close();
  };

  return () => evtSource.close();
};

type CreateSubmissionData = {
  name: string;
  inputs: any;
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

  const subscribeToSubmission = (id: string, onUpdate: (submission: Submission) => void) => {
    return _subscribeToSubmission(pb, id, onUpdate)
  }

  return {
    subscribeToSubmission,
    useGetSubmission,
    getSubmissionsQuery,
    createSubmissionMutation,
    updateSubmissionMutation,
    deleteSubmissionMutation,
  };
};

export default useSubmissionService;
