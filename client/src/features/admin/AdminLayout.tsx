import type { ReactNode } from 'react'
import {
    Link,
    NavLink,
    useNavigate,
} from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface AdminLayoutProps {
    children: ReactNode
    title: string
    description?: string
}

const menuItems = [
    {
        to: '/admin',
        label: 'Tổng quan',
        end: true,
    },
    {
        to: '/admin/categories',
        label: 'Danh mục',
    },
    {
        to: '/admin/products',
        label: 'Sản phẩm',
    },
]

export default function AdminLayout({
                                        children,
                                        title,
                                        description,
                                    }: AdminLayoutProps) {
    const navigate = useNavigate()
    const { user, logout } = useAuth()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <aside className="fixed inset-y-0 left-0 hidden w-64 bg-slate-950 text-white lg:block">
                <div className="border-b border-white/10 px-6 py-5">
                    <Link
                        to="/"
                        className="text-2xl font-extrabold italic"
                    >
                        Vitoy Admin
                    </Link>

                    <p className="mt-1 truncate text-xs text-slate-400">
                        {user?.email}
                    </p>
                </div>

                <nav className="space-y-2 p-4">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-white/10'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-40 border-b bg-white">
                    <div className="flex min-h-16 items-center justify-between px-5 lg:px-8">
                        <div>
                            <h1 className="text-xl font-bold">
                                {title}
                            </h1>

                            {description && (
                                <p className="text-sm text-gray-500">
                                    {description}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                to="/"
                                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                            >
                                Xem website
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-5 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}