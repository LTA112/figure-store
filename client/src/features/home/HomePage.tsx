import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import heroStickyCharacters from '../../assets/hero-sticky-characters-clean.png'

import {
  getCategories,
  getProducts,
} from '../catalog/catalogAPI'
import type {
  Category,
  Product,
} from '../catalog/catalogTypes'

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return 'Liên hệ'
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

function normalize(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ProductImage({
  product,
  className,
}: {
  product?: Product
  className: string
}) {
  if (!product?.thumbnailUrl) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-[#f4f1e9] text-6xl text-gray-300`}
      >
        🧸
      </div>
    )
  }

  return (
    <img
      src={product.thumbnailUrl}
      alt={product.name}
      className={className}
    />
  )
}

const creators = [
  {
    id: 1,
    name: 'Kim Đang',
    shortName: 'KĐ',
    description:
      'Kim Đang tìm cảm hứng từ văn hóa và ký ức Việt, biến những chất liệu quen thuộc thành nhân vật art toy mang tinh thần mềm mại và hiện đại.',
  },
  {
    id: 2,
    name: 'Nhật Anh Trương',
    shortName: 'NT',
    description:
      'Nhật Anh Trương tập trung vào hình khối và cấu trúc, chuyển hóa ý tưởng văn hóa thành những sản phẩm 3D sống động và có cá tính riêng.',
  },
  {
    id: 3,
    name: 'Anh Thư',
    shortName: 'AT',
    description:
      'Anh Thư chú trọng màu sắc và cảm xúc trong từng chi tiết, góp phần tạo nên những mô hình hài hòa và mang tinh thần văn hóa Việt.',
  },
]

