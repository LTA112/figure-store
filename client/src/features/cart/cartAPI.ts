import { api } from '../../services/api'

import type {
    AddCartItemRequest,
    Cart,
    CartApiResponse,
    UpdateCartItemRequest,
} from './cartTypes'

export interface MergeCartItemRequest {
    productId: number
    quantity: number
}

interface MergeCartRequest {
    items: MergeCartItemRequest[]
}

function notifyServerCartUpdated(
    cart?: Cart,
): void {
    window.dispatchEvent(
        new CustomEvent(
            'server-cart-updated',
            {
                detail: cart,
            },
        ),
    )
}

export async function getCartApi():
    Promise<Cart> {
    const response =
        await api.get<CartApiResponse>(
            '/cart',
        )

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

    const cart = response.data.data

    notifyServerCartUpdated(cart)

    return cart
}

export async function mergeGuestCartApi(
    items: MergeCartItemRequest[],
): Promise<Cart> {
    const request: MergeCartRequest = {
        items,
    }

    const response =
        await api.post<CartApiResponse>(
            '/cart/merge',
            request,
        )

    const cart = response.data.data

    notifyServerCartUpdated(cart)

    return cart
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

    const cart = response.data.data

    notifyServerCartUpdated(cart)

    return cart
}

export async function removeCartItemApi(
    itemId: number,
): Promise<Cart> {
    const response =
        await api.delete<CartApiResponse>(
            `/cart/items/${itemId}`,
        )

    const cart = response.data.data

    notifyServerCartUpdated(cart)

    return cart
}

export async function clearCartApi():
    Promise<void> {
    await api.delete('/cart')

    notifyServerCartUpdated({
        id: null,
        items: [],
        totalItems: 0,
        totalQuantity: 0,
        totalAmount: 0,
    })
}