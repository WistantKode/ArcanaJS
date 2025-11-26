# ArcanaJS Framework

ArcanaJS is a modern React framework for building server-side rendered (SSR) applications with ease. It combines the power of Express, React, TypeScript, and Tailwind CSS v4 to provide a seamless development experience.

## Features

- **Server-Side Rendering (SSR):** Fast initial load times and SEO-friendly pages.
- **TypeScript Support:** Built with TypeScript for type safety and better developer experience.
- **File-based Routing:** Intuitive routing based on your file structure.
- **Hot Module Replacement (HMR):** Fast development cycle with instant updates.
- **Tailwind CSS v4:** Integrated support for the latest Tailwind CSS with CSS-first configuration.
- **Zero Configuration:** Get started quickly with sensible defaults.

## Quick Start

### Installation

```bash
npm install arcanajs
```

### Initialize a New Project

```bash
npx arcanajs init
```

This creates the following structure:
```
your-project/
├── src/
│   ├── client/
│   │   └── index.tsx          # Client-side entry point
│   ├── server/
│   │   └── index.ts           # Server-side entry point
│   ├── views/
│   │   └── Home.tsx           # Your first page component
│   └── globals.css            # Tailwind CSS styles and theme
├── postcss.config.js          # PostCSS configuration
└── package.json
```

### Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## Tailwind CSS v4 Integration

ArcanaJS comes with Tailwind CSS v4 pre-configured. Unlike previous versions, Tailwind v4 uses CSS-first configuration.

### Theme Customization

Edit `src/globals.css` to customize your theme:

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --font-family-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --spacing-custom: 2.5rem;
}
```

### Using Tailwind Classes

Use Tailwind utility classes directly in your components:

```tsx
export default function MyComponent() {
  return (
    <div className="bg-primary text-white p-custom rounded-lg">
      <h1 className="text-2xl font-bold">Hello Tailwind v4!</h1>
    </div>
  );
}
```

### Custom Components

Define reusable component styles in your `globals.css`:

```css
.btn {
  @apply px-4 py-2 rounded font-medium transition-colors;
}

.btn-primary {
  @apply btn bg-blue-600 text-white hover:bg-blue-700;
}
```

## Views and Routing

Create pages by adding components to the `src/views/` directory:

```tsx
// src/views/About.tsx
import { Page, Head, Body } from 'arcanajs';

export default function About() {
  return (
    <Page>
      <Head>
        <title>About Us</title>
      </Head>
      <Body>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">About Us</h1>
        </div>
      </Body>
    </Page>
  );
}
```

The page will automatically be available at `/About`.

## Server Configuration

Customize your server in `src/server/index.ts`:

```tsx
import express from 'express';
import { createArcanaServer } from 'arcanajs/server';

const app = express();
const server = createArcanaServer(app, {
  // Custom configuration options
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 ArcanaJS server running on http://localhost:${PORT}`);
});
```

## Available Commands

- `arcanajs init` - Initialize a new ArcanaJS project
- `arcanajs dev` - Start development server with hot reload
- `arcanajs build` - Build for production
- `arcanajs start` - Start production server

## Components

ArcanaJS provides several built-in components:

- `<Page>` - Wrapper component for pages
- `<Head>` - Document head management
- `<Body>` - Body content wrapper
- `<Link>` - Client-side navigation
- `<NavLink>` - Navigation link with active state

## Hooks

- `useRouter()` - Access router functionality
- `useLocation()` - Get current location
- `useParams()` - Get URL parameters
- `useQuery()` - Get query parameters
- `usePage()` - Access page context
- `useHead()` - Manage document head

## License

MIT
