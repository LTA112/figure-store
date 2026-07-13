export type PaymentMethod =
    | 'COD'
    | 'VNPAY'
    | 'ZALOPAY'
    | 'MOCK'

export type OrderStatus =
    | 'PENDING_PAYMENT'
    | 'PENDING'
    | 'CONFIRMED'
    | 'SHIPPING'
    | 'DELIVERED'
    | 'CANCELLED'

export type PaymentStatus =
    | 'UNPAID'
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'REFUNDED'

export interface Address {
    id: number
    label: string
    recipientName: string
    phone: string
    province: string
    district?: string | null
    ward: string
    detailAddress: string
    defaultAddress: boolean
}

export interface CreateAddressRequest {
    label: string
    recipientName: string
    phone: string
    province: string
    district: string
    ward: string
    detailAddress: string
    defaultAddress: boolean
}

export interface OrderItem {
    id: number
    productId: number
    productName: string
    thumbnailUrl?: string | null
    unitPrice: number
    quantity: number
    subtotal: number
}

export interface PaymentTransaction {
    id: number
    provider: PaymentMethod
    providerTransactionId?: string | null
    requestId: string
    amount: number
    status: PaymentStatus
    createdAt: string
    updatedAt: string
}

export interface Order {
    id: number
    orderCode: string

    recipientName: string
    recipientPhone: string
    shippingAddress: string
    note?: string | null

    subtotal: number
    shippingFee: number
    totalAmount: number

    status: OrderStatus
    paymentMethod: PaymentMethod
    paymentStatus: PaymentStatus

    paidAt?: string | null
    confirmedAt?: string | null
    shippingAt?: string | null
    deliveredAt?: string | null
    cancelledAt?: string | null
    cancelReason?: string | null
    createdAt: string

    items: OrderItem[]
    payments: PaymentTransaction[]
}

export interface PaymentUrlResponse {
    orderCode?: string
    paymentUrl: string
    provider?: PaymentMethod | string
    message?: string
}

export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}