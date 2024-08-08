// src/services/ApiService.ts
import useAuthService from './auth-service';
import useUserService from './user-service';
import { client } from './client';

const useApiService = () => {
  const authService = useAuthService(client);
  const userService = useUserService(client);

  return {
    auth: authService,
    user: userService
  };
};

export default useApiService;