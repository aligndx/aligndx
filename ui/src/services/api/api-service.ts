// src/services/ApiService.ts
import PocketBase from 'pocketbase';
import { API } from '@/config-global';
import useAuthService from './auth-service';
import useUserService from './user-service';

const pb = new PocketBase(API);

const useApiService = () => {
  const authService = useAuthService(pb);
  const userService = useUserService(pb);

  return {
    auth: authService,
    user: userService
  };
};

export default useApiService;