import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import axios from 'axios'
import AdminLayout from '../AdminLayout'
import {
    createCategory,
    deleteCategory,
    getAdminCategories,
    updateCategory,
} from '../../catalog/catalogAPI'
import type {
    Category,
    CategoryRequest,
} from '../../catalog/catalogTypes'

const initialForm: CategoryRequest = {
    name: '',
    slug: '',
    description: '',
    active: true,
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
            'Không thể thực hiện thao tác'
        )
    }

    return 'Không thể thực hiện thao tác'
}

export default function AdminCategoryPage() {
    const [categories, setCategories] =
        useState<Category[]>([])

    const [form, setForm] =
        useState<CategoryRequest>(initialForm)

    const [editingId, setEditingId] =
        useState<number | null>(null)

    const [keyword, setKeyword] =
        useState('')

    const [loading, setLoading] =
        useState(true)

    const [saving, setSaving] =
        useState(false)

    const [error, setError] = useState('')

    const [success, setSuccess] =
        useState('')

    const filteredCategories = useMemo(() => {
        const normalized =
            keyword.trim().toLowerCase()

        if (!normalized) {
            return categories
        }

        return categories.filter(
            (category) =>
                category.name
                    .toLowerCase()
                    .includes(normalized) ||
                category.slug
                    .toLowerCase()
                    .includes(normalized),
        )
    }, [categories, keyword])

    const loadCategories = async () => {
        try {
            setLoading(true)
            setError('')

            const result =
                await getAdminCategories()

            setCategories(result)
        } catch (requestError) {
            setError(
                getErrorMessage(requestError),
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadCategories()
    }, [])

    const resetForm = () => {
        setForm(initialForm)
        setEditingId(null)
        setError('')
    }

    const handleEdit = (
        category: Category,
    ) => {
        setEditingId(category.id)

        setForm({
            name: category.name,
            slug: category.slug,
            description:
                category.description || '',
            active: category.active,
        })

        setError('')
        setSuccess('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    const validateForm = () => {
        if (form.name.trim().length < 2) {
            return 'Tên danh mục phải có ít nhất 2 ký tự'
        }

        if (form.name.trim().length > 100) {
            return 'Tên danh mục không được vượt quá 100 ký tự'
        }

        if (
            form.description &&
            form.description.length > 2000
        ) {
            return 'Mô tả không được vượt quá 2000 ký tự'
        }

        return ''
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

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            const payload: CategoryRequest = {
                name: form.name.trim(),
                slug:
                    form.slug?.trim() || undefined,
                description:
                    form.description?.trim() ||
                    undefined,
                active: form.active,
            }

            if (editingId) {
                await updateCategory(
                    editingId,
                    payload,
                )

                setSuccess(
                    'Cập nhật danh mục thành công',
                )
            } else {
                await createCategory(payload)

                setSuccess(
                    'Tạo danh mục thành công',
                )
            }

            resetForm()
            await loadCategories()
        } catch (requestError) {
            setError(
                getErrorMessage(requestError),
            )
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (
        category: Category,
    ) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa danh mục "${category.name}"?`,
        )

        if (!confirmed) {
            return
        }

        try {
            setError('')
            setSuccess('')

            await deleteCategory(category.id)

            setSuccess(
                'Xóa danh mục thành công',
            )

            if (editingId === category.id) {
                resetForm()
            }

            await loadCategories()
        } catch (requestError) {
            setError(
                getErrorMessage(requestError),
            )
        }
    }

    return (
        <AdminLayout
            title="Quản lý danh mục"
            description="Danh mục được lưu trong MySQL"
        >
            <div className="grid gap-7 xl:grid-cols-[380px_1fr]">
                <section className="h-fit rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold">
                        {editingId
                            ? 'Cập nhật danh mục'
                            : 'Thêm danh mục'}
                    </h2>

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                            {success}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-5 space-y-5"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-semibold">
                                Tên danh mục *
                            </label>

                            <input
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                maxLength={100}
                                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                placeholder="Ví dụ: Mô hình anime"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">
                                Slug
                            </label>

                            <input
                                value={form.slug || ''}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        slug: event.target.value,
                                    }))
                                }
                                maxLength={120}
                                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                                placeholder="Để trống để tự tạo"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold">
                                Mô tả
                            </label>

                            <textarea
                                value={
                                    form.description || ''
                                }
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description:
                                        event.target.value,
                                    }))
                                }
                                rows={5}
                                maxLength={2000}
                                className="w-full resize-none rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                            />
                        </div>

                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={
                                    form.active ?? true
                                }
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        active:
                                        event.target.checked,
                                    }))
                                }
                                className="h-5 w-5"
                            />

                            <span className="text-sm font-medium">
                Đang hoạt động
              </span>
                        </label>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {saving
                                    ? 'Đang lưu...'
                                    : editingId
                                        ? 'Cập nhật'
                                        : 'Thêm danh mục'}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-xl border px-5 py-3 font-semibold"
                                >
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold">
                                Danh sách danh mục
                            </h2>

                            <p className="text-sm text-gray-500">
                                {categories.length} danh mục
                            </p>
                        </div>

                        <input
                            value={keyword}
                            onChange={(event) =>
                                setKeyword(event.target.value)
                            }
                            placeholder="Tìm danh mục..."
                            className="rounded-xl border px-4 py-2.5 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                            <tr className="border-b text-left text-sm text-gray-500">
                                <th className="px-3 py-3">
                                    Tên
                                </th>
                                <th className="px-3 py-3">
                                    Slug
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
                                        colSpan={4}
                                        className="py-12 text-center text-gray-500"
                                    >
                                        Đang tải...
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filteredCategories.length ===
                                0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="py-12 text-center text-gray-500"
                                        >
                                            Chưa có danh mục.
                                        </td>
                                    </tr>
                                )}

                            {!loading &&
                                filteredCategories.map(
                                    (category) => (
                                        <tr
                                            key={category.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-3 py-4">
                                                <p className="font-semibold">
                                                    {category.name}
                                                </p>

                                                {category.description && (
                                                    <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                                                        {
                                                            category.description
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-3 py-4 text-sm text-gray-600">
                                                {category.slug}
                                            </td>

                                            <td className="px-3 py-4">
                          <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  category.active
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-200 text-gray-600'
                              }`}
                          >
                            {category.active
                                ? 'Hoạt động'
                                : 'Đã khóa'}
                          </span>
                                            </td>

                                            <td className="px-3 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                category,
                                                            )
                                                        }
                                                        className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-700"
                                                    >
                                                        Sửa
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                category,
                                                            )
                                                        }
                                                        className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700"
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
                </section>
            </div>
        </AdminLayout>
    )
}