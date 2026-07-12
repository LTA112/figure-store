import type { ApiResponse } from '../auth/authTypes'

export type ProductStatus =
    | 'ACTIVE'
    | 'INACTIVE'
    | 'OUT_OF_STOCK'

export interface Category {
    id: number
    name: string
    slug: string
    description: string | null
    active: boolean
    createdAt: string
    updatedAt: string
}

export interface ProductImage {
    id: number
    imageUrl: string
    displayOrder: number
}

export interface Product {
    id: number
    name: string
    slug: string
    description: string | null
    price: number
    discountPrice: number | null
    sellingPrice: number
    stockQuantity: number
    soldQuantity: number
    scaleRatio: string | null
    material: string | null
    brand: string | null
    thumbnailUrl: string | null
    status: ProductStatus
    featured: boolean
    newProduct: boolean
    category: Category
    images: ProductImage[]
    createdAt: string
    updatedAt: string
}

export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
    first: boolean
    last: boolean
    numberOfElements: number
    empty: boolean
}

export interface ProductFilter {
    keyword?: string
    categoryId?: number
    brand?: string
    minPrice?: number
    maxPrice?: number
    featured?: boolean
    newProduct?: boolean
    status?: ProductStatus
    sort?: string
    page?: number
    size?: number
}

export interface CategoryRequest {
    name: string
    slug?: string
    description?: string
    active?: boolean
}

export interface ProductRequest {
    name: string
    slug?: string
    description?: string
    price: number
    discountPrice?: number | null
    stockQuantity: number
    scaleRatio?: string
    material?: string
    brand?: string
    categoryId: number
    status?: ProductStatus
    featured?: boolean
    newProduct?: boolean
    retainedImageIds?: number[]
}

export type CategoryApiResponse =
    ApiResponse<Category>

export type CategoryListApiResponse =
    ApiResponse<Category[]>

export type ProductApiResponse =
    ApiResponse<Product>

export type ProductPageApiResponse =
    ApiResponse<PageResponse<Product>>