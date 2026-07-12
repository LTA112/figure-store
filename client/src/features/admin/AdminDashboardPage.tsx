import { Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'

export default function AdminDashboardPage() {
    return (
        <AdminLayout
            title="Tổng quan"
            description="Quản lý dữ liệu cửa hàng Vitoy"
        >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Link
                    to="/admin/categories"
                    className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                    <div className="text-3xl">📁</div>

                    <h2 className="mt-4 text-lg font-bold">
                        Quản lý danh mục
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Thêm, cập nhật, ngừng hoạt động và
                        xóa danh mục.
                    </p>
                </Link>

                <Link
                    to="/admin/products"
                    className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                    <div className="text-3xl">📦</div>

                    <h2 className="mt-4 text-lg font-bold">
                        Quản lý sản phẩm
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Quản lý sản phẩm, tồn kho, giá và
                        hình ảnh Cloudinary.
                    </p>
                </Link>

                <div className="rounded-2xl bg-white p-6 shadow-sm opacity-60">
                    <div className="text-3xl">🧾</div>

                    <h2 className="mt-4 text-lg font-bold">
                        Quản lý đơn hàng
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Sẽ được thực hiện sau Cart và
                        Checkout.
                    </p>
                </div>
            </div>
        </AdminLayout>
    )
}