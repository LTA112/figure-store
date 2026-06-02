import { api } from '../../services/api'

export const registerApi = async (data: any) => {
  const response = await api.post('/auth/register', data)
  return response.data
}

export const loginApi = async (data: any) => {
  const response = await api.post('/auth/login', data)
  return response.data
}