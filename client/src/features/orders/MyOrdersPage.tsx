import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    cancelOrder,
    getMyOrders,
} from './orderAPI'

import type {
    Order,
    OrderStatus,
    PaymentStatus,
} from './orderTypes'

const orderStatusLabels: Record<OrderStatus, string> = {
    PENDING_PAYMENT: 'Chờ thanh toán',
    PENDING: 'Chờ cửa hàng xác nhận',
    CONFIRMED: 'Cửa hàng đã xác nhận',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Giao hàng thành công',
    CANCELLED: 'Đã hủy',
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
    UNPAID: 'Chưa thanh toán',
    PENDING: 'Đang chờ thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền',
}

const statusSteps: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'SHIPPING',
    'DELIVERED',
]

function getErrorMessage(
    error: unknown,
    fallback: string,
): string {
    if (
        typeof error === 'object'
        && error !== null
        && 'response' in error
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

function formatMoney(value: number): string {
    return `${value.toLocaleString('vi-VN')} ₫`
}

function formatDate(value?: string | null): string {
    if (!value) {
        return ''
    }

    return new Date(value).toLocaleString('vi-VN')
}

function getStepIndex(status: OrderStatus): number {
    if (status === 'PENDING_PAYMENT') {
        return 0
    }

    return statusSteps.indexOf(status)
}

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [cancellingId, setCancellingId] =
        useState<number | null>(null)

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

    const sortedOrders = useMemo(
        () =>
            [...orders].sort(
                (first, second) =>
                    new Date(second.createdAt).getTime()
                    - new Date(first.createdAt).getTime(),
            ),
        [orders],
    )

    async function handleCancel(orderId: number) {
        const reason = window.prompt(
            'Nhập lý do hủy đơn:',
        )

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
            <main className="min-h-screen bg-slate-50 py-10">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                        Đang tải đơn hàng...
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-50 py-10">
            <div className="mx-auto max-w-6xl px-4">
                <div className="mb-8">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                        Tài khoản
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                        Đơn hàng của tôi
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Xem trạng thái thanh toán và quá trình giao hàng.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                        {error}
                    </div>
                )}

                {sortedOrders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                        <p className="text-lg font-semibold text-slate-800">
                            Bạn chưa có đơn hàng
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedOrders.map((order) => {
                            const canCancel = [
                                'PENDING',
                                'PENDING_PAYMENT',
                            ].includes(order.status)

                            const currentStep =
                                getStepIndex(order.status)

                            return (
                                <article
                                    key={order.id}
                                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                Mã đơn hàng
                                            </p>

                                            <p className="mt-1 text-lg font-bold text-slate-900">
                                                {order.orderCode}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Đặt lúc {formatDate(order.createdAt)}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700">
                        {orderStatusLabels[order.status]}
                      </span>

                                            <span
                                                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                                                    order.paymentStatus === 'PAID'
                                                        ? 'bg-green-100 text-green-700'
                                                        : order.paymentStatus === 'FAILED'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                                        </div>
                                    </div>

                                    {order.status !== 'CANCELLED' && (
                                        <div className="border-b border-slate-100 px-6 py-6">
                                            <div className="grid grid-cols-4 gap-2">
                                                {statusSteps.map((step, index) => {
                                                    const completed =
                                                        index <= currentStep

                                                    return (
                                                        <div
                                                            key={step}
                                                            className="text-center"
                                                        >
                                                            <div
                                                                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                                                                    completed
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-slate-200 text-slate-500'
                                                                }`}
                                                            >
                                                                {completed ? '✓' : index + 1}
                                                            </div>

                                                            <p
                                                                className={`mt-2 text-xs font-semibold ${
                                                                    completed
                                                                        ? 'text-blue-700'
                                                                        : 'text-slate-400'
                                                                }`}
                                                            >
                                                                {step === 'PENDING'
                                                                    ? 'Chờ xác nhận'
                                                                    : step === 'CONFIRMED'
                                                                        ? 'Đã xác nhận'
                                                                        : step === 'SHIPPING'
                                                                            ? 'Đang giao'
                                                                            : 'Đã giao'}
                                                            </p>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <div className="rounded-2xl bg-slate-50 p-4">
                                            <div className="grid gap-4 text-sm md:grid-cols-2">
                                                <div>
                                                    <p className="text-slate-400">
                                                        Người nhận
                                                    </p>
                                                    <p className="mt-1 font-semibold text-slate-800">
                                                        {order.recipientName}
                                                    </p>
                                                    <p className="text-slate-600">
                                                        {order.recipientPhone}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-slate-400">
                                                        Địa chỉ giao hàng
                                                    </p>
                                                    <p className="mt-1 font-semibold leading-6 text-slate-800">
                                                        {order.shippingAddress}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-slate-400">
                                                        Phương thức thanh toán
                                                    </p>
                                                    <p className="mt-1 font-semibold text-slate-800">
                                                        {order.paymentMethod === 'COD'
                                                            ? 'Thanh toán khi nhận hàng'
                                                            : order.paymentMethod === 'ZALOPAY'
                                                                ? 'ZaloPay'
                                                                : order.paymentMethod}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-slate-400">
                                                        Thời gian thanh toán
                                                    </p>
                                                    <p className="mt-1 font-semibold text-slate-800">
                                                        {order.paidAt
                                                            ? formatDate(order.paidAt)
                                                            : 'Chưa thanh toán'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 divide-y divide-slate-100">
                                            {order.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-4 py-4"
                                                >
                                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                                        {item.thumbnailUrl ? (
                                                            <img
                                                                src={item.thumbnailUrl}
                                                                alt={item.productName}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                                                Không có ảnh
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-slate-900">
                                                            {item.productName}
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {formatMoney(item.unitPrice)} ×{' '}
                                                            {item.quantity}
                                                        </p>
                                                    </div>

                                                    <p className="font-bold text-slate-900">
                                                        {formatMoney(item.subtotal)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                {order.note && (
                                                    <p className="text-sm text-slate-500">
                                                        Ghi chú: {order.note}
                                                    </p>
                                                )}

                                                {order.cancelReason && (
                                                    <p className="text-sm text-red-600">
                                                        Lý do hủy: {order.cancelReason}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm text-slate-500">
                                                    Tổng thanh toán
                                                </p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {formatMoney(order.totalAmount)}
                                                </p>
                                            </div>
                                        </div>

                                        {canCancel && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleCancel(order.id)
                                                }
                                                disabled={
                                                    cancellingId === order.id
                                                }
                                                className="mt-5 rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            >
                                                {cancellingId === order.id
                                                    ? 'Đang hủy...'
                                                    : 'Hủy đơn hàng'}
                                            </button>
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