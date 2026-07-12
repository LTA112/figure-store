import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import { getCurrentUserApi } from './authAPI'
import type { AuthData, AuthUser } from './authTypes'

interface AuthContextValue {
    user: AuthUser | null
    token: string | null
    loading: boolean
    isAuthenticated: boolean
    isAdmin: boolean
    saveLogin: (authData: AuthData) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(
    undefined,
)

export function AuthProvider({
                                 children,
                             }: {
    children: ReactNode
}) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const storedUser = localStorage.getItem('currentUser')

        if (!storedUser) {
            return null
        }

        try {
            return JSON.parse(storedUser) as AuthUser
        } catch {
            localStorage.removeItem('currentUser')
            return null
        }
    })

    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem('accessToken'),
    )

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadCurrentUser = async () => {
            if (!token) {
                setLoading(false)
                return
            }

            try {
                const response = await getCurrentUserApi()

                setUser(response.data)

                localStorage.setItem(
                    'currentUser',
                    JSON.stringify(response.data),
                )
            } catch {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('currentUser')

                setToken(null)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        void loadCurrentUser()
    }, [token])

    const saveLogin = (authData: AuthData) => {
        localStorage.setItem('accessToken', authData.token)
        localStorage.setItem(
            'currentUser',
            JSON.stringify(authData.user),
        )

        setToken(authData.token)
        setUser(authData.user)
    }

    const logout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('currentUser')

        setToken(null)
        setUser(null)
    }

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            token,
            loading,
            isAuthenticated: Boolean(token && user),
            isAdmin: user?.role === 'ADMIN',
            saveLogin,
            logout,
        }),
        [user, token, loading],
    )

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error(
            'useAuth phải được sử dụng bên trong AuthProvider',
        )
    }

    return context
}