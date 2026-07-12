import { useAuth } from '../auth/AuthContext'

export default function UserProfilePage() {
    const { user, logout } = useAuth()

    return (
        <div className="mx-auto max-w-3xl p-8">
            <h1 className="mb-6 text-3xl font-bold">
                Hồ sơ cá nhân
            </h1>

            <div className="space-y-3 rounded-xl bg-white p-6 shadow">
                <p>
                    <strong>Họ tên:</strong> {user?.fullName}
                </p>

                <p>
                    <strong>Email:</strong> {user?.email}
                </p>

                <p>
                    <strong>Số điện thoại:</strong>{' '}
                    {user?.phone || 'Chưa cập nhật'}
                </p>

                <p>
                    <strong>Vai trò:</strong> {user?.role}
                </p>

                <button
                    type="button"
                    onClick={logout}
                    className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-white"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    )
}