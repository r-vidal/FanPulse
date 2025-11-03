import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <span className="font-semibold">Early Access</span>
              <span className="text-sm opacity-90">Launch Target: Q1 2026</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Transform Data Into
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
                Artist Growth
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              The intelligence layer for music managers and independent artists
            </p>

            <p className="text-lg text-blue-200 mb-10 max-w-2xl mx-auto">
              Leverage predictive analytics, momentum tracking, and AI-powered insights to make data-driven decisions for your artists' careers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed for music managers, labels, and independent artists who want to make informed decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Momentum Tracking</h3>
              <p className="text-gray-700 leading-relaxed">
                Real-time momentum scores based on streaming velocity, social growth, and engagement metrics. Know when your artist is trending up.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border border-purple-200 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Superfan Analysis</h3>
              <p className="text-gray-700 leading-relaxed">
                Identify and analyze your top 100 fans across platforms. Understand who drives engagement and how to activate them.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl border border-pink-200 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-pink-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Revenue Forecasting</h3>
              <p className="text-gray-700 leading-relaxed">
                AI-powered predictions for streaming revenue 3-12 months ahead. Plan tours, releases, and budgets with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple Setup, Powerful Results
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and start making data-driven decisions today.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect Your Artists</h3>
              <p className="text-gray-600">
                Import artists from Spotify. Connect Instagram, YouTube, and other platforms with one click.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Automated Data Collection</h3>
              <p className="text-gray-600">
                We automatically sync streaming data, social metrics, and engagement stats daily.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Actionable Insights</h3>
              <p className="text-gray-600">
                View momentum scores, revenue forecasts, and optimization recommendations in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Amplify Your Artists?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join music managers and independent artists who are using data to drive growth. Start your free trial today.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Start Free Trial
          </Link>
          <p className="mt-6 text-blue-200 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">FanPulse</h3>
              <p className="text-gray-400">
                The intelligence layer for music managers. Transform data into growth.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/roadmap" className="hover:text-white transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>&copy; 2025 FanPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
