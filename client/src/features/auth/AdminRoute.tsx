import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface AdminRouteProps {
    children: ReactNode
}

export default function AdminRoute({
                                       children,
                                   }: AdminRouteProps) {
    const { loading, isAuthenticated, isAdmin } = useAuth()

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p>Đang kiểm tra quyền truy cập...</p>
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

    if (!isAdmin) {
        return (
            <Navigate
                to="/"
                replace
            />
        )
    }

    return children
}