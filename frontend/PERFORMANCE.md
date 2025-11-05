# 📊 FanPulse - Performance & Monitoring

## Performance Budgets

### Core Web Vitals Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | TBD | 🟡 Pending |
| **FID** (First Input Delay) | < 100ms | TBD | 🟡 Pending |
| **CLS** (Cumulative Layout Shift) | < 0.1 | TBD | 🟡 Pending |
| **TTI** (Time to Interactive) | < 3.8s | TBD | 🟡 Pending |
| **FCP** (First Contentful Paint) | < 2.0s | TBD | 🟡 Pending |
| **TBT** (Total Blocking Time) | < 300ms | TBD | 🟡 Pending |

### Performance Score Goals

- **Performance**: > 90/100
- **Accessibility**: > 90/100
- **Best Practices**: > 90/100
- **SEO**: > 90/100

---

## Monitoring Stack

### 1. Vercel Analytics

**Status:** ✅ Configured

**What it tracks:**
- Page views
- User sessions
- Geographic distribution
- Device types
- Performance metrics (Core Web Vitals)
- Real User Monitoring (RUM)

**Setup:**
```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Access:** Vercel Dashboard → Your Project → Analytics tab

---

### 2. Sentry Error Tracking

**Status:** ✅ Configured

**What it tracks:**
- JavaScript errors
- API errors
- Performance issues
- User sessions with errors
- Source maps for debugging
- Session replays (10% sample rate)

**Configuration:**
- `sentry.client.config.ts` - Client-side errors
- `sentry.server.config.ts` - Server-side errors
- Session Replay enabled (10% of sessions)
- Error replay capture (100% of errors)

**Environment Variables:**
```bash
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
SENTRY_AUTH_TOKEN=your_token_here
```

**Access:** https://sentry.io → Your Organization → FanPulse project

---

### 3. Lighthouse CI

**Status:** ✅ Configured

**What it tests:**
- Performance scores
- Accessibility compliance
- Best practices
- SEO optimization
- Progressive Web App (PWA) readiness

**Configuration:** `lighthouserc.json`

**Runs automatically on:**
- Every pull request
- Every push to main/master
- Can run locally: `npx @lhci/cli@0.12.x autorun`

**GitHub Action:** `.github/workflows/lighthouse.yml`

---

## Performance Optimization Checklist

### ✅ Implemented

- [x] Image optimization with Next.js `<Image>`
- [x] Code splitting with Next.js App Router
- [x] React Server Components where possible
- [x] TailwindCSS with JIT compiler
- [x] Dark mode without layout shift
- [x] Skeleton loading states (no CLS)
- [x] Lazy loading images
- [x] Font optimization (next/font)

### 🔜 To Implement

- [ ] Service Worker for offline support
- [ ] Preload critical resources
- [ ] Resource hints (preconnect, dns-prefetch)
- [ ] Bundle size monitoring
- [ ] Image CDN integration
- [ ] API response caching (React Query / SWR)
- [ ] Route prefetching optimization

---

## Bundle Size Targets

### JavaScript Bundles

| Bundle | Max Size | Current | Status |
|--------|----------|---------|--------|
| First Load JS | < 200 KB | TBD | 🟡 Pending |
| Runtime | < 50 KB | TBD | 🟡 Pending |
| Framework | < 150 KB | TBD | 🟡 Pending |
| Pages/Routes | < 100 KB | TBD | 🟡 Pending |

**Check bundle size:**
```bash
npm run build
# Check .next/analyze output
```

---

## Monitoring Alerts

### Critical Alerts (Immediate Action)

- LCP > 4.0s (Poor)
- FID > 300ms (Poor)
- CLS > 0.25 (Poor)
- Error rate > 5%
- API latency > 1000ms

### Warning Alerts (Review Required)

- LCP > 2.5s (Needs improvement)
- FID > 100ms (Needs improvement)
- CLS > 0.1 (Needs improvement)
- Error rate > 1%
- API latency > 500ms

---

## Testing Performance Locally

### 1. Lighthouse (Chrome DevTools)

```bash
# Open Chrome DevTools → Lighthouse tab
# Select categories: Performance, Accessibility, Best Practices, SEO
# Click "Analyze page load"
```

### 2. WebPageTest

```bash
# Visit https://www.webpagetest.org/
# Enter URL: http://localhost:3000
# Select location: Paris, France
# Run test
```

### 3. Chrome User Experience Report (CrUX)

```bash
# Check real-world performance data
# Visit https://developers.google.com/speed/pagespeed/insights/
# Enter production URL
```

---

## Performance Best Practices

### Images

```tsx
// ✅ Good - Optimized
import Image from 'next/image'

<Image
  src="/artist.jpg"
  width={400}
  height={400}
  alt="Artist"
  priority // For above-the-fold images
/>

// ❌ Bad - Not optimized
<img src="/artist.jpg" alt="Artist" />
```

### Fonts

```tsx
// ✅ Good - next/font
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

// ❌ Bad - Google Fonts CDN
<link href="https://fonts.googleapis.com/..." />
```

### Data Fetching

```tsx
// ✅ Good - React Server Components
async function DashboardPage() {
  const data = await fetch('...')
  return <div>{data}</div>
}

// ❌ Bad - Client-side only
'use client'
function DashboardPage() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch('...') }, [])
}
```

### Code Splitting

```tsx
// ✅ Good - Dynamic import
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
})

// ❌ Bad - Import everything
import { HeavyComponent } from './all-components'
```

---

## Deployment Checklist

### Before Deploy

- [ ] Run `npm run build` - Check for errors
- [ ] Run Lighthouse locally - Score > 90
- [ ] Test on slow 3G network
- [ ] Test on mobile devices
- [ ] Check bundle sizes (< 200KB first load)
- [ ] Verify all images optimized
- [ ] Test dark mode (no CLS)

### After Deploy

- [ ] Verify Vercel Analytics working
- [ ] Verify Sentry capturing errors
- [ ] Check Core Web Vitals (Vercel dashboard)
- [ ] Monitor error rate (Sentry dashboard)
- [ ] Check real-world performance (PSI)

---

## Resources

- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Lighthouse CI Docs](https://github.com/GoogleChrome/lighthouse-ci)
- [Web.dev Performance](https://web.dev/performance/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

---

## Contact

For performance issues or questions, contact: rodolphe@fanpulse.io
