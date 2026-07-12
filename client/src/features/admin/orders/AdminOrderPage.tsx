import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import AdminLayout from '../AdminLayout'

import {
    getAdminOrders,
    updateAdminOrderStatus,
} from '../../orders/orderAPI'

import type {
    Order,
    OrderStatus,
    PaymentStatus,
} from '../../orders/orderTypes'

const orderStatusLabels: Record<OrderStatus, string> = {
    PENDING_PAYMENT: 'Chờ thanh toán',
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Đã giao thành công',
    CANCELLED: 'Đã hủy',
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
    UNPAID: 'Chưa thanh toán',
    PENDING: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền',
}

const filterOptions: Array<{
    value: 'ALL' | OrderStatus
    label: string
}> = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'SHIPPING', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Đã giao' },
    { value: 'CANCELLED', label: 'Đã hủy' },
]

function formatMoney(value: number): string {
    return `${value.toLocaleString('vi-VN')} ₫`
}

function formatDate(value?: string | null): string {
    if (!value) {
        return '—'
    }

    return new Date(value).toLocaleString('vi-VN')
}

function getNextActions(
    order: Order,
): Array<{
    status: OrderStatus
    label: string
    className: string
}> {
    switch (order.status) {
        case 'PENDING':
            return [
                {
                    status: 'CONFIRMED',
                    label: 'Xác nhận đơn',
                    className:
                        'bg-blue-600 text-white hover:bg-blue-700',
                },
                {
                    status: 'CANCELLED',
                    label: 'Hủy đơn',
                    className:
                        'border border-red-300 text-red-600 hover:bg-red-50',
                },
            ]

        case 'PENDING_PAYMENT':
            if (order.paymentStatus === 'PAID') {
                return [
                    {
                        status: 'CONFIRMED',
                        label: 'Xác nhận đơn',
                        className:
                            'bg-blue-600 text-white hover:bg-blue-700',
                    },
                ]
            }

            return []

        case 'CONFIRMED':
            return [
                {
                    status: 'SHIPPING',
                    label: 'Bắt đầu giao hàng',
                    className:
                        'bg-amber-500 text-white hover:bg-amber-600',
                },
                {
                    status: 'CANCELLED',
                    label: 'Hủy đơn',
                    className:
                        'border border-red-300 text-red-600 hover:bg-red-50',
                },
            ]

        case 'SHIPPING':
            return [
                {
                    status: 'DELIVERED',
                    label: 'Xác nhận đã giao',
                    className:
                        'bg-green-600 text-white hover:bg-green-700',
                },
            ]

        default:
            return []
    }
}

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

