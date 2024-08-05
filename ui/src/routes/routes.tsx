const BASE_ROUTES = {
    ROOT: '',
    DASHBOARD: '/dashboard',
}

export const routes = {
    home: "/dashboard",
    auth: {
        signin: `${BASE_ROUTES.ROOT}/signin`,
        signup: `${BASE_ROUTES.ROOT}/signup`,
        activate: `${BASE_ROUTES.ROOT}/activate`,
        forgotPassword: `${BASE_ROUTES.ROOT}/forgot-password`,
        resetPassword: `${BASE_ROUTES.ROOT}/reset-password`,
    },
    dashboard: {
        root: BASE_ROUTES.DASHBOARD,
        create: {
            root: `${BASE_ROUTES.DASHBOARD}/create`,
            module: `${BASE_ROUTES.DASHBOARD}/create/module`,
            workflow: `${BASE_ROUTES.DASHBOARD}/create/workflow`,
        },
        explore: `${BASE_ROUTES.DASHBOARD}/explore`,
        jobs: `${BASE_ROUTES.DASHBOARD}/jobs`,
        deployments: `${BASE_ROUTES.DASHBOARD}/deployments`,
        teams: `${BASE_ROUTES.DASHBOARD}/teams`,
    },
}
