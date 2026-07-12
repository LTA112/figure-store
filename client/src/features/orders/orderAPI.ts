import { api } from '../../services/api'

import type {
    Address,
    ApiResponse,
    Order,
    OrderStatus,
    PaymentMethod,
    PaymentUrlResponse,
} from './orderTypes'

export const getAddresses = async (): Promise<Address[]> => {
    const response =
        await api.get<ApiResponse<Address[]>>('/addresses')

    return response.data.data
}

export const createAddress = async (
    body: Omit<Address, 'id'>,
): Promise<Address> => {
    const response =
        await api.post<ApiResponse<Address>>(
            '/addresses',
            body,
        )

    return response.data.data
}

export const createOrder = async (
    addressId: number,
    paymentMethod: PaymentMethod,
    note: string,
): Promise<Order> => {
    const response =
        await api.post<ApiResponse<Order>>(
            '/orders',
            {
                addressId,
                paymentMethod,
                note: note.trim(),
            },
        )

    return response.data.data
}

export const getMyOrders = async (): Promise<Order[]> => {
    const response =
        await api.get<ApiResponse<Order[]>>('/orders')

    return response.data.data
}

export const cancelOrder = async (
    id: number,
    reason: string,
): Promise<Order> => {
    const response =
        await api.post<ApiResponse<Order>>(
            `/orders/${id}/cancel`,
            {
                reason: reason.trim(),
            },
        )

    return response.data.data
}

export const createPaymentUrl = async (
    id: number,
): Promise<PaymentUrlResponse> => {
    const response =
        await api.post<ApiResponse<PaymentUrlResponse>>(
            `/orders/${id}/payment-url`,
        )

    return response.data.data
}

/* ================= ADMIN ================= */

export const getAdminOrders = async (): Promise<Order[]> => {
    const response =
        await api.get<ApiResponse<Order[]>>(
            '/admin/orders',
        )

    return response.data.data
}

export const updateAdminOrderStatus = async (
    id: number,
    status: OrderStatus,
): Promise<Order> => {
    const response =
        await api.put<ApiResponse<Order>>(
            `/admin/orders/${id}/status`,
            {
                status,
            },
        )

    return response.data.data
}
export const verifyZaloPayPayment = async (
    orderCode: string,
): Promise<Order> => {
    const response =
        await api.post<ApiResponse<Order>>(
            `/orders/${encodeURIComponent(
                orderCode,
            )}/zalopay/verify`,
        )

    return response.data.data
}