export default function AdminOrderPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] =
        useState<number | null>(null)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] =
        useState<'ALL' | OrderStatus>('ALL')

    const loadOrders = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const data = await getAdminOrders()
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

    const filteredOrders = useMemo(() => {
        const keyword = search.trim().toLowerCase()

        return orders.filter((order) => {
            const matchesStatus =
                statusFilter === 'ALL'
                || order.status === statusFilter

            const matchesSearch =
                !keyword
                || order.orderCode.toLowerCase().includes(keyword)
                || order.recipientName
                    .toLowerCase()
                    .includes(keyword)
                || order.recipientPhone.includes(keyword)

            return matchesStatus && matchesSearch
        })
    }, [orders, search, statusFilter])

    async function handleUpdateStatus(
        order: Order,
        nextStatus: OrderStatus,
    ) {
        const confirmationMessages: Partial<
            Record<OrderStatus, string>
        > = {
            CONFIRMED:
                `Xác nhận đơn ${order.orderCode}?`,
            SHIPPING:
                `Chuyển đơn ${order.orderCode} sang đang giao?`,
            DELIVERED:
                `Xác nhận đơn ${order.orderCode} đã giao thành công?`,
            CANCELLED:
                `Bạn chắc chắn muốn hủy đơn ${order.orderCode}?`,
        }

        const confirmed = window.confirm(
            confirmationMessages[nextStatus]
            ?? 'Xác nhận cập nhật trạng thái?',
        )

        if (!confirmed) {
            return
        }

        setUpdatingId(order.id)
        setError('')

        try {
            const updatedOrder =
                await updateAdminOrderStatus(
                    order.id,
                    nextStatus,
                )

            setOrders((currentOrders) =>
                currentOrders.map((currentOrder) =>
                    currentOrder.id === updatedOrder.id
                        ? updatedOrder
                        : currentOrder,
                ),
            )
        } catch (updateError) {
            setError(
                getErrorMessage(
                    updateError,
                    'Không thể cập nhật trạng thái đơn hàng',
                ),
            )
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <AdminLayout
            title="Quản lý đơn hàng"
            description="Xác nhận, giao hàng và theo dõi thanh toán."
        >
            {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    {error}
                </div>
            )}

            <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1fr_240px]">
                    <input
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Tìm theo mã đơn, tên hoặc số điện thoại..."
                        className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value as
                                    | 'ALL'
                                    | OrderStatus,
                            )
                        }
                        className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                    >
                        {filterOptions.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {loading ? (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                    Đang tải đơn hàng...
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">
                    Không tìm thấy đơn hàng phù hợp.
                </div>
            ) : (
                <div className="space-y-5">
                    {filteredOrders.map((order) => {
                        const actions = getNextActions(order)

                        return (
                            <article
                                key={order.id}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                            >
                                <div className="flex flex-col gap-4 border-b bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="font-bold text-slate-900">
                                            {order.orderCode}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {formatDate(order.createdAt)}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {orderStatusLabels[order.status]}
                    </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                order.paymentStatus === 'PAID'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                      {
                          paymentStatusLabels[
                              order.paymentStatus
                              ]
                      }
                    </span>
                                    </div>
                                </div>

                                <div className="grid gap-6 p-5 xl:grid-cols-[1fr_1fr_280px]">
                                    <div>
                                        <h3 className="mb-3 font-bold text-slate-900">
                                            Thông tin nhận hàng
                                        </h3>

                                        <div className="space-y-2 text-sm text-slate-600">
                                            <p>
                        <span className="font-semibold text-slate-800">
                          Người nhận:
                        </span>{' '}
                                                {order.recipientName}
                                            </p>

                                            <p>
                        <span className="font-semibold text-slate-800">
                          Điện thoại:
                        </span>{' '}
                                                {order.recipientPhone}
                                            </p>

                                            <p>
                        <span className="font-semibold text-slate-800">
                          Địa chỉ:
                        </span>{' '}
                                                {order.shippingAddress}
                                            </p>

                                            <p>
                        <span className="font-semibold text-slate-800">
                          Ghi chú:
                        </span>{' '}
                                                {order.note || 'Không có'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="mb-3 font-bold text-slate-900">
                                            Sản phẩm
                                        </h3>

                                        <div className="space-y-3">
                                            {order.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between gap-3 text-sm"
                                                >
                          <span className="text-slate-700">
                            {item.productName} ×{' '}
                              {item.quantity}
                          </span>

                                                    <strong className="shrink-0">
                                                        {formatMoney(item.subtotal)}
                                                    </strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-sm text-slate-500">
                                            Phương thức
                                        </p>

                                        <p className="mt-1 font-bold text-slate-900">
                                            {order.paymentMethod === 'COD'
                                                ? 'COD'
                                                : order.paymentMethod ===
                                                'ZALOPAY'
                                                    ? 'ZaloPay'
                                                    : order.paymentMethod}
                                        </p>

                                        <p className="mt-4 text-sm text-slate-500">
                                            Tổng tiền
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-blue-600">
                                            {formatMoney(order.totalAmount)}
                                        </p>

                                        <p className="mt-4 text-xs text-slate-500">
                                            Thanh toán:{' '}
                                            {order.paidAt
                                                ? formatDate(order.paidAt)
                                                : 'Chưa thanh toán'}
                                        </p>

                                        {actions.length > 0 && (
                                            <div className="mt-5 space-y-2">
                                                {actions.map((action) => (
                                                    <button
                                                        key={action.status}
                                                        type="button"
                                                        disabled={
                                                            updatingId === order.id
                                                        }
                                                        onClick={() =>
                                                            void handleUpdateStatus(
                                                                order,
                                                                action.status,
                                                            )
                                                        }
                                                        className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${action.className}`}
                                                    >
                                                        {updatingId === order.id
                                                            ? 'Đang cập nhật...'
                                                            : action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {order.status === 'PENDING_PAYMENT'
                                            && order.paymentStatus !== 'PAID' && (
                                                <p className="mt-4 rounded-xl bg-amber-100 p-3 text-xs leading-5 text-amber-700">
                                                    Đơn online chưa thanh toán.
                                                    Admin chưa thể xác nhận giao hàng.
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </AdminLayout>
    )
}