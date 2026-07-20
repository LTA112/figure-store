import {
    useEffect,
    useState,
} from 'react'
import {
    Link,
} from 'react-router-dom'
import axios from 'axios'
import AdminLayout from '../AdminLayout'
import {
    getAdminCategories,
    deleteProductPermanently,
    getAdminProducts,
    hideProduct,
} from '../../catalog/catalogAPI'
import type {
    Category,
    PageResponse,
    Product,
    ProductStatus,
} from '../../catalog/catalogTypes'

const emptyPage: PageResponse<Product> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
    empty: true,
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value)
}

function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as
            | {
            message?: string
        }
            | undefined

        return (
            data?.message ||
            'Không thể tải sản phẩm'
        )
    }

    return 'Không thể tải sản phẩm'
}

function statusLabel(
    status: ProductStatus,
) {
    switch (status) {
        case 'ACTIVE':
            return 'Đang bán'
        case 'INACTIVE':
            return 'Đã ẩn'
        case 'OUT_OF_STOCK':
            return 'Hết hàng'
    }
}

export default function AdminProductListPage() {
    const [categories, setCategories] =
        useState<Category[]>([])

    const [pageData, setPageData] =
        useState<PageResponse<Product>>(emptyPage)

    const [keywordInput, setKeywordInput] =
        useState('')

    const [keyword, setKeyword] =
        useState('')

    const [categoryId, setCategoryId] =
        useState('')

    const [status, setStatus] =
        useState('')

    const [page, setPage] = useState(0)

    const [loading, setLoading] =
        useState(true)

    const [error, setError] = useState('')

    const [success, setSuccess] =
        useState('')

    useEffect(() => {
        getAdminCategories()
            .then(setCategories)
            .catch(() => {
                setCategories([])
            })
    }, [])

    const loadProducts = async () => {
        try {
            setLoading(true)
            setError('')

            const result =
                await getAdminProducts({
                    keyword:
                        keyword.trim() || undefined,
                    categoryId: categoryId
                        ? Number(categoryId)
                        : undefined,
                    status:
                        status
                            ? (status as ProductStatus)
                            : undefined,
                    sort: 'newest',
                    page,
                    size: 20,
                })

            setPageData(result)
        } catch (requestError) {
            setError(
                getErrorMessage(requestError),
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadProducts()
    }, [
        keyword,
        categoryId,
        status,
        page,
    ])

    const handleSearch = (
        event: React.FormEvent,
    ) => {
        event.preventDefault()
        setPage(0)
        setKeyword(keywordInput)
    }

    const handleHide = async (
        product: Product,
    ) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn ẩn sản phẩm "${product.name}"?`,
        )

        if (!confirmed) {
            return
        }

        try {
            setError('')
            setSuccess('')

            await hideProduct(product.id)

            setSuccess(
                'Ẩn sản phẩm thành công',
            )

            await loadProducts()
        } catch (requestError) {
            setError(
                getErrorMessage(requestError),
            )
        }
    }


    const handleDeletePermanently = async (
        product: Product,
    ) => {
        const confirmed = window.confirm(
            `Xóa vĩnh viễn sản phẩm "${product.name}"?\n\nSản phẩm sẽ bị xóa khỏi cơ sở dữ liệu và ảnh Cloudinary. Lịch sử đơn hàng cũ vẫn giữ tên, giá và ảnh tại thời điểm mua.`,
        )

        if (!confirmed) {
            return
        }

        try {
            setError('')
            setSuccess('')

            await deleteProductPermanently(product.id)

            setSuccess('Xóa sản phẩm vĩnh viễn thành công')
            await loadProducts()
        } catch (requestError) {
            setError(getErrorMessage(requestError))
        }
    }

    return (
        <AdminLayout
            title="Quản lý sản phẩm"
            description="Sản phẩm và ảnh được lưu trên MySQL, Cloudinary"
        >
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-lg font-bold">
                            Danh sách sản phẩm
                        </h2>

                        <p className="text-sm text-gray-500">
                            {pageData.totalElements} sản phẩm
                        </p>
                    </div>

                    <Link
                        to="/admin/products/new"
                        className="rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white hover:bg-blue-700"
                    >
                        + Thêm sản phẩm
                    </Link>
                </div>

                {error && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-red-600">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">
                        {success}
                    </div>
                )}

                <form
                    onSubmit={handleSearch}
                    className="mt-6 grid gap-4 md:grid-cols-4"
                >
                    <input
                        value={keywordInput}
                        onChange={(event) =>
                            setKeywordInput(
                                event.target.value,
                            )
                        }
                        placeholder="Tìm tên hoặc thương hiệu..."
                        className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500 md:col-span-2"
                    />

                    <select
                        value={categoryId}
                        onChange={(event) => {
                            setCategoryId(
                                event.target.value,
                            )
                            setPage(0)
                        }}
                        className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                    >
                        <option value="">
                            Tất cả danh mục
                        </option>

                        {categories.map((category) => (
                            <option
                                key={category.id}
                                value={category.id}
                            >
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value)
                            setPage(0)
                        }}
                        className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                    >
                        <option value="">
                            Tất cả trạng thái
                        </option>
                        <option value="ACTIVE">
                            Đang bán
                        </option>
                        <option value="OUT_OF_STOCK">
                            Hết hàng
                        </option>
                        <option value="INACTIVE">
                            Đã ẩn
                        </option>
                    </select>

                    <button
                        type="submit"
                        className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white md:col-span-4 xl:col-span-1"
                    >
                        Tìm kiếm
                    </button>
                </form>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-[1000px] w-full">
                        <thead>
                        <tr className="border-b text-left text-sm text-gray-500">
                            <th className="px-3 py-3">
                                Sản phẩm
                            </th>
                            <th className="px-3 py-3">
                                Danh mục
                            </th>
                            <th className="px-3 py-3">
                                Giá
                            </th>
                            <th className="px-3 py-3">
                                Tồn kho
                            </th>
                            <th className="px-3 py-3">
                                Trạng thái
                            </th>
                            <th className="px-3 py-3 text-right">
                                Thao tác
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-16 text-center text-gray-500"
                                >
                                    Đang tải sản phẩm...
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            pageData.content.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-16 text-center text-gray-500"
                                    >
                                        Chưa có sản phẩm.
                                    </td>
                                </tr>
                            )}

                        {!loading &&
                            pageData.content.map(
                                (product) => (
                                    <tr
                                        key={product.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-16 overflow-hidden rounded-xl bg-gray-100">
                                                    {product.thumbnailUrl ? (
                                                        <img
                                                            src={
                                                                product.thumbnailUrl
                                                            }
                                                            alt={
                                                                product.name
                                                            }
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                                            No image
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="max-w-xs font-semibold">
                                                        {product.name}
                                                    </p>

                                                    <div className="mt-1 flex gap-2">
                                                        {product.featured && (
                                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                  Nổi bật
                                </span>
                                                        )}

                                                        {product.newProduct && (
                                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                  Mới
                                </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-4 text-sm">
                                            {product.category.name}
                                        </td>

                                        <td className="px-3 py-4">
                                            {product.discountPrice ? (
                                                <div>
                                                    <p className="font-semibold text-red-600">
                                                        {formatCurrency(
                                                            product.discountPrice,
                                                        )}
                                                    </p>

                                                    <p className="text-xs text-gray-400 line-through">
                                                        {formatCurrency(
                                                            product.price,
                                                        )}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="font-semibold">
                                                    {formatCurrency(
                                                        product.price,
                                                    )}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-3 py-4">
                                            {product.stockQuantity}
                                        </td>

                                        <td className="px-3 py-4">
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                product.status ===
                                'ACTIVE'
                                    ? 'bg-green-100 text-green-700'
                                    : product.status ===
                                    'OUT_OF_STOCK'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                          {statusLabel(
                              product.status,
                          )}
                        </span>
                                        </td>

                                        <td className="px-3 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    to={`/admin/products/${product.id}/edit`}
                                                    className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-700"
                                                >
                                                    Sửa
                                                </Link>

                                                {product.status !==
                                                    'INACTIVE' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleHide(product)
                                                            }
                                                            className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700"
                                                        >
                                                            Ẩn
                                                        </button>
                                                    )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeletePermanently(product)
                                                    }
                                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        disabled={pageData.first}
                        onClick={() =>
                            setPage((current) =>
                                Math.max(0, current - 1),
                            )
                        }
                        className="rounded-xl border px-5 py-2.5 disabled:opacity-40"
                    >
                        Trước
                    </button>

                    <span className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm">
            Trang {pageData.number + 1}/
                        {Math.max(
                            pageData.totalPages,
                            1,
                        )}
          </span>

                    <button
                        type="button"
                        disabled={pageData.last}
                        onClick={() =>
                            setPage(
                                (current) => current + 1,
                            )
                        }
                        className="rounded-xl border px-5 py-2.5 disabled:opacity-40"
                    >
                        Sau
                    </button>
                </div>
            </div>
        </AdminLayout>
    )
}