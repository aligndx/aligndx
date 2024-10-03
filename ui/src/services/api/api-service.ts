import useAuthService from './auth-service';
import useUserService from './user-service';
import useWorkflowService from './workflow-service';
import { client } from './client';
import useSubmissionService from './submission-services';
import useDataService from './data-service';

const useApiService = () => {
  const authService = useAuthService(client);
  const userService = useUserService(client);
  const submissionService = useSubmissionService(client);
  const workflowService = useWorkflowService(client);
  const dataService = useDataService(client);

  return {
    auth: authService,
    user: userService,
    submissions: submissionService,
    workflows: workflowService,
    data: dataService,
  };
};

export default useApiService;