# FanPulse Frontend

Next.js 14 frontend for FanPulse music analytics platform.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching & caching
- **Zustand** - State management
- **Recharts** - Data visualization
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js 14 app directory
│   ├── layout.tsx   # Root layout
│   └── page.tsx     # Home page
├── components/       # React components
├── lib/             # API client & utilities
├── hooks/           # Custom React hooks
├── types/           # TypeScript types
└── styles/          # Global styles
```

## Environment Variables

Copy `.env.example` to `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Lint code
- `npm run type-check` - TypeScript type checking

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
