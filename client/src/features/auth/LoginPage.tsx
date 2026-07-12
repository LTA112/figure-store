import {
  useState,
  type FormEvent,
} from 'react'

import axios from 'axios'

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { loginApi } from './authAPI'
import { useAuth } from './AuthContext'

import {
  getGuestCartCount,
  syncGuestCartToServer,
} from '../cart/guestCart'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { saveLogin } =
      useAuth()

  const searchParams =
      new URLSearchParams(
          location.search,
      )

  const redirectPath =
      searchParams.get(
          'redirect',
      ) || '/'

  const [form, setForm] =
      useState({
        email: '',
        password: '',
      })

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(false)

  const handleChange = (
      event:
      React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } =
        event.target

    setForm(
        (previous) => ({
          ...previous,
          [name]: value,
        }),
    )
  }

  const handleSubmit = async (
      event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setMessage('')
    setLoading(true)

    try {
      /*
       * Bước 1: đăng nhập.
       */
      const response =
          await loginApi(form)

      /*
       * Bước 2: lưu token trước.
       * Axios interceptor sẽ lấy token
       * này khi gọi /cart/merge.
       */
      saveLogin(
          response.data,
      )

      if (
          response.data.user
              .role === 'ADMIN'
      ) {
        navigate(
            '/admin',
            {
              replace: true,
            },
        )

        return
      }

      /*
       * Bước 3: kiểm tra giỏ guest
       * trước khi đồng bộ.
       */
      const guestCartCount =
          getGuestCartCount()

      if (
          guestCartCount > 0
      ) {
        try {
          const mergedCart =
              await syncGuestCartToServer()

          console.log(
              'Giỏ sau khi đồng bộ:',
              mergedCart,
          )
        } catch (syncError) {
          console.error(
              'Lỗi đồng bộ giỏ hàng:',
              syncError,
          )

          /*
           * Không chuyển trang và không xóa
           * guest cart nếu đồng bộ thất bại.
           */
          if (
              axios.isAxiosError(
                  syncError,
              )
          ) {
            const errorData =
                syncError
                    .response
                    ?.data as
                    | {
                  message?:
                      string
                }
                    | undefined

            setMessage(
                errorData
                    ?.message ??
                `Đăng nhập thành công nhưng không thể đồng bộ giỏ hàng. Mã lỗi: ${
                    syncError
                        .response
                        ?.status ??
                    'không xác định'
                }`,
            )
          } else {
            setMessage(
                'Đăng nhập thành công nhưng không thể đồng bộ giỏ hàng.',
            )
          }

          return
        }
      }

      /*
       * Bước 4: chỉ chuyển trang sau
       * khi merge đã thành công.
       */
      navigate(
          redirectPath,
          {
            replace: true,
          },
      )
    } catch (error) {
      if (
          axios.isAxiosError(
              error,
          )
      ) {
        setMessage(
            error.response
                ?.data
                ?.message ??
            'Đăng nhập thất bại',
        )
      } else {
        setMessage(
            'Đăng nhập thất bại',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="flex min-h-[650px] items-center justify-center bg-gray-100 px-4 py-12">
        <form
            onSubmit={
              handleSubmit
            }
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
        >
          <h1 className="mb-2 text-center text-3xl font-bold">
            Đăng nhập
          </h1>

          <p className="mb-6 text-center text-gray-500">
            Đăng nhập vào
            Vitoy Store
          </p>

          <label className="mb-2 block font-medium">
            Email
          </label>

          <input
              type="email"
              name="email"
              value={
                form.email
              }
              placeholder="Nhập email"
              onChange={
                handleChange
              }
              required
              className="mb-4 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          />

          <label className="mb-2 block font-medium">
            Mật khẩu
          </label>

          <input
              type="password"
              name="password"
              value={
                form.password
              }
              placeholder="Nhập mật khẩu"
              onChange={
                handleChange
              }
              required
              className="mb-4 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          />

          {message && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {message}
              </div>
          )}

          <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#3157d5] px-4 py-3 font-semibold text-white transition hover:bg-[#2848b9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
                ? 'Đang đăng nhập...'
                : 'Đăng nhập'}
          </button>

          <p className="mt-5 text-center text-sm text-gray-600">
            Chưa có tài
            khoản?{' '}
            <Link
                to="/register"
                className="font-semibold text-[#3157d5]"
            >
              Đăng ký
            </Link>
          </p>
        </form>
      </div>
  )
}