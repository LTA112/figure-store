import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    Link,
    useNavigate,
    useParams,
} from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../auth/AuthContext'
import {
    addCartItemApi,
} from '../cart/cartAPI'
import {
    addGuestCartItem,
} from '../cart/guestCart'
import { getProductById } from './catalogAPI'
import type {
    Product,
} from './catalogTypes'

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
        const data =
            error.response?.data as
                | {
                message?: string
            }
                | undefined

        return (
            data?.message ||
            'Không thể xử lý sản phẩm'
        )
    }

    return 'Không thể xử lý sản phẩm'
}

export default function ProductDetailPage() {
    const navigate = useNavigate()

    const { id } = useParams()

    const {
        isAuthenticated,
    } = useAuth()

    const [product, setProduct] =
        useState<Product | null>(null)

    const [
        selectedImage,
        setSelectedImage,
    ] = useState('')

    const [quantity, setQuantity] =
        useState(1)

    const [loading, setLoading] =
        useState(true)

    const [adding, setAdding] =
        useState(false)

    const [error, setError] =
        useState('')

    const [actionError, setActionError] =
        useState('')

    const [
        actionSuccess,
        setActionSuccess,
    ] = useState('')

    useEffect(() => {
        const productId = Number(id)

        if (
            !Number.isInteger(
                productId,
            )
        ) {
            setError(
                'Mã sản phẩm không hợp lệ',
            )

            setLoading(false)

            return
        }

        const loadProduct =
            async () => {
                try {
                    setLoading(true)
                    setError('')

                    const result =
                        await getProductById(
                            productId,
                        )

                    setProduct(result)

                    setSelectedImage(
                        result.thumbnailUrl ||
                        result.images[0]
                            ?.imageUrl ||
                        '',
                    )

                    setQuantity(1)
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

        void loadProduct()
    }, [id])

    const gallery = useMemo(() => {
        if (!product) {
            return []
        }

        const images: string[] = []

        if (product.thumbnailUrl) {
            images.push(
                product.thumbnailUrl,
            )
        }

        product.images.forEach(
            (image) => {
                if (
                    image.imageUrl &&
                    !images.includes(
                        image.imageUrl,
                    )
                ) {
                    images.push(
                        image.imageUrl,
                    )
                }
            },
        )

        return images
    }, [product])

    const handleAddToCart =
        async () => {
            if (!product) {
                return
            }

            try {
                setAdding(true)
                setActionError('')
                setActionSuccess('')

                if (isAuthenticated) {
                    await addCartItemApi({
                        productId:
                        product.id,
                        quantity,
                    })
                } else {
                    addGuestCartItem({
                        productId:
                        product.id,
                        productName:
                        product.name,
                        productSlug:
                        product.slug,
                        thumbnailUrl:
                            product.thumbnailUrl ||
                            gallery[0] ||
                            null,
                        originalPrice:
                        product.price,
                        sellingPrice:
                            product.discountPrice ||
                            product.sellingPrice ||
                            product.price,
                        quantity,
                        stockQuantity:
                        product.stockQuantity,
                        productStatus:
                        product.status,
                    })
                }

                setActionSuccess(
                    'Đã thêm sản phẩm vào giỏ hàng.',
                )
            } catch (requestError) {
                setActionError(
                    getErrorMessage(
                        requestError,
                    ),
                )
            } finally {
                setAdding(false)
            }
        }

    const handleBuyNow =
        async () => {
            if (!product) {
                return
            }

            try {
                setAdding(true)
                setActionError('')
                setActionSuccess('')

                if (isAuthenticated) {
                    await addCartItemApi({
                        productId:
                        product.id,
                        quantity,
                    })

                    navigate('/cart')
                } else {
                    addGuestCartItem({
                        productId:
                        product.id,
                        productName:
                        product.name,
                        productSlug:
                        product.slug,
                        thumbnailUrl:
                            product.thumbnailUrl ||
                            gallery[0] ||
                            null,
                        originalPrice:
                        product.price,
                        sellingPrice:
                            product.discountPrice ||
                            product.sellingPrice ||
                            product.price,
                        quantity,
                        stockQuantity:
                        product.stockQuantity,
                        productStatus:
                        product.status,
                    })

                    navigate('/cart')
                }
            } catch (requestError) {
                setActionError(
                    getErrorMessage(
                        requestError,
                    ),
                )
            } finally {
                setAdding(false)
            }
        }

    if (loading) {
        return (
            <div className="flex min-h-[560px] items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#3157d5]" />

                    <p className="mt-4 text-sm text-gray-500">
                        Đang tải sản phẩm...
                    </p>
                </div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="flex min-h-[560px] flex-col items-center justify-center gap-5 bg-gray-50 px-6">
                <p className="text-red-600">
                    {error ||
                        'Không tìm thấy sản phẩm'}
                </p>

                <Link
                    to="/products"
                    className="rounded-xl bg-[#3157d5] px-6 py-3 font-semibold text-white"
                >
                    Quay lại sản phẩm
                </Link>
            </div>
        )
    }

    const outOfStock =
        product.status ===
        'OUT_OF_STOCK' ||
        product.status ===
        'INACTIVE' ||
        product.stockQuantity <= 0

    const sellingPrice =
        product.discountPrice ||
        product.sellingPrice ||
        product.price

    return (
        <div className="bg-[#f6f7f9] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <main className="mx-auto max-w-[1320px]">
                <div className="mb-6 text-sm text-gray-500">
                    <Link
                        to="/"
                        className="hover:text-[#3157d5]"
                    >
                        Trang chủ
                    </Link>

                    {' / '}

                    <Link
                        to="/products"
                        className="hover:text-[#3157d5]"
                    >
                        Mô hình
                    </Link>

                    {' / '}

                    <span>
            {product.name}
          </span>
                </div>

                <div className="grid gap-8 rounded-[32px] bg-white p-5 shadow-sm md:p-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:p-10">
                    <section>
                        <div className="flex min-h-[430px] items-center justify-center overflow-hidden rounded-[28px] bg-[#f1f1ee] sm:min-h-[560px] lg:min-h-[650px]">
                            {selectedImage ? (
                                <img
                                    src={
                                        selectedImage
                                    }
                                    alt={product.name}
                                    className="h-full w-full scale-[1.22] object-contain object-center transition-transform duration-300 sm:scale-[1.3]"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">
                                    Chưa có ảnh
                                </div>
                            )}
                        </div>

                        {gallery.length > 1 && (
                            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                                {gallery.map(
                                    (
                                        image,
                                        index,
                                    ) => (
                                        <button
                                            key={`${image}-${index}`}
                                            type="button"
                                            onClick={() =>
                                                setSelectedImage(
                                                    image,
                                                )
                                            }
                                            className={`aspect-square overflow-hidden rounded-2xl border-2 bg-[#f3f3f1] p-1 transition ${
                                                selectedImage ===
                                                image
                                                    ? 'border-[#3157d5]'
                                                    : 'border-transparent hover:border-gray-300'
                                            }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`${product.name} ${index + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    ),
                                )}
                            </div>
                        )}
                    </section>

                    <section className="flex flex-col">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#3157d5]">
                                {
                                    product.category
                                        .name
                                }
                            </p>

                            <h1 className="mt-3 text-3xl font-extrabold leading-tight lg:text-4xl">
                                {product.name}
                            </h1>

                            {product.brand && (
                                <p className="mt-3 text-sm text-gray-500">
                                    Thương hiệu:{' '}
                                    <span className="font-semibold text-gray-800">
                    {
                        product.brand
                    }
                  </span>
                                </p>
                            )}

                            <div className="mt-6">
                                {product.discountPrice ? (
                                    <div className="flex flex-wrap items-center gap-4">
                    <span className="text-3xl font-extrabold text-red-600">
                      {formatCurrency(
                          product.discountPrice,
                      )}
                    </span>

                                        <span className="text-lg text-gray-400 line-through">
                      {formatCurrency(
                          product.price,
                      )}
                    </span>
                                    </div>
                                ) : (
                                    <span className="text-3xl font-extrabold text-[#171717]">
                    {formatCurrency(
                        sellingPrice,
                    )}
                  </span>
                                )}
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-[#f7f8fa] p-5 text-sm">
                                <div>
                  <span className="text-gray-500">
                    Tình trạng
                  </span>

                                    <p
                                        className={`mt-1 font-bold ${
                                            outOfStock
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                        }`}
                                    >
                                        {outOfStock
                                            ? 'Hết hàng'
                                            : 'Còn hàng'}
                                    </p>
                                </div>

                                <div>
                  <span className="text-gray-500">
                    Tồn kho
                  </span>

                                    <p className="mt-1 font-bold">
                                        {
                                            product.stockQuantity
                                        }
                                    </p>
                                </div>

                                <div>
                  <span className="text-gray-500">
                    Tỉ lệ
                  </span>

                                    <p className="mt-1 font-bold">
                                        {product.scaleRatio ||
                                            'Đang cập nhật'}
                                    </p>
                                </div>

                                <div>
                  <span className="text-gray-500">
                    Chất liệu
                  </span>

                                    <p className="mt-1 font-bold">
                                        {product.material ||
                                            'Đang cập nhật'}
                                    </p>
                                </div>
                            </div>

                            {product.description && (
                                <div className="mt-7">
                                    <h2 className="text-lg font-bold">
                                        Mô tả sản phẩm
                                    </h2>

                                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
                                        {
                                            product.description
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-8">
                            {actionError && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {actionError}
                                </div>
                            )}

                            {actionSuccess && (
                                <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 sm:flex-row sm:items-center">
                  <span>
                    {actionSuccess}
                  </span>

                                    <Link
                                        to="/cart"
                                        className="font-bold underline"
                                    >
                                        Xem giỏ hàng
                                    </Link>
                                </div>
                            )}

                            <p className="mb-2 text-sm font-semibold">
                                Số lượng
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center overflow-hidden rounded-2xl border border-gray-300">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQuantity(
                                                (
                                                    current,
                                                ) =>
                                                    Math.max(
                                                        1,
                                                        current -
                                                        1,
                                                    ),
                                            )
                                        }
                                        disabled={
                                            adding ||
                                            quantity <= 1
                                        }
                                        className="h-12 w-12 text-xl transition hover:bg-gray-100 disabled:opacity-40"
                                    >
                                        −
                                    </button>

                                    <span className="flex h-12 min-w-14 items-center justify-center border-x border-gray-300 font-bold">
                    {quantity}
                  </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQuantity(
                                                (
                                                    current,
                                                ) =>
                                                    Math.min(
                                                        product.stockQuantity,
                                                        current +
                                                        1,
                                                    ),
                                            )
                                        }
                                        disabled={
                                            adding ||
                                            outOfStock ||
                                            quantity >=
                                            product.stockQuantity
                                        }
                                        className="h-12 w-12 text-xl transition hover:bg-gray-100 disabled:opacity-40"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleAddToCart()
                                    }
                                    disabled={
                                        adding ||
                                        outOfStock
                                    }
                                    className="min-w-[190px] flex-1 rounded-2xl border-2 border-[#3157d5] px-6 py-3.5 font-bold text-[#3157d5] transition hover:bg-[#3157d5] hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                                >
                                    {adding
                                        ? 'Đang xử lý...'
                                        : outOfStock
                                            ? 'Hết hàng'
                                            : 'Thêm vào giỏ'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleBuyNow()
                                    }
                                    disabled={
                                        adding ||
                                        outOfStock
                                    }
                                    className="min-w-[150px] flex-1 rounded-2xl bg-[#3157d5] px-6 py-3.5 font-bold text-white transition hover:bg-[#2748b8] disabled:cursor-not-allowed disabled:bg-gray-400"
                                >
                                    Mua ngay
                                </button>
                            </div>

                            {!isAuthenticated && (
                                <p className="mt-4 text-xs leading-5 text-gray-500">
                                    Bạn chưa đăng nhập.
                                    Sản phẩm sẽ được lưu
                                    tạm trong giỏ hàng trên
                                    thiết bị này.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}