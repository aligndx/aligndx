const BASE_ROUTES = {
    ROOT: '',
    DASHBOARD: '/dashboard',
}

export const routes = {
    home: "/dashboard/upload",
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
        submissions: {
            root: `${BASE_ROUTES.DASHBOARD}/submissions`,
            submission: `${BASE_ROUTES.DASHBOARD}/submissions/submission`,
        },
        upload: {
            root: `${BASE_ROUTES.DASHBOARD}/upload`
        },
        workflows: {
            root: `${BASE_ROUTES.DASHBOARD}/workflows`,
            workflow: `${BASE_ROUTES.DASHBOARD}/workflows/workflow`,
        },
        explore: `${BASE_ROUTES.DASHBOARD}/explore`,
    },
}

export const publicRoutes = [routes.auth.signin, routes.auth.signup, routes.auth.activate, routes.auth.forgotPassword, routes.auth.resetPassword, "/"]
