const VIETNAM_ADDRESS_API =
    'https://provinces.open-api.vn/api/v2/?depth=2'

const CACHE_KEY = 'vietnam-administrative-units-v2'
const CACHE_TIME = 24 * 60 * 60 * 1000

export interface VietnamWard {
    code: number
    name: string
    codename?: string
    division_type?: string
    province_code?: number
}

export interface VietnamProvince {
    code: number
    name: string
    codename?: string
    division_type?: string
    wards: VietnamWard[]
}

interface AddressCache {
    createdAt: number
    data: VietnamProvince[]
}

function normalizeProvinces(
    rawData: unknown,
): VietnamProvince[] {
    if (!Array.isArray(rawData)) {
        return []
    }

    return rawData
        .map((item: any) => ({
            code: Number(item.code),
            name: String(item.name ?? ''),
            codename: item.codename,
            division_type: item.division_type,
            wards: Array.isArray(item.wards)
                ? item.wards.map((ward: any) => ({
                    code: Number(ward.code),
                    name: String(ward.name ?? ''),
                    codename: ward.codename,
                    division_type: ward.division_type,
                    province_code:
                        ward.province_code !== undefined
                            ? Number(ward.province_code)
                            : undefined,
                }))
                : [],
        }))
        .filter(
            (province) =>
                province.code &&
                province.name,
        )
        .sort((a, b) =>
            a.name.localeCompare(b.name, 'vi'),
        )
}

export async function getVietnamProvinces(): Promise<
    VietnamProvince[]
> {
    const cachedValue =
        localStorage.getItem(CACHE_KEY)

    if (cachedValue) {
        try {
            const cache: AddressCache =
                JSON.parse(cachedValue)

            const isValid =
                Date.now() - cache.createdAt <
                CACHE_TIME

            if (
                isValid &&
                Array.isArray(cache.data) &&
                cache.data.length > 0
            ) {
                return cache.data
            }
        } catch {
            localStorage.removeItem(CACHE_KEY)
        }
    }

    const response = await fetch(
        VIETNAM_ADDRESS_API,
    )

    if (!response.ok) {
        throw new Error(
            'Không tải được danh sách tỉnh thành',
        )
    }

    const responseData = await response.json()
    const provinces =
        normalizeProvinces(responseData)

    if (provinces.length === 0) {
        throw new Error(
            'Dữ liệu tỉnh thành không hợp lệ',
        )
    }

    const cache: AddressCache = {
        createdAt: Date.now(),
        data: provinces,
    }

    localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(cache),
    )

    return provinces
}