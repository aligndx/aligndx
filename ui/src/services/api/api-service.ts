// src/services/ApiService.ts
import PocketBase from 'pocketbase';
import { getUser, getUsers, createUser, updateUser, deleteUser } from './user-service';
import { login, logout, getCurrentUser, isAuthenticated, register, requestPasswordReset, confirmPasswordReset } from './auth-service';
import { API } from '@/config-global';

const pb = new PocketBase(API);

export const userService = {
  getUser: (id: string) => getUser(pb, id),
  getUsers: () => getUsers(pb),
  createUser: (data: any) => createUser(pb, data),
  updateUser: (id: string, data: any) => updateUser(pb, id, data),
  deleteUser: (id: string) => deleteUser(pb, id),
};

export const authService = {
  login: (email: string, password: string) => login(pb, email, password),
  logout: () => logout(pb),
  getCurrentUser: () => getCurrentUser(pb),
  isAuthenticated: () => isAuthenticated(pb),
  register: (email: string, password: string, additionalData: any) => register(pb, email, password, additionalData),
  requestPasswordReset: (email: string) => requestPasswordReset(pb, email),
  confirmPasswordReset: (passwordResetToken: string, password: string, passwordConfirm: string) => confirmPasswordReset(pb, passwordResetToken, password, passwordConfirm),
};

export const apiService = {
  user: userService,
  auth: authService
};

export default apiService;
