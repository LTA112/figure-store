export type UserRole = 'USER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'LOCKED'

export interface AuthUser {
    id: number
    fullName: string
    email: string
    phone: string | null
    role: UserRole
    status: UserStatus
}

export interface AuthData {
    token: string
    tokenType: string
    user: AuthUser
}

export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    fullName: string
    email: string
    password: string
    phone: string
}