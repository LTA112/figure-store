import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    Link,
    useNavigate,
} from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../auth/AuthContext'
import {
    clearCartApi,
    getCartApi,
    removeCartItemApi,
    updateCartItemApi,
} from './cartAPI'
import {
    clearGuestCart,
    getGuestCart,
    removeGuestCartItem,
    updateGuestCartItem,
} from './guestCart'
import type {
    Cart,
    CartItem,
    GuestCartItem,
} from './cartTypes'

function formatCurrency(
    value: number,
): string {
    return new Intl.NumberFormat(
        'vi-VN',
        {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        },
    ).format(value)
}

function getErrorMessage(
    error: unknown,
): string {
    if (axios.isAxiosError(error)) {
        const responseData =
            error.response?.data as
                | {
                message?: string
            }
                | undefined

        return (
            responseData?.message ||
            'Không thể xử lý giỏ hàng'
        )
    }

    return 'Không thể xử lý giỏ hàng'
}

interface DisplayCartItem {
    id: number
    productId: number
    productName: string
    thumbnailUrl: string | null
    originalPrice: number
    sellingPrice: number
    quantity: number
    stockQuantity: number
    productStatus:
        | 'ACTIVE'
        | 'INACTIVE'
        | 'OUT_OF_STOCK'
    subtotal: number
}

function mapServerItem(
    item: CartItem,
): DisplayCartItem {
    return {
        id: item.id,
        productId: item.productId,
        productName:
        item.productName,
        thumbnailUrl:
        item.thumbnailUrl,
        originalPrice:
        item.originalPrice,
        sellingPrice:
        item.sellingPrice,
        quantity: item.quantity,
        stockQuantity:
        item.stockQuantity,
        productStatus:
        item.productStatus,
        subtotal: item.subtotal,
    }
}

function mapGuestItem(
    item: GuestCartItem,
): DisplayCartItem {
    return {
        id: item.productId,
        productId: item.productId,
        productName:
        item.productName,
        thumbnailUrl:
        item.thumbnailUrl,
        originalPrice:
        item.originalPrice,
        sellingPrice:
        item.sellingPrice,
        quantity: item.quantity,
        stockQuantity:
        item.stockQuantity,
        productStatus:
        item.productStatus,
        subtotal:
            item.sellingPrice *
            item.quantity,
    }
}

