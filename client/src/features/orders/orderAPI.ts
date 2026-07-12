import { api } from '../../services/api'

import type {
    Address,
    ApiResponse,
    CreateAddressRequest,
    Order,
    PaymentMethod,
    PaymentUrlResponse,
} from './orderTypes'

export const getAddresses =
    async (): Promise<Address[]> => {
        const response =
            await api.get<ApiResponse<Address[]>>(
                '/addresses',
            )

        return response.data.data
    }

export const createAddress = async (
    body: CreateAddressRequest,
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

export const getMyOrders =
    async (): Promise<Order[]> => {
        const response =
            await api.get<ApiResponse<Order[]>>(
                '/orders',
            )

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
        await api.post<
            ApiResponse<PaymentUrlResponse>
        >(`/orders/${id}/payment-url`)

    return response.data.data
}