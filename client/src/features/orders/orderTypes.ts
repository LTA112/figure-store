export type PaymentMethod =
    | 'COD'
    | 'VNPAY'
    | 'ZALOPAY'
    | 'MOCK'

export interface Address {
    id: number
    label: string
    recipientName: string
    phone: string
    province: string

    /**
     * Giữ field district để tương thích
     * dữ liệu địa chỉ cũ.
     *
     * Địa chỉ mới theo mô hình 2 cấp
     * có thể để trống field này.
     */
    district?: string

    ward: string
    detailAddress: string
    defaultAddress: boolean
}

export type CreateAddressRequest = Omit<
    Address,
    'id'
>

export interface OrderItem {
    id: number
    productId: number
    productName: string
    thumbnailUrl?: string
    unitPrice: number
    quantity: number
    subtotal: number
}

export interface Order {
    id: number
    orderCode: string
    recipientName: string
    recipientPhone: string
    shippingAddress: string
    note?: string
    subtotal: number
    shippingFee: number
    totalAmount: number
    status: string
    paymentMethod: PaymentMethod
    paymentStatus: string
    createdAt: string
    items: OrderItem[]
}

export interface PaymentUrlResponse {
    paymentUrl: string
    orderCode?: string
    provider?: string
    message?: string
}

export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}