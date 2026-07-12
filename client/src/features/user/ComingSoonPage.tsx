import { Link } from 'react-router-dom'

interface ComingSoonPageProps {
  title: string
  description: string
}

export default function ComingSoonPage({
  title,
  description,
}: ComingSoonPageProps) {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef2ff] text-3xl">
          🧸
        </div>
        <h1 className="mt-5 text-3xl font-extrabold">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-500">
          {description}
        </p>
        <Link
          to="/products"
          className="mt-7 inline-flex rounded-full bg-[#3157d5] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2848b9]"
        >
          Xem sản phẩm
        </Link>
      </div>
    </section>
  )
}
