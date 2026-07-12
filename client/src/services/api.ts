import axios from 'axios'

export const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        'http://localhost:8080/api',
})

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem('accessToken')

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`
        }

        /*
         * Khi body là FormData, không tự đặt
         * Content-Type. Browser sẽ tự thêm boundary.
         */
        if (config.data instanceof FormData) {
            delete config.headers[
                'Content-Type'
                ]
        } else {
            config.headers[
                'Content-Type'
                ] = 'application/json'
        }

        return config
    },
    (error) => Promise.reject(error),
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(
                'accessToken',
            )

            localStorage.removeItem(
                'currentUser',
            )

            const isAuthPage =
                window.location.pathname ===
                '/login' ||
                window.location.pathname ===
                '/register'

            if (!isAuthPage) {
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    },
)