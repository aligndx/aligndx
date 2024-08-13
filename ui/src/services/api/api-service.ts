import useAuthService from './auth-service';
import useUserService from './user-service';
import useWorkflowService from './workflow-service';
import { client } from './client';
import useSubmissionService from './submission-services';

const useApiService = () => {
  const authService = useAuthService(client);
  const userService = useUserService(client);
  const submissionService = useSubmissionService(client);
  const workflowService = useWorkflowService(client);

  return {
    auth: authService,
    user: userService,
    workflows: workflowService,
    submissions: submissionService
  };
};

export default useApiService;