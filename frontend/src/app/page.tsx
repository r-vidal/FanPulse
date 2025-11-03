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
        <p className="text-lg text-gray-500 max-w-2xl">
          Transform streaming data into actionable growth strategies using predictive analytics and trading signal algorithms.
        </p>
        <div className="mt-12 flex gap-4 justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Get Started
          </button>
          <button className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-lg font-semibold transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </main>
  )
}
