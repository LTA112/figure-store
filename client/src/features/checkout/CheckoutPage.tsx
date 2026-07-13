import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import {
    createAddress,
    createOrder,
    createPaymentUrl,
    getAddresses,
    updateAddress,
} from '../orders/orderAPI'

import type {
    Address,
    CreateAddressRequest,
    PaymentMethod,
} from '../orders/orderTypes'

import {
    getVietnamProvinces,
    type VietnamProvince,
} from './vietnamAddressAPI'

const EMPTY_ADDRESS_FORM: CreateAddressRequest =
    {
        label: 'Nhà',
        recipientName: '',
        phone: '',
        province: '',
        district: '',
        ward: '',
        detailAddress: '',
        defaultAddress: true,
    }

function getErrorMessage(
    error: any,
    fallback: string,
): string {
    const responseMessage =
        error?.response?.data?.message

    if (typeof responseMessage === 'string') {
        return responseMessage
    }

    if (error instanceof Error) {
        return error.message
    }

    return fallback
}

function validateAddressForm(
    form: CreateAddressRequest,
): string {
    if (!form.recipientName.trim()) {
        return 'Bạn chưa nhập tên người nhận'
    }

    const normalizedPhone =
        form.phone.replace(/\s/g, '')

    if (
        !/^(0|\+84)[0-9]{9,10}$/.test(
            normalizedPhone,
        )
    ) {
        return 'Số điện thoại không hợp lệ'
    }

    if (!form.province.trim()) {
        return 'Bạn chưa chọn tỉnh hoặc thành phố'
    }

    if (!form.ward.trim()) {
        return 'Bạn chưa chọn phường hoặc xã'
    }

    if (!form.detailAddress.trim()) {
        return 'Bạn chưa nhập số nhà hoặc tên đường'
    }

    return ''
}

