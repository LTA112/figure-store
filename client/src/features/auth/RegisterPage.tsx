import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { registerApi } from './authAPI'
import { useAuth } from './AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { saveLogin } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (
      event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (
      event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setMessage('')

    if (form.password !== form.confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)

    try {
      const response = await registerApi({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
      })

      saveLogin(response.data)
      navigate('/')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data

        if (
            responseData?.data &&
            typeof responseData.data === 'object'
        ) {
          const firstError = Object.values(
              responseData.data,
          )[0]

          setMessage(
              typeof firstError === 'string'
                  ? firstError
                  : responseData.message,
          )
        } else {
          setMessage(
              responseData?.message ?? 'Đăng ký thất bại',
          )
        }
      } else {
        setMessage('Đăng ký thất bại')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
        >
          <h1 className="mb-2 text-center text-3xl font-bold">
            Đăng ký
          </h1>

          <p className="mb-6 text-center text-gray-500">
            Tạo tài khoản Figure Store
          </p>

          <label className="mb-2 block font-medium">
            Họ và tên
          </label>

          <input
              name="fullName"
              value={form.fullName}
              placeholder="Nhập họ và tên"
              onChange={handleChange}
              required
              className="mb-4 w-full rounded-lg border px-4 py-3"
          />

          <label className="mb-2 block font-medium">
            Email
          </label>

          <input
              type="email"
              name="email"
              value={form.email}
              placeholder="Nhập email"
              onChange={handleChange}
              required
              className="mb-4 w-full rounded-lg border px-4 py-3"
          />

          <label className="mb-2 block font-medium">
            Số điện thoại
          </label>

          <input
              name="phone"
              value={form.phone}
              placeholder="Ví dụ: 0901234567"
              onChange={handleChange}
              className="mb-4 w-full rounded-lg border px-4 py-3"
          />

          <label className="mb-2 block font-medium">
            Mật khẩu
          </label>

          <input
              type="password"
              name="password"
              value={form.password}
              placeholder="Ít nhất 6 ký tự"
              onChange={handleChange}
              required
              minLength={6}
              className="mb-4 w-full rounded-lg border px-4 py-3"
          />

          <label className="mb-2 block font-medium">
            Xác nhận mật khẩu
          </label>

          <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              placeholder="Nhập lại mật khẩu"
              onChange={handleChange}
              required
              className="mb-5 w-full rounded-lg border px-4 py-3"
          />

          {message && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {message}
              </p>
          )}

          <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>

          <p className="mt-5 text-center text-sm">
            Đã có tài khoản?{' '}
            <Link
                to="/login"
                className="font-semibold text-blue-600"
            >
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
  )
}