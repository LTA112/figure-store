import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import ProductCard from './ProductCard'
import { getCategories, getProducts } from './catalogAPI'
import type {
  Category,
  PageResponse,
  Product,
} from './catalogTypes'

const emptyPage: PageResponse<Product> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 12,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 0,
  empty: true,
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message || 'Không thể tải danh sách sản phẩm'
  }

  return 'Không thể tải danh sách sản phẩm'
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [pageData, setPageData] = useState<PageResponse<Product>>(emptyPage)
  const [keywordInput, setKeywordInput] = useState(searchParams.get('keyword') ?? '')
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'newest')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const numericCategoryId = useMemo(
    () => (categoryId ? Number(categoryId) : undefined),
    [categoryId],
  )

  useEffect(() => {
    const nextKeyword = searchParams.get('keyword') ?? ''
    const nextCategoryId = searchParams.get('categoryId') ?? ''
    const nextMinPrice = searchParams.get('minPrice') ?? ''
    const nextMaxPrice = searchParams.get('maxPrice') ?? ''
    const nextSort = searchParams.get('sort') ?? 'newest'
    const nextPage = Number(searchParams.get('page') ?? 0)

    setKeywordInput(nextKeyword)
    setKeyword(nextKeyword)
    setCategoryId(nextCategoryId)
    setMinPrice(nextMinPrice)
    setMaxPrice(nextMaxPrice)
    setSort(nextSort)
    setPage(Number.isFinite(nextPage) ? nextPage : 0)
  }, [searchParams])

  useEffect(() => {
    getCategories()
      .then((result) => setCategories(Array.isArray(result) ? result : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError('')

        const result = await getProducts({
          keyword: keyword.trim() || undefined,
          categoryId: numericCategoryId,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sort,
          page,
          size: 12,
        })

        setPageData(result)
      } catch (requestError) {
        setPageData(emptyPage)
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    void loadProducts()
  }, [keyword, numericCategoryId, minPrice, maxPrice, sort, page])

  const updateUrl = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    const values = {
      keyword,
      categoryId,
      minPrice,
      maxPrice,
      sort,
      page,
      ...overrides,
    }

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'newest' && value !== 0) {
        params.set(key, String(value))
      }
    })

    setSearchParams(params)
  }

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateUrl({ keyword: keywordInput.trim(), page: 0 })
  }

  const handleReset = () => {
    setKeywordInput('')
    setSearchParams({})
  }

  return (
    <section className="bg-[#f7f8fb] px-6 py-10 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-[#eef2ff] to-white px-7 py-8">
          <p className="text-sm font-bold uppercase tracking-wider text-[#3157d5]">Cửa hàng Vitoy</p>
          <h1 className="mt-2 text-3xl font-extrabold">Khám phá mô hình</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">
            Tìm kiếm figure, art toy và blind box theo tên, danh mục hoặc khoảng giá.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Bộ lọc</h2>

            <form onSubmit={handleSearch} className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">Tìm kiếm</label>
                <input
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  placeholder="Tên sản phẩm..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#3157d5]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Danh mục</label>
                <select
                  value={categoryId}
                  onChange={(event) => updateUrl({ categoryId: event.target.value, page: 0 })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#3157d5]"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Khoảng giá</label>
                <div className="space-y-3">
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Giá từ"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#3157d5]"
                  />
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Giá đến"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#3157d5]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#3157d5] px-4 py-3 font-semibold text-white hover:bg-[#2848b9]"
              >
                Áp dụng
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold hover:bg-gray-50"
              >
                Xóa bộ lọc
              </button>
            </form>
          </aside>

          <div>
            <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Tìm thấy <strong>{pageData.totalElements}</strong> sản phẩm
              </p>
              <select
                value={sort}
                onChange={(event) => updateUrl({ sort: event.target.value, page: 0 })}
                className="rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#3157d5]"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="sold_desc">Bán chạy</option>
                <option value="name_asc">Tên A–Z</option>
              </select>
            </div>

            {loading && (
              <div className="rounded-2xl bg-white py-20 text-center text-gray-500">Đang tải sản phẩm...</div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">{error}</div>
            )}

            {!loading && !error && pageData.content.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
                <div className="text-5xl">🧸</div>
                <h2 className="mt-4 text-xl font-bold">Chưa tìm thấy sản phẩm</h2>
                <p className="mt-2 text-sm text-gray-500">Thử đổi từ khóa hoặc xóa bớt bộ lọc.</p>
              </div>
            )}

            {!loading && !error && pageData.content.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {pageData.content.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!loading && pageData.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={pageData.first}
                  onClick={() => updateUrl({ page: Math.max(page - 1, 0) })}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang {pageData.number + 1}/{pageData.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pageData.last}
                  onClick={() => updateUrl({ page: page + 1 })}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