export default function CheckoutPage() {
    const navigate = useNavigate()

    const [addresses, setAddresses] =
        useState<Address[]>([])

    const [selectedAddressId, setSelectedAddressId] =
        useState<number>()

    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>('COD')

    const [note, setNote] = useState('')
    const [error, setError] = useState('')
    const [addressError, setAddressError] =
        useState('')

    const [loadingAddresses, setLoadingAddresses] =
        useState(true)

    const [loadingLocations, setLoadingLocations] =
        useState(true)

    const [savingAddress, setSavingAddress] =
        useState(false)

    const [submittingOrder, setSubmittingOrder] =
        useState(false)

    const [showAddressForm, setShowAddressForm] =
        useState(false)

    const [editingAddressId, setEditingAddressId] =
        useState<number | null>(null)

    const [provinces, setProvinces] = useState<
        VietnamProvince[]
    >([])

    const [selectedProvinceCode, setSelectedProvinceCode] =
        useState('')

    const [form, setForm] =
        useState<CreateAddressRequest>(
            EMPTY_ADDRESS_FORM,
        )

    const selectedProvince = useMemo(
        () =>
            provinces.find(
                (province) =>
                    String(province.code) ===
                    selectedProvinceCode,
            ),
        [provinces, selectedProvinceCode],
    )

    const wards = useMemo(
        () => selectedProvince?.wards ?? [],
        [selectedProvince],
    )

    useEffect(() => {
        async function loadAddresses() {
            setLoadingAddresses(true)

            try {
                const addressList =
                    await getAddresses()

                setAddresses(addressList)

                const defaultAddress =
                    addressList.find(
                        (address) =>
                            address.defaultAddress,
                    )

                setSelectedAddressId(
                    defaultAddress?.id ??
                    addressList[0]?.id,
                )

                if (addressList.length === 0) {
                    setShowAddressForm(true)
                }
            } catch (loadError) {
                setError(
                    getErrorMessage(
                        loadError,
                        'Không tải được địa chỉ giao hàng',
                    ),
                )
            } finally {
                setLoadingAddresses(false)
            }
        }

        loadAddresses()
    }, [])

    useEffect(() => {
        async function loadVietnamLocations() {
            setLoadingLocations(true)

            try {
                const locationData =
                    await getVietnamProvinces()

                setProvinces(locationData)
            } catch (loadError) {
                setAddressError(
                    getErrorMessage(
                        loadError,
                        'Không tải được danh sách tỉnh thành',
                    ),
                )
            } finally {
                setLoadingLocations(false)
            }
        }

        loadVietnamLocations()
    }, [])

    function updateForm<
        K extends keyof CreateAddressRequest,
    >(
        key: K,
        value: CreateAddressRequest[K],
    ) {
        setForm((currentForm) => ({
            ...currentForm,
            [key]: value,
        }))
    }

    function handleProvinceChange(
        provinceCode: string,
    ) {
        setSelectedProvinceCode(provinceCode)

        const province = provinces.find(
            (item) =>
                String(item.code) === provinceCode,
        )

        setForm((currentForm) => ({
            ...currentForm,
            province: province?.name ?? '',
            district: '',
            ward: '',
        }))
    }

    function resetAddressForm() {
        setEditingAddressId(null)
        setForm({
            ...EMPTY_ADDRESS_FORM,
            defaultAddress:
                addresses.length === 0,
        })

        setSelectedProvinceCode('')
        setAddressError('')
    }

    function handleEditAddress(address: Address) {
        const matchedProvince = provinces.find(
            (province) =>
                province.name.trim().toLowerCase() ===
                address.province.trim().toLowerCase(),
        )

        setEditingAddressId(address.id)
        setSelectedAddressId(address.id)
        setSelectedProvinceCode(
            matchedProvince ? String(matchedProvince.code) : '',
        )
        setForm({
            label: address.label,
            recipientName: address.recipientName,
            phone: address.phone,
            province: address.province,
            district: address.district ?? '',
            ward: address.ward,
            detailAddress: address.detailAddress,
            defaultAddress: address.defaultAddress,
        })
        setAddressError('')
        setShowAddressForm(true)
    }

    async function handleAddAddress() {
        setAddressError('')

        const validationMessage =
            validateAddressForm(form)

        if (validationMessage) {
            setAddressError(validationMessage)
            return
        }

        setSavingAddress(true)

        try {
            const payload = {
                ...form,
                recipientName: form.recipientName.trim(),
                phone: form.phone.replace(/\s/g, '').trim(),
                province: form.province.trim(),
                district: form.district.trim(),
                ward: form.ward.trim(),
                detailAddress: form.detailAddress.trim(),
                label: form.label.trim() || 'Nhà',
            }

            const savedAddress = editingAddressId
                ? await updateAddress(editingAddressId, payload)
                : await createAddress(payload)

            setAddresses((currentAddresses) => {
                const normalizedAddresses = form.defaultAddress
                    ? currentAddresses.map((address) => ({
                        ...address,
                        defaultAddress: false,
                    }))
                    : currentAddresses

                if (editingAddressId) {
                    return normalizedAddresses.map((address) =>
                        address.id === savedAddress.id
                            ? savedAddress
                            : address,
                    )
                }

                return [savedAddress, ...normalizedAddresses]
            })

            setSelectedAddressId(savedAddress.id)

            setShowAddressForm(false)
            resetAddressForm()
        } catch (saveError) {
            setAddressError(
                getErrorMessage(
                    saveError,
                    'Không thể lưu địa chỉ',
                ),
            )
        } finally {
            setSavingAddress(false)
        }
    }

    async function handleSubmitOrder() {
        if (!selectedAddressId) {
            setError(
                'Bạn cần chọn hoặc thêm địa chỉ giao hàng',
            )
            return
        }

        setSubmittingOrder(true)
        setError('')

        try {
            const order = await createOrder(
                selectedAddressId,
                paymentMethod,
                note,
            )

            window.dispatchEvent(
                new CustomEvent(
                    'server-cart-updated',
                ),
            )

            if (paymentMethod === 'COD') {
                navigate('/orders', {
                    replace: true,
                })
                return
            }

            const payment =
                await createPaymentUrl(order.id)

            if (!payment.paymentUrl) {
                throw new Error(
                    'Không nhận được đường dẫn thanh toán ZaloPay',
                )
            }

            window.location.assign(
                payment.paymentUrl,
            )
        } catch (submitError) {
            setError(
                getErrorMessage(
                    submitError,
                    'Không thể tạo đơn hàng',
                ),
            )
        } finally {
            setSubmittingOrder(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 py-8">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="mb-7">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#3157d5]">
                        Hoàn tất đơn hàng
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Thanh toán
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Kiểm tra địa chỉ và chọn phương
                        thức thanh toán phù hợp.
                    </p>
                </div>

                {error && (
                    <div
                        className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Địa chỉ giao hàng
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Chọn nơi bạn muốn nhận mô hình.
                                </p>
                            </div>

                            {addresses.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddressForm(
                                            (current) => !current,
                                        )
                                        setAddressError('')
                                        if (!showAddressForm) {
                                            resetAddressForm()
                                        }
                                    }}
                                    className="rounded-xl border border-[#3157d5] px-4 py-2 text-sm font-semibold text-[#3157d5] transition hover:bg-blue-50"
                                >
                                    {showAddressForm
                                        ? 'Đóng'
                                        : '+ Thêm địa chỉ'}
                                </button>
                            )}
                        </div>

                        <div className="p-5 sm:p-7">
                            {loadingAddresses ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                    Đang tải địa chỉ...
                                </div>
                            ) : addresses.length > 0 ? (
                                <div className="space-y-3">
                                    {addresses.map(
                                        (address) => {
                                            const selected =
                                                selectedAddressId ===
                                                address.id

                                            return (
                                                <label
                                                    key={address.id}
                                                    className={`block cursor-pointer rounded-2xl border p-4 transition ${
                                                        selected
                                                            ? 'border-[#3157d5] bg-blue-50/70 ring-1 ring-[#3157d5]'
                                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="radio"
                                                            name="shipping-address"
                                                            checked={selected}
                                                            onChange={() =>
                                                                setSelectedAddressId(
                                                                    address.id,
                                                                )
                                                            }
                                                            className="mt-1 h-4 w-4 accent-[#3157d5]"
                                                        />

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <strong className="text-sm text-slate-900">
                                                                    {
                                                                        address.recipientName
                                                                    }
                                                                </strong>

                                                                <span className="text-slate-300">
                                  |
                                </span>

                                                                <span className="text-sm text-slate-600">
                                  {address.phone}
                                </span>

                                                                {address.defaultAddress && (
                                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-[#3157d5]">
                                    Mặc định
                                  </span>
                                                                )}
                                                            </div>

                                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                                {
                                                                    address.detailAddress
                                                                }
                                                                {address.ward
                                                                    ? `, ${address.ward}`
                                                                    : ''}
                                                                {address.district
                                                                    ? `, ${address.district}`
                                                                    : ''}
                                                                {address.province
                                                                    ? `, ${address.province}`
                                                                    : ''}
                                                            </p>

                                                            <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                {address.label}
                              </span>

                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.preventDefault()
                                                                    event.stopPropagation()
                                                                    handleEditAddress(address)
                                                                }}
                                                                className="ml-3 text-xs font-bold text-[#3157d5] hover:underline"
                                                            >
                                                                Chỉnh sửa
                                                            </button>
                                                        </div>
                                                    </div>
                                                </label>
                                            )
                                        },
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                    <p className="font-semibold text-slate-800">
                                        Bạn chưa có địa chỉ giao hàng
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Thêm địa chỉ để tiếp tục đặt hàng.
                                    </p>
                                </div>
                            )}

                            {showAddressForm && (
                                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                                    <div className="mb-5">
                                        <h3 className="font-bold text-slate-900">
                                            {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Địa chỉ hiện dùng Tỉnh/Thành
                                            phố và Phường/Xã.
                                        </p>
                                    </div>

                                    {addressError && (
                                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                            {addressError}
                                        </div>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                Tên người nhận
                                                <span className="text-red-500">
                          {' '}
                                                    *
                        </span>
                                            </label>

                                            <input
                                                value={
                                                    form.recipientName
                                                }
                                                onChange={(event) =>
                                                    updateForm(
                                                        'recipientName',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ví dụ: Nguyễn Văn An"
                                                autoComplete="name"
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#3157d5] focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                Số điện thoại
                                                <span className="text-red-500">
                          {' '}
                                                    *
                        </span>
                                            </label>

                                            <input
                                                value={form.phone}
                                                onChange={(event) =>
                                                    updateForm(
                                                        'phone',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ví dụ: 0912345678"
                                                inputMode="tel"
                                                autoComplete="tel"
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#3157d5] focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                Tỉnh/Thành phố
                                                <span className="text-red-500">
                          {' '}
                                                    *
                        </span>
                                            </label>

                                            <select
                                                value={
                                                    selectedProvinceCode
                                                }
                                                onChange={(event) =>
                                                    handleProvinceChange(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={loadingLocations}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#3157d5] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            >
                                                <option value="">
                                                    {loadingLocations
                                                        ? 'Đang tải tỉnh thành...'
                                                        : 'Chọn tỉnh/thành phố'}
                                                </option>

                                                {provinces.map(
                                                    (province) => (
                                                        <option
                                                            key={
                                                                province.code
                                                            }
                                                            value={
                                                                province.code
                                                            }
                                                        >
                                                            {province.name}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                Phường/Xã
                                                <span className="text-red-500">
                          {' '}
                                                    *
                        </span>
                                            </label>

                                            <select
                                                value={form.ward}
                                                onChange={(event) =>
                                                    updateForm(
                                                        'ward',
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    !selectedProvinceCode ||
                                                    loadingLocations
                                                }
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#3157d5] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            >
                                                <option value="">
                                                    {!selectedProvinceCode
                                                        ? 'Chọn tỉnh/thành phố trước'
                                                        : 'Chọn phường/xã'}
                                                </option>

                                                {wards.map((ward) => (
                                                    <option
                                                        key={ward.code}
                                                        value={ward.name}
                                                    >
                                                        {ward.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                Số nhà, tên đường
                                                <span className="text-red-500">
                          {' '}
                                                    *
                        </span>
                                            </label>

                                            <input
                                                value={
                                                    form.detailAddress
                                                }
                                                onChange={(event) =>
                                                    updateForm(
                                                        'detailAddress',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Ví dụ: 123 Nguyễn Văn Linh"
                                                autoComplete="street-address"
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#3157d5] focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                Loại địa chỉ
                                            </label>

                                            <select
                                                value={form.label}
                                                onChange={(event) =>
                                                    updateForm(
                                                        'label',
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#3157d5] focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="Nhà">
                                                    Nhà
                                                </option>
                                                <option value="Công ty">
                                                    Công ty
                                                </option>
                                                <option value="Khác">
                                                    Khác
                                                </option>
                                            </select>
                                        </div>

                                        <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-slate-200 bg-white px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    form.defaultAddress
                                                }
                                                onChange={(event) =>
                                                    updateForm(
                                                        'defaultAddress',
                                                        event.target
                                                            .checked,
                                                    )
                                                }
                                                className="h-4 w-4 accent-[#3157d5]"
                                            />

                                            <span className="text-sm font-medium text-slate-700">
                        Đặt làm địa chỉ mặc định
                      </span>
                                        </label>
                                    </div>

                                    <div className="mt-5 flex justify-end gap-3">
                                        {addresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddressForm(
                                                        false,
                                                    )
                                                    resetAddressForm()
                                                }}
                                                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
                                            >
                                                Hủy
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={
                                                handleAddAddress
                                            }
                                            disabled={
                                                savingAddress ||
                                                loadingLocations
                                            }
                                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {savingAddress
                                                ? 'Đang lưu...'
                                                : editingAddressId
                                                    ? 'Cập nhật địa chỉ'
                                                    : 'Lưu địa chỉ'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
                        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                Phương thức thanh toán
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Chọn một trong hai phương thức.
                            </p>
                        </div>

                        <div className="space-y-3 p-5 sm:p-6">
                            <label
                                className={`block cursor-pointer rounded-2xl border p-4 transition ${
                                    paymentMethod === 'COD'
                                        ? 'border-[#3157d5] bg-blue-50/70 ring-1 ring-[#3157d5]'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        checked={
                                            paymentMethod === 'COD'
                                        }
                                        onChange={() =>
                                            setPaymentMethod('COD')
                                        }
                                        className="mt-1 h-4 w-4 accent-[#3157d5]"
                                    />

                                    <div>
                                        <p className="font-bold text-slate-900">
                                            Thanh toán khi nhận hàng
                                        </p>

                                        <p className="mt-1 text-sm leading-5 text-slate-500">
                                            Thanh toán tiền mặt cho đơn
                                            vị giao hàng sau khi nhận
                                            sản phẩm.
                                        </p>
                                    </div>
                                </div>
                            </label>

                            <label
                                className={`block cursor-pointer rounded-2xl border p-4 transition ${
                                    paymentMethod === 'ZALOPAY'
                                        ? 'border-[#3157d5] bg-blue-50/70 ring-1 ring-[#3157d5]'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        checked={
                                            paymentMethod ===
                                            'ZALOPAY'
                                        }
                                        onChange={() =>
                                            setPaymentMethod(
                                                'ZALOPAY',
                                            )
                                        }
                                        className="mt-1 h-4 w-4 accent-[#3157d5]"
                                    />

                                    <div>
                                        <p className="font-bold text-slate-900">
                                            Thanh toán bằng ZaloPay
                                        </p>

                                        <p className="mt-1 text-sm leading-5 text-slate-500">
                                            Thanh toán online qua cổng
                                            ZaloPay an toàn và nhanh
                                            chóng.
                                        </p>
                                    </div>
                                </div>
                            </label>

                            <div className="pt-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Ghi chú cho cửa hàng
                                </label>

                                <textarea
                                    value={note}
                                    onChange={(event) =>
                                        setNote(event.target.value)
                                    }
                                    maxLength={500}
                                    placeholder="Ví dụ: Giao hàng trong giờ hành chính..."
                                    className="min-h-28 w-full resize-none rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-[#3157d5] focus:ring-2 focus:ring-blue-100"
                                />

                                <p className="mt-1 text-right text-xs text-slate-400">
                                    {note.length}/500
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                    ✓
                  </span>

                                    <p className="text-sm leading-6 text-slate-600">
                                        Thông tin nhận hàng chỉ được
                                        sử dụng để xử lý và giao đơn
                                        hàng của bạn.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={
                                    submittingOrder ||
                                    !selectedAddressId
                                }
                                onClick={
                                    handleSubmitOrder
                                }
                                className="w-full rounded-2xl bg-[#3157d5] px-5 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#2848b7] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                            >
                                {submittingOrder
                                    ? 'Đang xử lý...'
                                    : paymentMethod === 'COD'
                                        ? 'Đặt hàng'
                                        : 'Thanh toán bằng ZaloPay'}
                            </button>

                            <p className="text-center text-xs leading-5 text-slate-400">
                                Bằng việc đặt hàng, bạn đồng ý
                                với chính sách mua hàng của cửa
                                hàng.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    )
}