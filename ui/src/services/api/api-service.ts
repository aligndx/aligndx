import useAuthService from './auth-service';
import useUserService from './user-service';
import useWorkflowService from './workflow-service';
import { client } from './client';

const useApiService = () => {
  const authService = useAuthService(client);
  const userService = useUserService(client);
  const workflowService = useWorkflowService(client);

  return {
    auth: authService,
    user: userService,
    workflows: workflowService
  };
};

export default useApiService;