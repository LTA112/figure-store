import { api } from '../../services/api'
import type {
  ApiResponse,
  AuthData,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from './authTypes'

export const registerApi = async (
    data: RegisterRequest,
): Promise<ApiResponse<AuthData>> => {
  const response = await api.post<ApiResponse<AuthData>>(
      '/auth/register',
      data,
  )

  return response.data
}

export const loginApi = async (
    data: LoginRequest,
): Promise<ApiResponse<AuthData>> => {
  const response = await api.post<ApiResponse<AuthData>>(
      '/auth/login',
      data,
  )

  return response.data
}

export const getCurrentUserApi = async (): Promise<
    ApiResponse<AuthUser>
> => {
  const response = await api.get<ApiResponse<AuthUser>>(
      '/auth/me',
  )

  return response.data
}