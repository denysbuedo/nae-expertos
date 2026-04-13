# Web App Template

> Next.js 14 + TypeScript + TailwindCSS + Zustand

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
npm run test:coverage
```

## Structure

```
web-app/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/
│   │   └── ui/           # Reusable UI components
│   ├── lib/              # Utilities (api, utils)
│   └── stores/           # Zustand state stores
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.js
└── tsconfig.json

```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run unit tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run E2E tests with Playwright

## Agent Usage

**Use `frontend-dev` agent for:**
- Creating new pages in `src/app/`
- Building UI components in `src/components/ui/`
- Styling with TailwindCSS
- Form validation with react-hook-form + zod

**Use `fullstack-dev` agent for:**
- Complete features (UI + API integration)
- Authentication setup
- State management with Zustand
