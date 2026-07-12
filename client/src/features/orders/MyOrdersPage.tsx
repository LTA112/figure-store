import { useCallback, useEffect, useState } from 'react'
import { cancelOrder, getMyOrders } from './orderAPI'
import type { Order } from './orderTypes'

const orderStatusLabels: Record<string, string> = {
    PENDING_PAYMENT: 'Chờ thanh toán',
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    CANCELLED: 'Đã hủy',
}

const paymentStatusLabels: Record<string, string> = {
    UNPAID: 'Chưa thanh toán',
    PENDING: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền',
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
    ) {
        const response = (
            error as {
                response?: {
                    data?: {
                        message?: string
                    }
                }
            }
        ).response

        if (response?.data?.message) {
            return response.data.message
        }
    }

    return fallback
}

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [cancellingId, setCancellingId] = useState<number | null>(null)

    const loadOrders = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const data = await getMyOrders()
            setOrders(data)
        } catch (loadError) {
            setError(
                getErrorMessage(
                    loadError,
                    'Không tải được danh sách đơn hàng',
                ),
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadOrders()
    }, [loadOrders])

    async function handleCancel(orderId: number) {
        const reason = window.prompt('Nhập lý do hủy đơn:')

        if (!reason?.trim()) {
            return
        }

        setCancellingId(orderId)
        setError('')

        try {
            await cancelOrder(orderId, reason.trim())
            await loadOrders()
        } catch (cancelError) {
            setError(
                getErrorMessage(
                    cancelError,
                    'Không thể hủy đơn hàng',
                ),
            )
        } finally {
            setCancellingId(null)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-5xl px-4 py-10">
                    <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
                        Đang tải đơn hàng...
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-10">
                <div className="mb-7">
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#3157d5]">
                        Tài khoản
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                        Đơn hàng của tôi
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Theo dõi trạng thái và thông tin các đơn hàng đã đặt.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <p className="font-semibold text-slate-800">
                            Bạn chưa có đơn hàng nào
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Các đơn hàng đã đặt sẽ xuất hiện tại đây.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {orders.map((order) => {
                            const canCancel = [
                                'PENDING',
                                'PENDING_PAYMENT',
                            ].includes(order.status)

                            return (
                                <article
                                    key={order.id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                                Mã đơn hàng
                                            </p>

                                            <p className="mt-1 font-bold text-slate-900">
                                                {order.orderCode}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {orderStatusLabels[order.status] ?? order.status}
                      </span>

                                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        {paymentStatusLabels[order.paymentStatus] ??
                            order.paymentStatus}
                      </span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="space-y-3">
                                            {order.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0"
                                                >
                                                    <div>
                                                        <p className="font-medium text-slate-800">
                                                            {item.productName}
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Số lượng: {item.quantity}
                                                        </p>
                                                    </div>

                                                    <p className="shrink-0 font-semibold text-slate-900">
                                                        {item.subtotal.toLocaleString('vi-VN')} ₫
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
                                            <div className="text-sm text-slate-500">
                                                <p>
                                                    Phương thức:{' '}
                                                    <strong className="text-slate-700">
                                                        {order.paymentMethod === 'COD'
                                                            ? 'Thanh toán khi nhận hàng'
                                                            : order.paymentMethod === 'ZALOPAY'
                                                                ? 'ZaloPay'
                                                                : order.paymentMethod}
                                                    </strong>
                                                </p>

                                                {order.createdAt && (
                                                    <p className="mt-1">
                                                        Ngày đặt:{' '}
                                                        {new Date(order.createdAt).toLocaleString(
                                                            'vi-VN',
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-left sm:text-right">
                                                <p className="text-sm text-slate-500">
                                                    Tổng thanh toán
                                                </p>

                                                <p className="mt-1 text-2xl font-bold text-[#3157d5]">
                                                    {order.totalAmount.toLocaleString('vi-VN')} ₫
                                                </p>
                                            </div>
                                        </div>

                                        {canCancel && (
                                            <div className="mt-5 border-t border-slate-100 pt-5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void handleCancel(order.id)
                                                    }}
                                                    disabled={cancellingId === order.id}
                                                    className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {cancellingId === order.id
                                                        ? 'Đang hủy...'
                                                        : 'Hủy đơn hàng'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    )
}