export default function CartPage() {
    const navigate = useNavigate()

    const {
        isAuthenticated,
    } = useAuth()

    const [serverCart, setServerCart] =
        useState<Cart | null>(null)

    const [
        guestItems,
        setGuestItems,
    ] = useState<GuestCartItem[]>([])

    const [loading, setLoading] =
        useState(true)

    const [
        processingItemId,
        setProcessingItemId,
    ] = useState<number | null>(null)

    const [clearing, setClearing] =
        useState(false)

    const [error, setError] =
        useState('')

    const [success, setSuccess] =
        useState('')

    useEffect(() => {
        const loadCart = async () => {
            try {
                setLoading(true)
                setError('')

                if (isAuthenticated) {
                    const cart =
                        await getCartApi()

                    setServerCart(cart)
                    setGuestItems([])
                } else {
                    setGuestItems(
                        getGuestCart(),
                    )

                    setServerCart(null)
                }
            } catch (requestError) {
                setError(
                    getErrorMessage(
                        requestError,
                    ),
                )
            } finally {
                setLoading(false)
            }
        }

        void loadCart()
    }, [isAuthenticated])

    const items = useMemo<
        DisplayCartItem[]
    >(() => {
        if (isAuthenticated) {
            return (
                serverCart?.items.map(
                    mapServerItem,
                ) || []
            )
        }

        return guestItems.map(
            mapGuestItem,
        )
    }, [
        guestItems,
        isAuthenticated,
        serverCart,
    ])

    const totalQuantity =
        items.reduce(
            (total, item) =>
                total + item.quantity,
            0,
        )

    const totalAmount =
        items.reduce(
            (total, item) =>
                total + item.subtotal,
            0,
        )

    const handleUpdateQuantity =
        async (
            item: DisplayCartItem,
            newQuantity: number,
        ) => {
            if (
                newQuantity < 1 ||
                newQuantity >
                item.stockQuantity
            ) {
                return
            }

            try {
                setProcessingItemId(
                    item.id,
                )

                setError('')
                setSuccess('')

                if (isAuthenticated) {
                    const updatedCart =
                        await updateCartItemApi(
                            item.id,
                            {
                                quantity:
                                newQuantity,
                            },
                        )

                    setServerCart(
                        updatedCart,
                    )
                } else {
                    const updatedItems =
                        updateGuestCartItem(
                            item.productId,
                            newQuantity,
                        )

                    setGuestItems(
                        updatedItems,
                    )
                }
            } catch (requestError) {
                setError(
                    getErrorMessage(
                        requestError,
                    ),
                )
            } finally {
                setProcessingItemId(
                    null,
                )
            }
        }

    const handleRemoveItem =
        async (
            item: DisplayCartItem,
        ) => {
            const confirmed =
                window.confirm(
                    `Xóa "${item.productName}" khỏi giỏ hàng?`,
                )

            if (!confirmed) {
                return
            }

            try {
                setProcessingItemId(
                    item.id,
                )

                setError('')
                setSuccess('')

                if (isAuthenticated) {
                    const updatedCart =
                        await removeCartItemApi(
                            item.id,
                        )

                    setServerCart(
                        updatedCart,
                    )
                } else {
                    const updatedItems =
                        removeGuestCartItem(
                            item.productId,
                        )

                    setGuestItems(
                        updatedItems,
                    )
                }

                setSuccess(
                    'Đã xóa sản phẩm khỏi giỏ hàng.',
                )
            } catch (requestError) {
                setError(
                    getErrorMessage(
                        requestError,
                    ),
                )
            } finally {
                setProcessingItemId(
                    null,
                )
            }
        }

    const handleClearCart =
        async () => {
            if (items.length === 0) {
                return
            }

            const confirmed =
                window.confirm(
                    'Bạn muốn xóa toàn bộ sản phẩm trong giỏ hàng?',
                )

            if (!confirmed) {
                return
            }

            try {
                setClearing(true)
                setError('')
                setSuccess('')

                if (isAuthenticated) {
                    await clearCartApi()

                    setServerCart({
                        id:
                            serverCart?.id ||
                            null,
                        items: [],
                        totalItems: 0,
                        totalQuantity: 0,
                        totalAmount: 0,
                    })
                } else {
                    clearGuestCart()
                    setGuestItems([])
                }

                setSuccess(
                    'Đã xóa toàn bộ giỏ hàng.',
                )
            } catch (requestError) {
                setError(
                    getErrorMessage(
                        requestError,
                    ),
                )
            } finally {
                setClearing(false)
            }
        }

    const handleCheckout = () => {
        if (items.length === 0) {
            return
        }

        if (!isAuthenticated) {
            navigate(
                '/login?redirect=/cart',
            )

            return
        }

        navigate('/checkout')
    }

    if (loading) {
        return (
            <div className="flex min-h-[520px] items-center justify-center bg-[#f6f7fb]">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#3157d5]" />

                    <p className="mt-4 text-sm text-gray-500">
                        Đang tải giỏ hàng...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[650px] bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <div className="mx-auto max-w-[1240px]">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#3157d5]">
                            Vitoy Store
                        </p>

                        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                            Giỏ hàng của bạn
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            {totalQuantity > 0
                                ? `${totalQuantity} sản phẩm đang chờ thanh toán`
                                : 'Giỏ hàng hiện chưa có sản phẩm'}
                        </p>
                    </div>

                    {items.length > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                                void handleClearCart()
                            }
                            disabled={clearing}
                            className="self-start text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                            {clearing
                                ? 'Đang xóa...'
                                : 'Xóa toàn bộ'}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
                        {success}
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center shadow-sm">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#eef1ff] text-5xl">
                            🛒
                        </div>

                        <h2 className="mt-6 text-2xl font-bold">
                            Giỏ hàng đang trống
                        </h2>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                            Hãy khám phá các mô hình
                            và Blind Box của Vitoy,
                            sau đó thêm sản phẩm bạn
                            yêu thích vào giỏ hàng.
                        </p>

                        <Link
                            to="/products"
                            className="mt-7 inline-flex rounded-full bg-[#3157d5] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#2748b8]"
                        >
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_360px]">
                        <section className="space-y-4">
                            {items.map((item) => {
                                const itemProcessing =
                                    processingItemId ===
                                    item.id

                                const unavailable =
                                    item.productStatus !==
                                    'ACTIVE' ||
                                    item.stockQuantity <= 0

                                return (
                                    <article
                                        key={item.id}
                                        className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-[150px_1fr] sm:p-5"
                                    >
                                        <Link
                                            to={`/products/${item.productId}`}
                                            className="overflow-hidden rounded-2xl bg-[#f2f2ef]"
                                        >
                                            {item.thumbnailUrl ? (
                                                <img
                                                    src={
                                                        item.thumbnailUrl
                                                    }
                                                    alt={
                                                        item.productName
                                                    }
                                                    className="aspect-square h-full w-full object-cover transition hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex aspect-square items-center justify-center text-sm text-gray-400">
                                                    Chưa có ảnh
                                                </div>
                                            )}
                                        </Link>

                                        <div className="flex min-w-0 flex-col">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/products/${item.productId}`}
                                                        className="line-clamp-2 text-lg font-bold hover:text-[#3157d5]"
                                                    >
                                                        {
                                                            item.productName
                                                        }
                                                    </Link>

                                                    <p className="mt-2 text-sm text-gray-500">
                                                        Kho còn:{' '}
                                                        {
                                                            item.stockQuantity
                                                        }
                                                    </p>

                                                    {unavailable && (
                                                        <p className="mt-2 text-sm font-semibold text-red-600">
                                                            Sản phẩm hiện
                                                            không thể mua.
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleRemoveItem(
                                                            item,
                                                        )
                                                    }
                                                    disabled={
                                                        itemProcessing
                                                    }
                                                    className="rounded-full px-3 py-2 text-sm font-semibold text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                >
                                                    Xóa
                                                </button>
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="text-xl font-extrabold text-[#3157d5]">
                          {formatCurrency(
                              item.sellingPrice,
                          )}
                        </span>

                                                {item.originalPrice >
                                                    item.sellingPrice && (
                                                        <span className="text-sm text-gray-400 line-through">
                            {formatCurrency(
                                item.originalPrice,
                            )}
                          </span>
                                                    )}
                                            </div>

                                            <div className="mt-auto flex flex-col justify-between gap-4 pt-6 sm:flex-row sm:items-end">
                                                <div>
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                        Số lượng
                                                    </p>

                                                    <div className="inline-flex items-center overflow-hidden rounded-xl border border-gray-300">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleUpdateQuantity(
                                                                    item,
                                                                    item.quantity -
                                                                    1,
                                                                )
                                                            }
                                                            disabled={
                                                                itemProcessing ||
                                                                item.quantity <=
                                                                1
                                                            }
                                                            className="h-11 w-11 text-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            −
                                                        </button>

                                                        <span className="flex h-11 min-w-12 items-center justify-center border-x border-gray-300 font-bold">
                              {
                                  item.quantity
                              }
                            </span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleUpdateQuantity(
                                                                    item,
                                                                    item.quantity +
                                                                    1,
                                                                )
                                                            }
                                                            disabled={
                                                                itemProcessing ||
                                                                unavailable ||
                                                                item.quantity >=
                                                                item.stockQuantity
                                                            }
                                                            className="h-11 w-11 text-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="sm:text-right">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                        Thành tiền
                                                    </p>

                                                    <p className="mt-1 text-xl font-extrabold">
                                                        {formatCurrency(
                                                            item.subtotal,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </section>

                        <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-36">
                            <h2 className="text-xl font-extrabold">
                                Tóm tắt đơn hàng
                            </h2>

                            <div className="mt-6 space-y-4 border-b border-gray-200 pb-6 text-sm">
                                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    Số lượng
                  </span>

                                    <span className="font-semibold">
                    {totalQuantity}
                  </span>
                                </div>

                                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    Tạm tính
                  </span>

                                    <span className="font-semibold">
                    {formatCurrency(
                        totalAmount,
                    )}
                  </span>
                                </div>

                                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    Phí vận chuyển
                  </span>

                                    <span className="font-semibold text-green-600">
                    Tính khi đặt hàng
                  </span>
                                </div>
                            </div>

                            <div className="flex items-end justify-between gap-4 py-6">
                <span className="font-bold">
                  Tổng cộng
                </span>

                                <span className="text-2xl font-extrabold text-[#3157d5]">
                  {formatCurrency(
                      totalAmount,
                  )}
                </span>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleCheckout
                                }
                                className="w-full rounded-2xl bg-[#3157d5] px-6 py-4 font-bold text-white transition hover:bg-[#2748b8]"
                            >
                                {isAuthenticated
                                    ? 'Tiến hành đặt hàng'
                                    : 'Đăng nhập để đặt hàng'}
                            </button>

                            <Link
                                to="/products"
                                className="mt-3 block w-full rounded-2xl border border-gray-300 px-6 py-3.5 text-center text-sm font-semibold transition hover:border-[#3157d5] hover:text-[#3157d5]"
                            >
                                Tiếp tục mua sắm
                            </Link>

                            {!isAuthenticated && (
                                <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                                    Giỏ hàng hiện được lưu
                                    tạm trên thiết bị này.
                                </p>
                            )}
                        </aside>
                    </div>
                )}
            </div>
        </div>
    )
}