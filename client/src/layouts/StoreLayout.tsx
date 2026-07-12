import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../features/auth/AuthContext'
import { getCartApi } from '../features/cart/cartAPI'
import { getGuestCartCount } from '../features/cart/guestCart'

import type { Cart } from '../features/cart/cartTypes'

const socialLinks = {
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/',
}

const navClass = ({
                    isActive,
                  }: {
  isActive: boolean
}) =>
    `whitespace-nowrap transition ${
        isActive
            ? 'font-bold text-[#3157d5]'
            : 'hover:text-[#3157d5]'
    }`

export default function StoreLayout() {
  const navigate = useNavigate()

  const {
    user,
    isAuthenticated,
    isAdmin,
    logout,
  } = useAuth()

  const [
    openUserMenu,
    setOpenUserMenu,
  ] = useState(false)

  const [
    searchKeyword,
    setSearchKeyword,
  ] = useState('')

  const [
    cartCount,
    setCartCount,
  ] = useState(0)

  useEffect(() => {
    const loadCartCount =
        async (): Promise<void> => {
          if (!isAuthenticated) {
            setCartCount(
                getGuestCartCount(),
            )

            return
          }

          if (isAdmin) {
            setCartCount(0)
            return
          }

          try {
            const cart =
                await getCartApi()

            setCartCount(
                cart.totalQuantity ?? 0,
            )
          } catch (error) {
            console.error(
                'Không thể tải số lượng giỏ hàng:',
                error,
            )

            setCartCount(0)
          }
        }

    const handleGuestCartUpdated =
        (): void => {
          if (!isAuthenticated) {
            setCartCount(
                getGuestCartCount(),
            )
          }
        }

    const handleServerCartUpdated = (
        event: Event,
    ): void => {
      if (
          !isAuthenticated ||
          isAdmin
      ) {
        return
      }

      const customEvent =
          event as CustomEvent<
              Cart | undefined
          >

      if (customEvent.detail) {
        setCartCount(
            customEvent.detail
                .totalQuantity ?? 0,
        )

        return
      }

      void loadCartCount()
    }

    void loadCartCount()

    window.addEventListener(
        'storage',
        handleGuestCartUpdated,
    )

    window.addEventListener(
        'guest-cart-updated',
        handleGuestCartUpdated,
    )

    window.addEventListener(
        'server-cart-updated',
        handleServerCartUpdated,
    )

    return () => {
      window.removeEventListener(
          'storage',
          handleGuestCartUpdated,
      )

      window.removeEventListener(
          'guest-cart-updated',
          handleGuestCartUpdated,
      )

      window.removeEventListener(
          'server-cart-updated',
          handleServerCartUpdated,
      )
    }
  }, [
    isAuthenticated,
    isAdmin,
  ])

  const handleSearch = (
      event:
      React.FormEvent<HTMLFormElement>,
  ): void => {
    event.preventDefault()

    const keyword =
        searchKeyword.trim()

    navigate(
        keyword
            ? `/products?keyword=${encodeURIComponent(
                keyword,
            )}`
            : '/products',
    )
  }

  const handleLogout = (): void => {
    logout()
    setOpenUserMenu(false)
    setCartCount(
        getGuestCartCount(),
    )
    navigate('/')
  }

  return (
      <div className="min-h-screen bg-[#f3f4f6] text-[#171717]">
        <div className="mx-auto min-h-screen max-w-[1440px] bg-white">
          <header className="sticky top-0 z-50 bg-white shadow-sm">
            <div className="border-b border-gray-200">
              <div className="flex min-h-[72px] items-center justify-between gap-4 px-5 lg:px-14">
                <Link
                    to="/"
                    className="rounded-full bg-[#3157d5] px-5 py-1.5 text-lg font-bold italic text-white transition hover:bg-[#2848b9]"
                >
                  Vitoy
                </Link>

                <form
                    onSubmit={handleSearch}
                    className="hidden flex-1 md:block"
                >
                  <div className="relative mx-auto max-w-md">
                    <input
                        value={searchKeyword}
                        onChange={(event) =>
                            setSearchKeyword(
                                event.target.value,
                            )
                        }
                        placeholder="Tìm kiếm mô hình..."
                        className="h-10 w-full rounded-full border border-gray-300 px-5 pr-12 text-sm outline-none transition focus:border-[#3157d5] focus:ring-2 focus:ring-[#3157d5]/10"
                    />

                    <button
                        type="submit"
                        aria-label="Tìm kiếm"
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      🔍
                    </button>
                  </div>
                </form>

                <div className="flex items-center gap-5">
                  <div className="relative">
                    <button
                        type="button"
                        onClick={() =>
                            setOpenUserMenu(
                                (previous) =>
                                    !previous,
                            )
                        }
                        className="flex items-center gap-2"
                        aria-label="Tài khoản"
                    >
                    <span className="text-xl">
                      👤
                    </span>

                      {isAuthenticated && (
                          <span className="hidden max-w-28 truncate text-sm font-medium lg:block">
                        {user?.fullName}
                      </span>
                      )}
                    </button>

                    {openUserMenu && (
                        <div className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                          {!isAuthenticated ? (
                              <>
                                <Link
                                    to="/login"
                                    onClick={() =>
                                        setOpenUserMenu(
                                            false,
                                        )
                                    }
                                    className="block px-4 py-2.5 text-sm hover:bg-gray-100"
                                >
                                  Đăng nhập
                                </Link>

                                <Link
                                    to="/register"
                                    onClick={() =>
                                        setOpenUserMenu(
                                            false,
                                        )
                                    }
                                    className="block px-4 py-2.5 text-sm hover:bg-gray-100"
                                >
                                  Đăng ký
                                </Link>
                              </>
                          ) : (
                              <>
                                <div className="border-b border-gray-200 px-4 py-3">
                                  <p className="truncate font-semibold">
                                    {user?.fullName}
                                  </p>

                                  <p className="truncate text-xs text-gray-500">
                                    {user?.email}
                                  </p>
                                </div>

                                <Link
                                    to={
                                      isAdmin
                                          ? '/admin'
                                          : '/profile'
                                    }
                                    onClick={() =>
                                        setOpenUserMenu(
                                            false,
                                        )
                                    }
                                    className="block px-4 py-2.5 text-sm hover:bg-gray-100"
                                >
                                  {isAdmin
                                      ? 'Trang quản trị'
                                      : 'Hồ sơ cá nhân'}
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-gray-100"
                                >
                                  Đăng xuất
                                </button>
                              </>
                          )}
                        </div>
                    )}
                  </div>

                  <Link
                      to="/wishlist"
                      aria-label="Yêu thích"
                      className="text-2xl transition hover:text-[#3157d5]"
                  >
                    ♡
                  </Link>

                  <Link
                      to="/cart"
                      aria-label="Giỏ hàng"
                      className="relative text-xl transition hover:text-[#3157d5]"
                  >
                    🛒

                    {cartCount > 0 && (
                        <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3157d5] px-1 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>

            <nav className="border-b border-gray-200 bg-white">
              <div className="mx-auto flex min-h-[50px] max-w-7xl items-center justify-center gap-5 overflow-x-auto px-4 text-sm font-medium sm:gap-10">
                <NavLink
                    to="/"
                    end
                    className={navClass}
                >
                  Trang chủ
                </NavLink>

                <NavLink
                    to="/products?keyword=nhân%20vật"
                    className={navClass}
                >
                  Nhân vật
                </NavLink>

                <NavLink
                    to="/products?keyword=blind%20box"
                    className={navClass}
                >
                  Blind Box
                </NavLink>

                <NavLink
                    to="/products"
                    className={navClass}
                >
                  Mô hình
                </NavLink>

                <Link
                    to="/#creators"
                    className="whitespace-nowrap transition hover:text-[#3157d5]"
                >
                  Thế giới Vitoy
                </Link>
              </div>
            </nav>
          </header>

          <main>
            <Outlet />
          </main>

          <footer className="bg-[#2848b9] px-6 py-12 text-white lg:px-14">
            <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="inline-flex rounded-full bg-white px-5 py-1.5 text-lg font-bold italic text-[#3157d5]">
                  Vitoy
                </div>

                <p className="mt-5 text-sm leading-7 text-blue-100">
                  Art toy và mô hình sưu
                  tầm mang cảm hứng văn
                  hóa Việt Nam.
                </p>
              </div>

              <div>
                <h3 className="font-bold">
                  Khám phá
                </h3>

                <div className="mt-5 space-y-3 text-sm text-blue-100">
                  <Link
                      to="/products"
                      className="block hover:text-white"
                  >
                    Mô hình
                  </Link>

                  <Link
                      to="/products?keyword=blind%20box"
                      className="block hover:text-white"
                  >
                    Blind Box
                  </Link>

                  <Link
                      to="/products?keyword=nhân%20vật"
                      className="block hover:text-white"
                  >
                    Nhân vật
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="font-bold">
                  Hỗ trợ
                </h3>

                <div className="mt-5 space-y-3 text-sm text-blue-100">
                  <Link
                      to="/profile"
                      className="block hover:text-white"
                  >
                    Tài khoản
                  </Link>

                  <Link
                      to="/cart"
                      className="block hover:text-white"
                  >
                    Giỏ hàng
                  </Link>

                  <Link
                      to="/wishlist"
                      className="block hover:text-white"
                  >
                    Yêu thích
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="font-bold">
                  Mạng xã hội
                </h3>

                <div className="mt-5 space-y-3 text-sm text-blue-100">
                  <a
                      href={
                        socialLinks.facebook
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:text-white"
                  >
                    Facebook
                  </a>

                  <a
                      href={
                        socialLinks.instagram
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:text-white"
                  >
                    Instagram
                  </a>

                  <a
                      href={
                        socialLinks.tiktok
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:text-white"
                  >
                    TikTok
                  </a>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-10 max-w-7xl border-t border-white/20 pt-6 text-center text-xs text-blue-100">
              © 2026 Vitoy Figure Store
            </div>
          </footer>
        </div>
      </div>
  )
}