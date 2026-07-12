import type {
    GuestCartItem,
} from './cartTypes'

const GUEST_CART_KEY = 'guestCart'

function notifyCartUpdated(): void {
    window.dispatchEvent(
        new Event('guest-cart-updated'),
    )
}

export function getGuestCart():
    GuestCartItem[] {
    try {
        const storedCart =
            localStorage.getItem(
                GUEST_CART_KEY,
            )

        if (!storedCart) {
            return []
        }

        const parsedCart =
            JSON.parse(storedCart) as unknown

        if (!Array.isArray(parsedCart)) {
            return []
        }

        return parsedCart.filter(
            (
                item,
            ): item is GuestCartItem => {
                if (
                    typeof item !== 'object' ||
                    item === null
                ) {
                    return false
                }

                const candidate =
                    item as Partial<GuestCartItem>

                return (
                    typeof candidate.productId ===
                    'number' &&
                    typeof candidate.productName ===
                    'string' &&
                    typeof candidate.quantity ===
                    'number'
                )
            },
        )
    } catch {
        return []
    }
}

export function saveGuestCart(
    items: GuestCartItem[],
): void {
    localStorage.setItem(
        GUEST_CART_KEY,
        JSON.stringify(items),
    )

    notifyCartUpdated()
}

export function addGuestCartItem(
    item: GuestCartItem,
): GuestCartItem[] {
    const cart = getGuestCart()

    const existingItem = cart.find(
        (cartItem) =>
            cartItem.productId ===
            item.productId,
    )

    if (existingItem) {
        const newQuantity = Math.min(
            existingItem.quantity +
            item.quantity,
            item.stockQuantity,
        )

        const updatedCart = cart.map(
            (cartItem) =>
                cartItem.productId ===
                item.productId
                    ? {
                        ...cartItem,
                        quantity:
                        newQuantity,
                        stockQuantity:
                        item.stockQuantity,
                        sellingPrice:
                        item.sellingPrice,
                        originalPrice:
                        item.originalPrice,
                        thumbnailUrl:
                        item.thumbnailUrl,
                        productStatus:
                        item.productStatus,
                    }
                    : cartItem,
        )

        saveGuestCart(updatedCart)

        return updatedCart
    }

    const newCart = [
        ...cart,
        {
            ...item,
            quantity: Math.min(
                item.quantity,
                item.stockQuantity,
            ),
        },
    ]

    saveGuestCart(newCart)

    return newCart
}

export function updateGuestCartItem(
    productId: number,
    quantity: number,
): GuestCartItem[] {
    const cart = getGuestCart()

    const updatedCart = cart.map(
        (item) => {
            if (
                item.productId !== productId
            ) {
                return item
            }

            return {
                ...item,
                quantity: Math.max(
                    1,
                    Math.min(
                        quantity,
                        item.stockQuantity,
                    ),
                ),
            }
        },
    )

    saveGuestCart(updatedCart)

    return updatedCart
}

export function removeGuestCartItem(
    productId: number,
): GuestCartItem[] {
    const updatedCart =
        getGuestCart().filter(
            (item) =>
                item.productId !== productId,
        )

    saveGuestCart(updatedCart)

    return updatedCart
}

export function clearGuestCart(): void {
    localStorage.removeItem(
        GUEST_CART_KEY,
    )

    notifyCartUpdated()
}

export function getGuestCartCount():
    number {
    return getGuestCart().reduce(
        (total, item) =>
            total + item.quantity,
        0,
    )
}