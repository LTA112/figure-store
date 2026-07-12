import { api } from '../../services/api'
import type {
    AddCartItemRequest,
    Cart,
    CartApiResponse,
    UpdateCartItemRequest,
} from './cartTypes'

export async function getCartApi(): Promise<Cart> {
    const response =
        await api.get<CartApiResponse>('/cart')

    return response.data.data
}

export async function addCartItemApi(
    request: AddCartItemRequest,
): Promise<Cart> {
    const response =
        await api.post<CartApiResponse>(
            '/cart/items',
            request,
        )

    return response.data.data
}

export async function updateCartItemApi(
    itemId: number,
    request: UpdateCartItemRequest,
): Promise<Cart> {
    const response =
        await api.put<CartApiResponse>(
            `/cart/items/${itemId}`,
            request,
        )

    return response.data.data
}

export async function removeCartItemApi(
    itemId: number,
): Promise<Cart> {
    const response =
        await api.delete<CartApiResponse>(
            `/cart/items/${itemId}`,
        )

    return response.data.data
}

export async function clearCartApi(): Promise<void> {
    await api.delete('/cart')
}