import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface ProtectedRouteProps {
    children: ReactNode
}

export default function ProtectedRoute({
                                           children,
                                       }: ProtectedRouteProps) {
    const { loading, isAuthenticated } = useAuth()

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p>Đang kiểm tra đăng nhập...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
            />
        )
    }

    return children
}