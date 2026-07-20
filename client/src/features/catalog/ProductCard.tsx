import { Link } from 'react-router-dom'
import type { Product } from './catalogTypes'

interface ProductCardProps {
    product: Product
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value)
}

export default function ProductCard({
                                        product,
                                    }: ProductCardProps) {
    const outOfStock =
        product.status === 'OUT_OF_STOCK' ||
        product.stockQuantity <= 0

    return (
        <Link
            to={`/products/${product.id}`}
            className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                {product.thumbnailUrl ? (
                    <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="h-full w-full object-contain object-center p-4 transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        Chưa có ảnh
                    </div>
                )}

                {product.newProduct && (
                    <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            Mới
          </span>
                )}

                {product.featured && (
                    <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
            Nổi bật
          </span>
                )}

                {outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900">
              Hết hàng
            </span>
                    </div>
                )}
            </div>

            <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                    {product.category.name}
                </p>

                <h3 className="mt-2 min-h-12 text-base font-bold text-gray-900">
                    {product.name}
                </h3>

                {product.brand && (
                    <p className="mt-1 text-sm text-gray-500">
                        {product.brand}
                    </p>
                )}

                <div className="mt-4">
                    {product.discountPrice ? (
                        <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-red-600">
                {formatCurrency(
                    product.discountPrice,
                )}
              </span>

                            <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.price)}
              </span>
                        </div>
                    ) : (
                        <span className="font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            Còn {product.stockQuantity}
          </span>
                    <span>
            Đã bán {product.soldQuantity}
          </span>
                </div>
            </div>
        </Link>
    )
}