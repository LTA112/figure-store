import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useNavigate,
    useParams,
} from 'react-router-dom'
import axios from 'axios'
import AdminLayout from '../AdminLayout'
import {
    createProduct,
    getAdminCategories,
    getAdminProduct,
    updateProduct,
} from '../../catalog/catalogAPI'
import type {
    Category,
    Product,
    ProductRequest,
    ProductStatus,
} from '../../catalog/catalogTypes'

interface ProductFormState {
    name: string
    slug: string
    description: string
    price: string
    discountPrice: string
    stockQuantity: string
    scaleRatio: string
    material: string
    brand: string
    categoryId: string
    status: ProductStatus
    featured: boolean
    newProduct: boolean
}

const initialForm: ProductFormState = {
    name: '',
    slug: '',
    description: '',
    price: '',
    discountPrice: '',
    stockQuantity: '0',
    scaleRatio: '',
    material: '',
    brand: '',
    categoryId: '',
    status: 'ACTIVE',
    featured: false,
    newProduct: false,
}

function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as
            | {
            message?: string
            data?: Record<string, string>
        }
            | undefined

        if (data?.data) {
            return Object.values(data.data)[0]
        }

        return (
            data?.message ||
            'Không thể lưu sản phẩm'
        )
    }

    return 'Không thể lưu sản phẩm'
}

