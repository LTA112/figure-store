import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-5xl">

        <header>
          {/* Top bar: logo, centered search, icons */}
          <div className="border-b">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center justify-between h-14">
                <div className="flex items-center">
                  <div className="rounded-full bg-blue-600 px-4 py-1 text-white font-bold">Vitoy</div>
                </div>

                <div className="flex-1 flex justify-center">
                  <div className="w-full max-w-sm">
                    <div className="relative">
                      <input
                        className="w-full rounded-full border px-4 py-2 text-sm outline-none"
                        placeholder="The Sticky"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg">🎧</span>
                  <span className="text-lg">👤</span>
                  <span className="text-lg">♡</span>
                  <span className="text-lg">🛍0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Centered nav links below */}
          <nav className="bg-white border-b">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex justify-center gap-10 py-3 text-sm font-medium">
                <Link to="/" className="font-semibold">Trang chủ</Link>
                <Link to="/products">Nhân vật</Link>
                <span>Danh mục</span>
                <span>Mới & hot</span>
                <span>Thế giới Vitoy</span>
              </div>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero */}
          <section className="bg-green-50 py-16 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex gap-4">
                <div className="h-64 w-36 rounded-lg bg-white/70 shadow flex items-center justify-center">Figure front</div>
                <div className="h-64 w-36 rounded-lg bg-white/70 shadow flex items-center justify-center">Figure back</div>
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold">The Sticky</h1>
                <p className="mt-4 text-sm text-gray-600">VITOY brings Vietnamese cuisine to life as collectible art toys.</p>
              </div>
            </div>
          </section>

          {/* Characters header */}
          <section className="py-12 text-center">
            <h2 className="text-3xl font-extrabold">Nhân vật</h2>
            <div className="mt-6 flex justify-center gap-8 text-lg font-bold">
              <span className="border-b-2 border-black pb-1">The Sticky</span>
              <span className="text-gray-400">Coming Soon</span>
            </div>
          </section>

          {/* Description + side image */}
          <section className="bg-blue-50 py-10 px-6">
            <div className="md:flex md:gap-8">
              <div className="md:flex-1">
                <h3 className="text-2xl font-extrabold">The Sticky</h3>
                <p className="mt-4 text-sm text-gray-700 leading-relaxed max-w-prose">
                  The Sticky là bộ sưu tập art toy lấy cảm hứng từ nếp – linh hồn mềm dẻo của ẩm thực Việt Nam.
                </p>
                <p className="mt-3 text-sm text-gray-700 leading-relaxed max-w-prose">Mềm. Dẻo. Gắn kết. That’s The Sticky.</p>
              </div>

              <div className="mt-6 md:mt-0 md:w-40 flex items-start justify-center">
                <div className="h-40 w-28 rounded-lg bg-white shadow flex items-center justify-center">Figure</div>
              </div>
            </div>

            {/* Product cards */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="mx-auto h-80 w-64 rounded-xl bg-white shadow flex items-center justify-center">Figure 1</div>
                <p className="mt-4 font-medium">Mô hình nhân vật Bát Ít Nhỏ</p>
              </div>

              <div className="text-center">
                <div className="mx-auto h-80 w-64 rounded-xl bg-white shadow flex items-center justify-center">Figure 2</div>
                <p className="mt-4 font-medium">Mô hình nhân vật Bé Xôi Xinh</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button className="rounded-full bg-white px-6 py-2 font-semibold shadow">Xem thêm</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}