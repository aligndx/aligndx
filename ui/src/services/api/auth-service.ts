import PocketBase, { RecordAuthResponse, RecordModel } from 'pocketbase';
import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { User } from '@/types/user';

export const login = async (pb: PocketBase, email: string, password: string): Promise<RecordAuthResponse<RecordModel>> => {
  const user = await pb.collection('users').authWithPassword(email, password);
  return user as RecordAuthResponse<RecordModel>;
};

export const logout = async (pb: PocketBase): Promise<void> => {
  await pb.authStore.clear();
};

export const getCurrentUser = (pb: PocketBase): RecordModel | null => {
  return pb.authStore.model as RecordModel | null;
};

export const isAuthenticated = (pb: PocketBase): boolean => {
  return pb.authStore.isValid;
};

export const register = async (pb: PocketBase, email: string, password: string, additionalData: any = {}): Promise<RecordModel> => {
  const user = await pb.collection('users').create({ email, password, ...additionalData });
  return user as RecordModel;
};

export const requestPasswordReset = async (pb: PocketBase, email: string): Promise<void> => {
  await pb.collection('users').requestPasswordReset(email);
};

export const confirmPasswordReset = async (pb: PocketBase, passwordResetToken: string, password: string, passwordConfirm: string): Promise<void> => {
  await pb.collection('users').confirmPasswordReset(passwordResetToken, password, passwordConfirm);
};


interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  additionalData?: any;
}

interface ConfirmPasswordResetData {
  passwordResetToken: string;
  password: string;
  passwordConfirm: string;
}

const useAuthService = (pb: PocketBase) => {
  const queryClient = useQueryClient();

  const loginMutation: UseMutationResult<RecordAuthResponse<RecordModel>, Error, LoginData> = useMutation(
    {
      mutationFn: (data: LoginData) => login(pb, data.email, data.password),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      },
    }
  );

  const logoutMutation: UseMutationResult<void, Error, void> = useMutation(
    {
      mutationFn: () => logout(pb),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      },
    }
  );

  const registerMutation: UseMutationResult<RecordModel, Error, RegisterData> = useMutation(
    {
      mutationFn: (data: RegisterData) => register(pb, data.email, data.password, data.additionalData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      },
    }
  );

  const requestPasswordResetMutation: UseMutationResult<void, Error, string> = useMutation(
    {
      mutationFn: (email: string) => requestPasswordReset(pb, email),
    }
  );

  const confirmPasswordResetMutation: UseMutationResult<void, Error, ConfirmPasswordResetData> = useMutation(
    {
      mutationFn: (data: ConfirmPasswordResetData) => confirmPasswordReset(pb, data.passwordResetToken, data.password, data.passwordConfirm),
    }
  );


  const currentUserQuery: UseQueryResult<User | null, Error> = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(pb),
    enabled: isAuthenticated(pb),
  });


  const authStatusQuery: UseQueryResult<boolean, Error> = useQuery({
    queryKey: ['authStatus'],
    queryFn: () => isAuthenticated(pb),
  });

  return {
    loginMutation,
    logoutMutation,
    registerMutation,
    requestPasswordResetMutation,
    confirmPasswordResetMutation,
    currentUserQuery,
    authStatusQuery,
  };
};

export default useAuthService;