export default function AdminProductFormPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const editingId = id ? Number(id) : null

    const [categories, setCategories] =
        useState<Category[]>([])

    const [existingProduct, setExistingProduct] =
        useState<Product | null>(null)

    const [form, setForm] =
        useState<ProductFormState>(initialForm)

    const [thumbnail, setThumbnail] =
        useState<File | null>(null)

    const [thumbnailPreview, setThumbnailPreview] =
        useState('')

    const [detailImages, setDetailImages] =
        useState<File[]>([])

    const [retainedImageIds, setRetainedImageIds] =
        useState<number[]>([])

    const [loading, setLoading] =
        useState(Boolean(editingId))

    const [saving, setSaving] =
        useState(false)

    const [error, setError] = useState('')

    const detailPreviews = useMemo(() => {
        return detailImages.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }))
    }, [detailImages])

    useEffect(() => {
        return () => {
            detailPreviews.forEach((item) =>
                URL.revokeObjectURL(item.url),
            )
        }
    }, [detailPreviews])

    useEffect(() => {
        const loadData = async () => {
            try {
                const categoryData =
                    await getAdminCategories()

                setCategories(
                    categoryData.filter(
                        (category) => category.active,
                    ),
                )

                if (!editingId) {
                    return
                }

                setLoading(true)

                const product =
                    await getAdminProduct(editingId)

                setExistingProduct(product)

                setForm({
                    name: product.name,
                    slug: product.slug,
                    description:
                        product.description || '',
                    price: String(product.price),
                    discountPrice:
                        product.discountPrice !== null
                            ? String(
                                product.discountPrice,
                            )
                            : '',
                    stockQuantity: String(
                        product.stockQuantity,
                    ),
                    scaleRatio:
                        product.scaleRatio || '',
                    material: product.material || '',
                    brand: product.brand || '',
                    categoryId: String(
                        product.category.id,
                    ),
                    status: product.status,
                    featured: product.featured,
                    newProduct: product.newProduct,
                })

                setThumbnailPreview(
                    product.thumbnailUrl || '',
                )

                setRetainedImageIds(
                    product.images.map(
                        (image) => image.id,
                    ),
                )
            } catch (requestError) {
                setError(
                    getErrorMessage(requestError),
                )
            } finally {
                setLoading(false)
            }
        }

        void loadData()
    }, [editingId])

    useEffect(() => {
        if (!thumbnail) {
            return
        }

        const preview =
            URL.createObjectURL(thumbnail)

        setThumbnailPreview(preview)

        return () => {
            URL.revokeObjectURL(preview)
        }
    }, [thumbnail])

    const validateForm = () => {
        if (form.name.trim().length < 2) {
            return 'Tên sản phẩm phải có ít nhất 2 ký tự'
        }

        const price = Number(form.price)

        if (
            !Number.isFinite(price) ||
            price < 1000
        ) {
            return 'Giá sản phẩm phải từ 1.000 đồng'
        }

        if (form.discountPrice) {
            const discountPrice = Number(
                form.discountPrice,
            )

            if (
                !Number.isFinite(
                    discountPrice,
                ) ||
                discountPrice < 1000
            ) {
                return 'Giá khuyến mãi phải từ 1.000 đồng'
            }

            if (discountPrice >= price) {
                return 'Giá khuyến mãi phải nhỏ hơn giá gốc'
            }
        }

        const stock = Number(
            form.stockQuantity,
        )

        if (
            !Number.isInteger(stock) ||
            stock < 0 ||
            stock > 1_000_000
        ) {
            return 'Số lượng tồn kho không hợp lệ'
        }

        if (!form.categoryId) {
            return 'Vui lòng chọn danh mục'
        }

        if (!editingId && !thumbnail) {
            return 'Ảnh đại diện là bắt buộc'
        }

        const totalDetailImages =
            retainedImageIds.length +
            detailImages.length

        if (totalDetailImages > 8) {
            return 'Mỗi sản phẩm chỉ được có tối đa 8 ảnh chi tiết'
        }

        const allFiles = [
            ...(thumbnail ? [thumbnail] : []),
            ...detailImages,
        ]

        for (const file of allFiles) {
            if (
                ![
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                ].includes(file.type)
            ) {
                return 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP'
            }

            if (
                file.size >
                10 * 1024 * 1024
            ) {
                return 'Mỗi ảnh không được lớn hơn 10MB'
            }
        }

        return ''
    }

    const handleThumbnailChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file =
            event.target.files?.[0] || null

        setThumbnail(file)
    }

    const handleDetailImagesChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(
            event.target.files || [],
        )

        setDetailImages((current) => [
            ...current,
            ...files,
        ])

        event.target.value = ''
    }

    const removeNewImage = (
        index: number,
    ) => {
        setDetailImages((current) =>
            current.filter(
                (_, currentIndex) =>
                    currentIndex !== index,
            ),
        )
    }

    const removeExistingImage = (
        imageId: number,
    ) => {
        setRetainedImageIds((current) =>
            current.filter(
                (idValue) =>
                    idValue !== imageId,
            ),
        )
    }

    const handleSubmit = async (
        event: React.FormEvent,
    ) => {
        event.preventDefault()

        const validationError =
            validateForm()

        if (validationError) {
            setError(validationError)
            return
        }

        const payload: ProductRequest = {
            name: form.name.trim(),
            slug:
                form.slug.trim() || undefined,
            description:
                form.description.trim() ||
                undefined,
            price: Number(form.price),
            discountPrice:
                form.discountPrice.trim()
                    ? Number(form.discountPrice)
                    : null,
            stockQuantity: Number(
                form.stockQuantity,
            ),
            scaleRatio:
                form.scaleRatio.trim() ||
                undefined,
            material:
                form.material.trim() ||
                undefined,
            brand:
                form.brand.trim() ||
                undefined,
            categoryId: Number(
                form.categoryId,
            ),
            status: form.status,
            featured: form.featured,
            newProduct: form.newProduct,
            retainedImageIds,
        }

        try {
            setSaving(true)
            setError('')

            if (editingId) {
                await updateProduct(
                    editingId,
                    payload,
                    thumbnail,
                    detailImages,
                )
            } else {
                await createProduct(
                    payload,
                    thumbnail as File,
                    detailImages,
                )
            }

            navigate('/admin/products')
        } catch (requestError) {
            setError(
                getErrorMessage(requestError),
            )
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <AdminLayout
                title="Sản phẩm"
            >
                <div className="rounded-2xl bg-white py-20 text-center">
                    Đang tải dữ liệu sản phẩm...
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout
            title={
                editingId
                    ? 'Cập nhật sản phẩm'
                    : 'Thêm sản phẩm'
            }
            description="Ảnh được tải lên Cloudinary"
        >
            <form
                onSubmit={handleSubmit}
                className="grid gap-7 xl:grid-cols-[1fr_360px]"
            >
                <div className="space-y-7">
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
                            {error}
                        </div>
                    )}

                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold">
                            Thông tin cơ bản
                        </h2>

                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold">
                                    Tên sản phẩm *
                                </label>

                                <input
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    maxLength={200}
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Slug
                                </label>

                                <input
                                    value={form.slug}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            slug: event.target.value,
                                        }))
                                    }
                                    maxLength={220}
                                    placeholder="Để trống để tự tạo"
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Danh mục *
                                </label>

                                <select
                                    value={form.categoryId}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            categoryId:
                                            event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        Chọn danh mục
                                    </option>

                                    {categories.map(
                                        (category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold">
                                    Mô tả
                                </label>

                                <textarea
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description:
                                            event.target.value,
                                        }))
                                    }
                                    maxLength={10000}
                                    rows={7}
                                    className="w-full resize-none rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold">
                            Giá và tồn kho
                        </h2>

                        <div className="mt-5 grid gap-5 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Giá gốc *
                                </label>

                                <input
                                    type="number"
                                    min="1000"
                                    value={form.price}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            price: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Giá khuyến mãi
                                </label>

                                <input
                                    type="number"
                                    min="1000"
                                    value={
                                        form.discountPrice
                                    }
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            discountPrice:
                                            event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Tồn kho *
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    value={
                                        form.stockQuantity
                                    }
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            stockQuantity:
                                            event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold">
                            Thuộc tính sản phẩm
                        </h2>

                        <div className="mt-5 grid gap-5 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Thương hiệu
                                </label>

                                <input
                                    value={form.brand}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            brand: event.target.value,
                                        }))
                                    }
                                    maxLength={100}
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Chất liệu
                                </label>

                                <input
                                    value={form.material}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            material:
                                            event.target.value,
                                        }))
                                    }
                                    maxLength={100}
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Tỉ lệ
                                </label>

                                <input
                                    value={form.scaleRatio}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            scaleRatio:
                                            event.target.value,
                                        }))
                                    }
                                    maxLength={50}
                                    placeholder="Ví dụ: 1/8"
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold">
                            Hình ảnh Cloudinary
                        </h2>

                        <div className="mt-5">
                            <label className="mb-2 block text-sm font-semibold">
                                Ảnh đại diện{' '}
                                {!editingId && '*'}
                            </label>

                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={
                                    handleThumbnailChange
                                }
                                className="block w-full rounded-xl border p-3"
                            />

                            <p className="mt-2 text-xs text-gray-500">
                                JPG, PNG hoặc WEBP. Tối đa
                                10MB.
                            </p>

                            {thumbnailPreview && (
                                <div className="mt-4 h-52 w-52 overflow-hidden rounded-2xl border bg-gray-100">
                                    <img
                                        src={thumbnailPreview}
                                        alt="Thumbnail preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-7">
                            <label className="mb-2 block text-sm font-semibold">
                                Ảnh chi tiết
                            </label>

                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                onChange={
                                    handleDetailImagesChange
                                }
                                className="block w-full rounded-xl border p-3"
                            />

                            <p className="mt-2 text-xs text-gray-500">
                                Tối đa 8 ảnh chi tiết cho mỗi
                                sản phẩm.
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {existingProduct?.images
                                    .filter((image) =>
                                        retainedImageIds.includes(
                                            image.id,
                                        ),
                                    )
                                    .map((image) => (
                                        <div
                                            key={image.id}
                                            className="relative aspect-square overflow-hidden rounded-xl border"
                                        >
                                            <img
                                                src={image.imageUrl}
                                                alt="Existing"
                                                className="h-full w-full object-cover"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeExistingImage(
                                                        image.id,
                                                    )
                                                }
                                                className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}

                                {detailPreviews.map(
                                    (item, index) => (
                                        <div
                                            key={`${item.file.name}-${index}`}
                                            className="relative aspect-square overflow-hidden rounded-xl border"
                                        >
                                            <img
                                                src={item.url}
                                                alt={item.file.name}
                                                className="h-full w-full object-cover"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeNewImage(index)
                                                }
                                                className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="h-fit space-y-7 xl:sticky xl:top-24">
                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold">
                            Trạng thái
                        </h2>

                        <div className="mt-5 space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Trạng thái sản phẩm
                                </label>

                                <select
                                    value={form.status}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            status:
                                                event.target
                                                    .value as ProductStatus,
                                        }))
                                    }
                                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                >
                                    <option value="ACTIVE">
                                        Đang bán
                                    </option>

                                    <option value="INACTIVE">
                                        Ẩn sản phẩm
                                    </option>

                                    <option value="OUT_OF_STOCK">
                                        Hết hàng
                                    </option>
                                </select>
                            </div>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={form.featured}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            featured:
                                            event.target.checked,
                                        }))
                                    }
                                    className="h-5 w-5"
                                />

                                <span className="text-sm font-medium">
                  Sản phẩm nổi bật
                </span>
                            </label>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.newProduct
                                    }
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            newProduct:
                                            event.target.checked,
                                        }))
                                    }
                                    className="h-5 w-5"
                                />

                                <span className="text-sm font-medium">
                  Sản phẩm mới
                </span>
                            </label>
                        </div>
                    </section>

                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {saving
                                ? 'Đang lưu...'
                                : editingId
                                    ? 'Cập nhật sản phẩm'
                                    : 'Tạo sản phẩm'}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate('/admin/products')
                            }
                            className="mt-3 w-full rounded-xl border px-5 py-3.5 font-semibold hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                    </section>
                </aside>
            </form>
        </AdminLayout>
    )
}