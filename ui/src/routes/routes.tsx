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
        repository: `${BASE_ROUTES.DASHBOARD}/repository`,
        data: `${BASE_ROUTES.DASHBOARD}/data`,
        workflows: {
            root: `${BASE_ROUTES.DASHBOARD}/workflows`,
            workflow: `${BASE_ROUTES.DASHBOARD}/workflows/workflow`,
        },
        visualize: `${BASE_ROUTES.DASHBOARD}/visualize`,
    },
}
