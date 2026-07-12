import type { ApiResponse } from '../auth/authTypes'

export interface CartItem {
    id: number
    productId: number
    productName: string
    productSlug: string
    thumbnailUrl: string | null
    originalPrice: number
    sellingPrice: number
    quantity: number
    stockQuantity: number
    productStatus:
        | 'ACTIVE'
        | 'INACTIVE'
        | 'OUT_OF_STOCK'
    subtotal: number
}

export interface Cart {
    id: number | null
    items: CartItem[]
    totalItems: number
    totalQuantity: number
    totalAmount: number
}

export interface AddCartItemRequest {
    productId: number
    quantity: number
}

export interface UpdateCartItemRequest {
    quantity: number
}

export interface GuestCartItem {
    productId: number
    productName: string
    productSlug: string
    thumbnailUrl: string | null
    originalPrice: number
    sellingPrice: number
    quantity: number
    stockQuantity: number
    productStatus:
        | 'ACTIVE'
        | 'INACTIVE'
        | 'OUT_OF_STOCK'
}

export type CartApiResponse =
    ApiResponse<Cart>