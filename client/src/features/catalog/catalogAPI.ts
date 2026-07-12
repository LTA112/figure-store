import { api } from '../../services/api'
import type {
    Category,
    CategoryListApiResponse,
    CategoryRequest,
    PageResponse,
    Product,
    ProductApiResponse,
    ProductFilter,
    ProductPageApiResponse,
    ProductRequest,
} from './catalogTypes'

function cleanParams(
    params: ProductFilter,
): Record<string, string | number | boolean> {
    const result: Record<
        string,
        string | number | boolean
    > = {}

    Object.entries(params).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null &&
            value !== ''
        ) {
            result[key] = value
        }
    })

    return result
}

export async function getCategories(): Promise<
    Category[]
> {
    const response =
        await api.get<CategoryListApiResponse>(
            '/categories',
        )

    return response.data.data
}

export async function getAdminCategories(): Promise<
    Category[]
> {
    const response =
        await api.get<CategoryListApiResponse>(
            '/admin/categories',
        )

    return response.data.data
}

export async function getCategory(
    id: number,
): Promise<Category> {
    const response = await api.get<{
        success: boolean
        message: string
        data: Category
    }>(`/admin/categories/${id}`)

    return response.data.data
}

export async function createCategory(
    payload: CategoryRequest,
): Promise<Category> {
    const response = await api.post<{
        success: boolean
        message: string
        data: Category
    }>('/admin/categories', payload)

    return response.data.data
}

export async function updateCategory(
    id: number,
    payload: CategoryRequest,
): Promise<Category> {
    const response = await api.put<{
        success: boolean
        message: string
        data: Category
    }>(`/admin/categories/${id}`, payload)

    return response.data.data
}

export async function deleteCategory(
    id: number,
): Promise<void> {
    await api.delete(`/admin/categories/${id}`)
}

export async function getProducts(
    filter: ProductFilter = {},
): Promise<PageResponse<Product>> {
    const response =
        await api.get<ProductPageApiResponse>(
            '/products',
            {
                params: cleanParams(filter),
            },
        )

    return response.data.data
}

export async function getProductById(
    id: number,
): Promise<Product> {
    const response =
        await api.get<ProductApiResponse>(
            `/products/${id}`,
        )

    return response.data.data
}

export async function getProductBySlug(
    slug: string,
): Promise<Product> {
    const response =
        await api.get<ProductApiResponse>(
            `/products/slug/${slug}`,
        )

    return response.data.data
}

export async function getAdminProducts(
    filter: ProductFilter = {},
): Promise<PageResponse<Product>> {
    const response =
        await api.get<ProductPageApiResponse>(
            '/admin/products',
            {
                params: cleanParams(filter),
            },
        )

    return response.data.data
}

export async function getAdminProduct(
    id: number,
): Promise<Product> {
    const response =
        await api.get<ProductApiResponse>(
            `/admin/products/${id}`,
        )

    return response.data.data
}

function buildProductFormData(
    payload: ProductRequest,
    thumbnail?: File | null,
    images: File[] = [],
): FormData {
    const formData = new FormData()

    const productBlob = new Blob(
        [JSON.stringify(payload)],
        {
            type: 'application/json',
        },
    )

    formData.append('product', productBlob)

    if (thumbnail) {
        formData.append('thumbnail', thumbnail)
    }

    images.forEach((image) => {
        formData.append('images', image)
    })

    return formData
}

export async function createProduct(
    payload: ProductRequest,
    thumbnail: File,
    images: File[],
): Promise<Product> {
    const formData = buildProductFormData(
        payload,
        thumbnail,
        images,
    )

    const response =
        await api.post<ProductApiResponse>(
            '/admin/products',
            formData,
            {
                headers: {
                    'Content-Type':
                        'multipart/form-data',
                },
            },
        )

    return response.data.data
}

export async function updateProduct(
    id: number,
    payload: ProductRequest,
    thumbnail: File | null,
    images: File[],
): Promise<Product> {
    const formData = buildProductFormData(
        payload,
        thumbnail,
        images,
    )

    const response =
        await api.put<ProductApiResponse>(
            `/admin/products/${id}`,
            formData,
            {
                headers: {
                    'Content-Type':
                        'multipart/form-data',
                },
            },
        )

    return response.data.data
}

export async function hideProduct(
    id: number,
): Promise<void> {
    await api.delete(`/admin/products/${id}`)
}