import PocketBase, { RecordAuthResponse, RecordModel } from 'pocketbase';
import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { User } from '@/types/user';

export const login = async (pb: PocketBase, email: string, password: string): Promise<RecordAuthResponse<RecordModel>> => {
  const user = await pb.collection('users').authWithPassword(email, password);
  return user;
};

export const _logout = async (pb: PocketBase): Promise<void> => {
  await pb.authStore.clear();
};

export const _getCurrentUser = (pb: PocketBase): RecordModel | null => {
  return pb.authStore.model as RecordModel | null;
};

export const _isAuthenticated = (pb: PocketBase): boolean => {
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

  const logout = () => {
    return _logout(pb)
  }

  const getCurrentUser = () => {
    return _getCurrentUser(pb)
  }

  const isAuthenticated = () => {
    return _isAuthenticated(pb)
  }

  return {
    loginMutation,
    logout,
    registerMutation,
    requestPasswordResetMutation,
    confirmPasswordResetMutation,
    getCurrentUser,
    isAuthenticated
  };
};

export default useAuthService;