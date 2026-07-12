import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../catalog/catalogAPI'
import type { Product } from '../catalog/catalogTypes'

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) return 'Liên hệ'

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

const creators = [
  {
    id: 1,
    name: 'Kim Dung',
    shortName: 'KD',
    description:
      'Phát triển ý tưởng nhân vật và câu chuyện lấy cảm hứng từ văn hóa Việt Nam.',
  },
  {
    id: 2,
    name: 'Nhật Anh Trường',
    shortName: 'NT',
    description:
      'Thiết kế hình dáng, màu sắc và các phiên bản mô hình trong từng bộ sưu tập.',
  },
  {
    id: 3,
    name: 'Anh Thư',
    shortName: 'AT',
    description:
      'Xây dựng hình ảnh và phong cách trực quan cho thương hiệu Vitoy.',
  },
]

function ProductImage({ product, className }: { product?: Product; className: string }) {
  if (!product?.thumbnailUrl) {
    return (
      <div className={`${className} flex items-center justify-center text-6xl text-gray-300`}>
        🧸
      </div>
    )
  }

  return <img src={product.thumbnailUrl} alt={product.name} className={className} />
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setLoadError('')

        const featured = await getProducts({
          featured: true,
          sort: 'newest',
          page: 0,
          size: 2,
        })

        if (featured.content.length > 0) {
          setProducts(featured.content.slice(0, 2))
          return
        }

        const newest = await getProducts({
          sort: 'newest',
          page: 0,
          size: 2,
        })

        setProducts(newest.content.slice(0, 2))
      } catch (error) {
        console.error('Không thể tải sản phẩm trang chủ:', error)
        setProducts([])
        setLoadError('Không thể tải sản phẩm. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    void loadProducts()
  }, [])

  const firstProduct = products[0]
  const secondProduct = products[1] ?? products[0]

  return (
    <>
      {/* HERO */}
      <section className="overflow-hidden bg-gradient-to-r from-[#f8f3e6] via-[#e7ecdf] to-[#cad8c8]">
        <div className="mx-auto grid min-h-[410px] max-w-7xl items-center gap-6 px-6 py-8 md:grid-cols-2 lg:px-12">
          <div className="order-2 flex items-end justify-center gap-2 md:order-1">
            <ProductImage
              product={firstProduct}
              className="h-[285px] w-[48%] max-w-[230px] object-contain drop-shadow-xl"
            />
            <ProductImage
              product={firstProduct}
              className="h-[270px] w-[45%] max-w-[215px] -scale-x-100 object-contain opacity-90 drop-shadow-xl"
            />
          </div>

          <div className="order-1 text-center md:order-2 md:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
              The Sticky
            </h1>
            <p className="mt-4 text-sm text-gray-700 md:text-base">
              VITOY brings Vietnamese culture to life as collectible art toys.
            </p>
          </div>
        </div>
      </section>

      {loadError && (
        <section className="px-6 pt-7 lg:px-14">
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-600">
            {loadError}
          </div>
        </section>
      )}

      {/* CHARACTER TABS */}
      <section className="bg-white px-6 pt-14 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold">Nhân vật</h2>

          <div className="mt-8 flex items-center gap-12 border-b border-gray-200 px-1">
            <button
              type="button"
              className="border-b-2 border-slate-900 pb-4 text-sm font-bold text-slate-900"
            >
              The Sticky
            </button>
            <span className="pb-4 text-sm font-semibold text-slate-400">Coming Soon</span>
          </div>
        </div>
      </section>

      {/* CHARACTER STORY + TWO PRODUCTS */}
      <section className="bg-[#dfe7f2] px-6 py-10 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-8 md:grid-cols-[1.5fr_0.5fr]">
            <div>
              <h2 className="text-3xl font-extrabold">The Sticky</h2>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-700">
                The Sticky là bộ sưu tập art toy lấy cảm hứng từ nét đẹp bình dị và những câu
                chuyện quen thuộc trong văn hóa Việt Nam. Mỗi nhân vật được phát triển với phong
                cách nhẹ nhàng, đáng yêu nhưng vẫn mang một cá tính riêng.
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-700">
                Mỗi mô hình không chỉ là một món đồ trang trí mà còn là một câu chuyện nhỏ, lưu
                giữ hình ảnh gần gũi trong đời sống Việt.
              </p>
              <p className="mt-3 text-sm font-semibold"></p>
            </div>

            <div className="flex justify-center">
              <ProductImage
                product={firstProduct}
                className="h-[240px] w-full max-w-[210px] object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {(loading || products.length > 0) && (
            <div className="mt-12">
              {loading ? (
                <div className="py-14 text-center text-gray-500">Đang tải sản phẩm...</div>
              ) : (
                <div
                  className={`grid gap-10 ${
                    products.length === 1
                      ? 'mx-auto max-w-sm grid-cols-1'
                      : 'mx-auto max-w-4xl grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="group mx-auto w-full max-w-[310px]"
                    >
                      <div className="overflow-hidden rounded-[28px] bg-[#f7f7f2] shadow-sm">
                        <ProductImage
                          product={product}
                          className="aspect-[4/5] w-full object-contain p-4 transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <h3 className="mt-4 line-clamp-2 text-sm font-medium">{product.name}</h3>
                      <p className="mt-1 text-base font-extrabold">
                        {formatPrice(product.sellingPrice ?? product.price)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
                        {product.description || 'Mô hình nghệ thuật thuộc bộ sưu tập The Sticky.'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}

              {!loading && products.length > 0 && (
                <div className="mt-9 text-center">
                  <Link
                    to="/products"
                    className="inline-flex rounded-lg border border-gray-800 bg-white px-6 py-2 text-sm font-medium transition hover:bg-gray-900 hover:text-white"
                  >
                    Xem thêm
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* BLIND BOX */}
      <section className="bg-white px-6 py-14 lg:px-14">
        <div className="mx-auto grid min-h-[300px] max-w-6xl overflow-hidden bg-[#f7a007] md:grid-cols-2">
          <div className="px-10 py-10 text-white md:px-14">
            <Link
              to="/products?keyword=blind%20box"
              className="text-xl font-bold underline underline-offset-4"
            >
              Hộp mù
            </Link>
          </div>
          <div className="flex items-end justify-center px-6 pt-5">
            <ProductImage
              product={secondProduct}
              className="h-[290px] w-full max-w-[280px] object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* ARTISTS */}
      <section id="creators" className="scroll-mt-32 bg-white px-6 pb-16 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold">Artist</h2>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {creators.map((creator) => (
              <article
                key={creator.id}
                className="grid min-h-[190px] grid-cols-[1fr_84px] items-center gap-5 rounded-[26px] border border-[#3157d5] bg-white px-6 py-6"
              >
                <div>
                  <h3 className="text-lg font-bold">{creator.name}</h3>
                  <p className="mt-4 text-xs leading-6 text-gray-600">{creator.description}</p>
                </div>

                <div className="flex h-[105px] w-[84px] items-center justify-center rounded-2xl bg-[#eee9df] text-xl font-extrabold text-[#3157d5]">
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
