import { useState } from 'react'
import { registerApi } from './authApi'

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  })

  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const result = await registerApi(form)
      setMessage(result)
    } catch {
      setMessage('Register failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-[400px] bg-white p-6 rounded-xl shadow"
      >
        <h1 className="text-3xl font-bold mb-5">
          Register
        </h1>

        <input
          name="fullName"
          placeholder="Full Name"
          onChange={handleChange}
          className="w-full border p-3 mb-3 rounded"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full border p-3 mb-3 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border p-3 mb-3 rounded"
        />

        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          className="w-full border p-3 mb-5 rounded"
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded">
          Register
        </button>

        <p className="mt-4 text-center">
          {message}
        </p>
      </form>
    </div>
  )
}