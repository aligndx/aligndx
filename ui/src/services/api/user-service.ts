import PocketBase, { RecordModel } from 'pocketbase';
import { useMutation, useQuery, useQueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export const getUser = async (pb: PocketBase, id: string): Promise<RecordModel> => {
  const user = await pb.collection('users').getOne(id);
  return user as RecordModel;
};

export const getUsers = async (pb: PocketBase): Promise<RecordModel[]> => {
  const users = await pb.collection('users').getFullList();
  return users as RecordModel[];
};

export const createUser = async (pb: PocketBase, data: any): Promise<RecordModel> => {
  const user = await pb.collection('users').create(data);
  return user as RecordModel;
};

export const updateUser = async (pb: PocketBase, id: string, data: any): Promise<void> => {
  await pb.collection('users').update(id, data);
};

export const deleteUser = async (pb: PocketBase, id: string): Promise<void> => {
  await pb.collection('users').delete(id);
};

interface CreateUserData {
  data: any;
}

interface UpdateUserData {
  id: string;
  data: any;
}

interface DeleteUserData {
  id: string;
}

const useUserService = (pb: PocketBase) => {
  const queryClient = useQueryClient();

  const useGetUser = (id: string): UseQueryResult<RecordModel, Error> =>
    useQuery({ queryKey: ['user', id], queryFn: () => getUser(pb, id) });

  const getUsersQuery: UseQueryResult<RecordModel[], Error> = useQuery({
    queryKey: ['users'], queryFn:
      () => getUsers(pb)
  })

  const createUserMutation: UseMutationResult<RecordModel, Error, CreateUserData> = useMutation(
    {
      mutationFn: (data: CreateUserData) => createUser(pb, data.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    }
  );

  const updateUserMutation: UseMutationResult<void, Error, UpdateUserData> = useMutation(
    {
      mutationFn: (data: UpdateUserData) => updateUser(pb, data.id, data.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    }
  );

  const deleteUserMutation: UseMutationResult<void, Error, DeleteUserData> = useMutation(
    {
      mutationFn: (data: DeleteUserData) => deleteUser(pb, data.id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    }
  );

  return {
    useGetUser,
    getUsersQuery,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
  };
};

export default useUserService;
