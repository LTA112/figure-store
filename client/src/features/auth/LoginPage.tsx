import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { loginApi } from './authAPI'
import { useAuth } from './AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { saveLogin } = useAuth()

  const [form, setForm] = useState({
    email: '',
    password: '',
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
    setLoading(true)

    try {
      const response = await loginApi(form)

      saveLogin(response.data)

      if (response.data.user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage(
            error.response?.data?.message ??
            'Đăng nhập thất bại',
        )
      } else {
        setMessage('Đăng nhập thất bại')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
        >
          <h1 className="mb-2 text-center text-3xl font-bold">
            Đăng nhập
          </h1>

          <p className="mb-6 text-center text-gray-500">
            Đăng nhập vào Figure Store
          </p>

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
              className="mb-4 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          />

          <label className="mb-2 block font-medium">
            Mật khẩu
          </label>

          <input
              type="password"
              name="password"
              value={form.password}
              placeholder="Nhập mật khẩu"
              onChange={handleChange}
              required
              className="mb-5 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
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
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <p className="mt-5 text-center text-sm">
            Chưa có tài khoản?{' '}
            <Link
                to="/register"
                className="font-semibold text-blue-600"
            >
              Đăng ký
            </Link>
          </p>
        </form>
      </div>
  )
}