export default function HomePage() {
  const [collections, setCollections] =
    useState<Category[]>([])
  const [activeCollectionId, setActiveCollectionId] =
    useState<number | null>(null)
  const [collectionProducts, setCollectionProducts] =
    useState<Product[]>([])
  const [blindBoxProduct, setBlindBoxProduct] =
    useState<Product | undefined>()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const carouselRef = useRef<HTMLDivElement | null>(null)

  const activeCollection = useMemo(
    () =>
      collections.find(
        (category) => category.id === activeCollectionId,
      ),
    [collections, activeCollectionId],
  )

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setLoadError('')

        const [categoryList, blindBoxResponse] =
          await Promise.all([
            getCategories(),
            getProducts({
              keyword: 'blind box',
              status: 'ACTIVE',
              sort: 'newest',
              page: 0,
              size: 1,
            }),
          ])

        const activeCategories = categoryList.filter(
          (category) => category.active,
        )

        setCollections(activeCategories)
        setBlindBoxProduct(blindBoxResponse.content[0])

        const stickyCategory = activeCategories.find(
          (category) =>
            normalize(category.name) === 'the-sticky' ||
            normalize(category.slug) === 'the-sticky',
        )

        setActiveCollectionId(
          stickyCategory?.id ?? activeCategories[0]?.id ?? null,
        )
      } catch (error) {
        console.error('Không thể tải dữ liệu trang chủ:', error)
        setLoadError(
          'Không thể tải dữ liệu trang chủ. Vui lòng thử lại sau.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadInitialData()
  }, [])

  useEffect(() => {
    if (!activeCollectionId) {
      setCollectionProducts([])
      return
    }

    const loadCollectionProducts = async () => {
      try {
        setLoading(true)
        setLoadError('')

        const response = await getProducts({
          categoryId: activeCollectionId,
          status: 'ACTIVE',
          sort: 'newest',
          page: 0,
          size: 20,
        })

        setCollectionProducts(response.content)
        carouselRef.current?.scrollTo({
          left: 0,
          behavior: 'smooth',
        })
      } catch (error) {
        console.error('Không thể tải bộ sưu tập:', error)
        setCollectionProducts([])
        setLoadError(
          'Không thể tải sản phẩm trong bộ sưu tập.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadCollectionProducts()
  }, [activeCollectionId])

  const scrollProducts = (direction: 'left' | 'right') => {
    const container = carouselRef.current

    if (!container) {
      return
    }

    container.scrollBy({
      left:
        direction === 'left'
          ? -container.clientWidth * 0.85
          : container.clientWidth * 0.85,
      behavior: 'smooth',
    })
  }

  return (
    <>
      <section className="overflow-hidden bg-gradient-to-r from-[#f8f0d8] via-[#e9eedf] to-[#cdd9c9]">
        <div className="mx-auto grid min-h-[430px] max-w-7xl items-center gap-8 px-6 py-10 md:grid-cols-[1.08fr_0.92fr] lg:px-12">
          <div className="order-2 flex items-end justify-center md:order-1">
            <div className="relative w-full max-w-[560px]">
              <div className="absolute inset-x-16 bottom-2 h-16 rounded-[50%] bg-slate-900/10 blur-2xl" />
              <img
                src={heroStickyCharacters}
                alt="Nhân vật thuộc bộ sưu tập The Sticky"
                className="relative h-[330px] w-full object-contain object-bottom drop-shadow-xl md:h-[380px]"
              />
            </div>
          </div>

          <div className="order-1 text-center md:order-2 md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">
              Vietnamese art toys
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-950 md:text-6xl lg:text-7xl">
              The Sticky
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-700 md:mx-0 md:text-base">
              Vitoy mang những hình ảnh gần gũi trong văn hóa Việt Nam
              vào các mô hình sưu tầm có cá tính, đáng yêu và giàu câu chuyện.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                to="/products"
                className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3157d5]"
              >
                Xem mô hình
              </Link>

              <a
                href="#collections"
                className="rounded-xl border border-slate-400 bg-white/65 px-6 py-3 text-sm font-bold text-slate-800 transition hover:bg-white"
              >
                Khám phá bộ sưu tập
              </a>
            </div>
          </div>
        </div>
      </section>

      {loadError && (
        <section className="px-6 pt-7 lg:px-14">
          <div className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-600">
            {loadError}
          </div>
        </section>
      )}

      <section
        id="collections"
        className="scroll-mt-28 bg-[#dfe7f2] px-6 py-16 lg:px-14"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Bộ sưu tập
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Khám phá thế giới Vitoy
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto border-b border-slate-300 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {collections.map((category) => {
                const active = category.id === activeCollectionId

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCollectionId(category.id)}
                    className={`shrink-0 border-b-2 px-1 pb-4 text-sm font-bold transition ${
                      active
                        ? 'border-slate-950 text-slate-950'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {category.name}
                  </button>
                )
              })}

              <span className="shrink-0 border-b-2 border-transparent px-1 pb-4 text-sm font-semibold text-slate-400">
                Coming Soon
              </span>
            </div>
          </div>

          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h3 className="text-2xl font-black text-slate-950 md:text-3xl">
                {activeCollection?.name ?? 'Bộ sưu tập'}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
                {activeCollection?.description ||
                  'Khám phá các mô hình thuộc bộ sưu tập này và chọn nhân vật bạn yêu thích.'}
              </p>
            </div>

            {collectionProducts.length > 1 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => scrollProducts('left')}
                  aria-label="Xem sản phẩm trước"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white text-2xl font-bold text-slate-700 shadow-sm transition hover:bg-slate-950 hover:text-white"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => scrollProducts('right')}
                  aria-label="Xem sản phẩm tiếp theo"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white text-2xl font-bold text-slate-700 shadow-sm transition hover:bg-slate-950 hover:text-white"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500">
              Đang tải sản phẩm...
            </div>
          ) : collectionProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center text-sm text-gray-500">
              Bộ sưu tập này chưa có sản phẩm.
            </div>
          ) : (
            <div
              ref={carouselRef}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {collectionProducts.map((product) => {
                const hasDiscount =
                  product.discountPrice !== null &&
                  product.discountPrice < product.price
                const outOfStock =
                  product.stockQuantity <= 0 ||
                  product.status === 'OUT_OF_STOCK'

                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group w-[250px] shrink-0 snap-start sm:w-[280px] lg:w-[300px]"
                  >
                    <article className="flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_14px_38px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_22px_50px_rgba(15,23,42,0.16)]">
                      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#fbf9f3] to-[#eee9df]">
                        <ProductImage
                          product={product}
                          className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-110"
                        />

                        <div className="absolute left-4 top-4 flex gap-2">
                          {product.newProduct && (
                            <span className="rounded-full bg-[#3157d5] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                              Mới
                            </span>
                          )}
                          {product.featured && (
                            <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-900">
                              Nổi bật
                            </span>
                          )}
                        </div>

                        {outOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35">
                            <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-slate-900">
                              Hết hàng
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          {activeCollection?.name}
                        </p>
                        <h4 className="mt-2 line-clamp-2 min-h-[48px] text-base font-black leading-6 text-slate-950">
                          {product.name}
                        </h4>
                        <p className="mt-3 line-clamp-2 min-h-[40px] text-xs leading-5 text-gray-500">
                          {product.description ||
                            'Mô hình nghệ thuật thuộc bộ sưu tập Vitoy.'}
                        </p>
                        <div className="mt-5 flex items-end gap-2">
                          <p className="text-xl font-black text-[#3157d5]">
                            {formatPrice(product.sellingPrice ?? product.price)}
                          </p>
                          {hasDiscount && (
                            <p className="pb-0.5 text-xs text-gray-400 line-through">
                              {formatPrice(product.price)}
                            </p>
                          )}
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
                          <span className="text-xs text-gray-500">
                            {outOfStock
                              ? 'Tạm hết hàng'
                              : `Còn ${product.stockQuantity}`}
                          </span>
                          <span className="text-sm font-black text-slate-900 transition group-hover:text-[#3157d5]">
                            Xem chi tiết →
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="mt-4 text-center">
            <Link
              to={
                activeCollectionId
                  ? `/products?categoryId=${activeCollectionId}`
                  : '/products'
              }
              className="inline-flex rounded-xl border border-slate-900 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-900 hover:text-white"
            >
              Xem tất cả mô hình
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 lg:px-14">
        <div className="mx-auto grid min-h-[310px] max-w-6xl overflow-hidden rounded-[30px] bg-[#f7a007] md:grid-cols-2">
          <div className="flex flex-col justify-center px-10 py-10 text-white md:px-14">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/75">
              Khám phá bất ngờ
            </p>
            <h2 className="mt-3 text-3xl font-black">Hộp mù</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/90">
              Mỗi hộp là một nhân vật ngẫu nhiên thuộc các bộ sưu tập của Vitoy.
            </p>
            <Link
              to="/products?keyword=blind%20box"
              className="mt-8 inline-flex w-fit rounded-xl bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              Xem hộp mù
            </Link>
          </div>
          <div className="flex items-end justify-center px-6 pt-5">
            <ProductImage
              product={blindBoxProduct}
              className="h-[290px] w-full max-w-[280px] object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      <section
        id="vitoy-world"
        className="scroll-mt-28 bg-[#f5f2ea] px-6 py-16 lg:px-14"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#3157d5]">
              Câu chuyện thương hiệu
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
              Thế giới Vitoy
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-700">
              Vitoy là thương hiệu art toy lấy cảm hứng từ văn hóa và đời sống Việt Nam.
              Mỗi bộ sưu tập là một thế giới nhỏ, nơi những hình ảnh quen thuộc được kể lại
              bằng ngôn ngữ hiện đại, gần gũi và đáng yêu.
            </p>

            <a
              href="#creators"
              className="mt-7 inline-flex rounded-xl bg-[#3157d5] px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-950"
            >
              Gặp gỡ đội ngũ sáng tạo
            </a>
          </div>

          <div className="rounded-[30px] border border-white bg-white/70 p-7 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Tinh thần Vitoy
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              {[
                ['01', 'Văn hóa Việt', 'Chất liệu quen thuộc được kể lại theo cách mới.'],
                ['02', 'Nhân vật riêng', 'Mỗi mô hình có màu sắc và cá tính riêng.'],
                ['03', 'Sưu tầm lâu dài', 'Thiết kế để trưng bày, lưu giữ và kết nối cảm xúc.'],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="rounded-2xl bg-[#eef3ff] p-5"
                >
                  <span className="text-xs font-black text-[#3157d5]">
                    {number}
                  </span>
                  <h3 className="mt-3 text-sm font-black text-slate-950">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="creators"
        className="scroll-mt-32 bg-white px-6 pb-16 lg:px-14"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
              Creative team
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Artist
            </h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {creators.map((creator) => (
              <article
                key={creator.id}
                className="grid min-h-[210px] grid-cols-[1fr_96px] items-center gap-6 rounded-[28px] border border-[#3157d5] bg-white px-7 py-7 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <h3 className="text-lg font-bold">{creator.name}</h3>
                  <p className="mt-4 text-xs leading-6 text-gray-600">
                    {creator.description}
                  </p>
                </div>
                <div className="flex h-[120px] w-[96px] items-center justify-center rounded-2xl bg-[#eee9df] text-xl font-black text-[#3157d5]">
                  {creator.shortName}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
