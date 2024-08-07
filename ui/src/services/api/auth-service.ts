// src/services/AuthService.ts
import PocketBase, { RecordAuthResponse, RecordModel } from 'pocketbase';

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
  await pb.collection('users').confirmPasswordReset(passwordResetToken , password, passwordConfirm);
};

export const authService = {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  register,
  requestPasswordReset,
  confirmPasswordReset,
};

export default authService;
