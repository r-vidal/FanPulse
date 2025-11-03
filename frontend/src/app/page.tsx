import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          🎵 FanPulse
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          The Intelligence Layer for Music Managers
        </p>
        <p className="text-lg text-gray-500 max-w-2xl mb-4">
          Transform streaming data into actionable growth strategies using predictive analytics and trading signal algorithms.
        </p>
        <div className="mb-8 inline-flex items-center gap-2 bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2">
          <span className="text-yellow-800 font-semibold">🚧 MVP Development</span>
          <span className="text-yellow-700 text-sm">Launch Target: Q1 2026</span>
        </div>
        <div className="mt-12 flex gap-4 justify-center">
          <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Get Started
          </Link>
          <Link href="/login" className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-lg font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
