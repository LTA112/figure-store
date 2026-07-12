import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom'

import StoreLayout from '../layouts/StoreLayout'

import HomePage from '../features/home/HomePage'
import ProductListPage from '../features/catalog/ProductListPage'
import ProductDetailPage from '../features/catalog/ProductDetailPage'

import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import ProtectedRoute from '../features/auth/ProtectedRoute'
import AdminRoute from '../features/auth/AdminRoute'

import UserProfilePage from '../features/user/UserProfilePage'
import ComingSoonPage from '../features/user/ComingSoonPage'

import CartPage from '../features/cart/CartPage'
import CheckoutPage from '../features/checkout/CheckoutPage'
import MyOrdersPage from '../features/orders/MyOrdersPage'

import AdminDashboardPage from '../features/admin/AdminDashboardPage'
import AdminCategoryPage from '../features/admin/category/AdminCategoryPage'
import AdminProductListPage from '../features/admin/product/AdminProductListPage'
import AdminProductFormPage from '../features/admin/product/AdminProductFormPage'

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* STORE LAYOUT: dùng chung Header và Footer */}
                <Route element={<StoreLayout />}>
                    <Route
                        path="/"
                        element={<HomePage />}
                    />

                    <Route
                        path="/products"
                        element={<ProductListPage />}
                    />

                    <Route
                        path="/products/:id"
                        element={<ProductDetailPage />}
                    />

                    <Route
                        path="/login"
                        element={<LoginPage />}
                    />

                    <Route
                        path="/register"
                        element={<RegisterPage />}
                    />

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <UserProfilePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/wishlist"
                        element={
                            <ComingSoonPage
                                title="Sản phẩm yêu thích"
                                description="Tính năng lưu sản phẩm yêu thích sẽ được hoàn thiện ở bước tiếp theo."
                            />
                        }
                    />

                    <Route
                        path="/cart"
                        element={<CartPage />}
                    />
                    <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
                </Route>

                {/* ADMIN */}
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboardPage />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/categories"
                    element={
                        <AdminRoute>
                            <AdminCategoryPage />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/products"
                    element={
                        <AdminRoute>
                            <AdminProductListPage />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/products/new"
                    element={
                        <AdminRoute>
                            <AdminProductFormPage />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/products/:id/edit"
                    element={
                        <AdminRoute>
                            <AdminProductFormPage />
                        </AdminRoute>
                    }
                />

                {/* FALLBACK */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    )
}