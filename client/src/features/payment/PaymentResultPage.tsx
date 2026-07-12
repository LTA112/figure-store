import {
    useEffect,
    useState,
} from 'react'
import {
    useNavigate,
    useSearchParams,
} from 'react-router-dom'
import axios from 'axios'

import { verifyZaloPayPayment } from '../orders/orderAPI'

type ResultStatus =
    | 'checking'
    | 'success'
    | 'pending'
    | 'error'

function getErrorMessage(
    error: unknown,
): string {
    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.message ||
            error.message ||
            'Không thể kiểm tra thanh toán'
        )
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'Không thể kiểm tra thanh toán'
}

export default function PaymentResultPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const orderCode =
        searchParams.get('order') || ''

    const [status, setStatus] =
        useState<ResultStatus>('checking')

    const [message, setMessage] =
        useState(
            'Đang kiểm tra trạng thái thanh toán ZaloPay...',
        )

    useEffect(() => {
        let cancelled = false

        async function verifyPayment() {
            if (!orderCode) {
                setStatus('error')
                setMessage(
                    'Không tìm thấy mã đơn hàng',
                )
                return
            }

            try {
                const order =
                    await verifyZaloPayPayment(
                        orderCode,
                    )

                if (cancelled) {
                    return
                }

                if (
                    order.paymentStatus ===
                    'PAID'
                ) {
                    setStatus('success')
                    setMessage(
                        'Thanh toán thành công. Đơn hàng đang chờ admin xác nhận.',
                    )
                    return
                }

                setStatus('pending')
                setMessage(
                    'ZaloPay chưa xác nhận giao dịch. Bạn có thể kiểm tra lại sau.',
                )
            } catch (error) {
                if (cancelled) {
                    return
                }

                setStatus('error')
                setMessage(
                    getErrorMessage(error),
                )
            }
        }

        void verifyPayment()

        return () => {
            cancelled = true
        }
    }, [orderCode])

    const title =
        status === 'checking'
            ? 'Đang kiểm tra thanh toán'
            : status === 'success'
                ? 'Thanh toán thành công'
                : status === 'pending'
                    ? 'Đang chờ xác nhận'
                    : 'Không thể kiểm tra thanh toán'

    return (
        <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
            <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div
                    className={[
                        'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold',
                        status === 'success'
                            ? 'bg-green-100 text-green-600'
                            : status === 'error'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-blue-100 text-blue-600',
                    ].join(' ')}
                >
                    {status === 'success'
                        ? '✓'
                        : status === 'error'
                            ? '!'
                            : '…'}
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                    {title}
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                    {message}
                </p>

                {orderCode && (
                    <p className="mt-3 text-sm text-slate-500">
                        Mã đơn:{' '}
                        <strong className="text-slate-900">
                            {orderCode}
                        </strong>
                    </p>
                )}

                <div className="mt-7 flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            navigate('/orders', {
                                replace: true,
                            })
                        }
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Xem đơn hàng
                    </button>

                    {status !== 'success' && (
                        <button
                            type="button"
                            onClick={() =>
                                window.location.reload()
                            }
                            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Kiểm tra lại
                        </button>
                    )}
                </div>
            </section>
        </main>
    )
}