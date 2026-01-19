# Installed Libraries and Dependencies

## Summary of Important Libraries

As requested, here's a summary of all the important libraries installed for this project:

### Core Framework
- **react** (^18.3.1) - UI framework
- **react-dom** (^18.3.1) - React DOM rendering
- **react-router-dom** (^6.28.0) - Client-side routing

### State Management
- **zustand** (^5.0.2) - Lightweight state management (alternative to Redux)

### UI Components
- **@radix-ui/react-radio-group** (^1.2.2) - Accessible radio button components
- **@radix-ui/react-dialog** (^1.1.2) - Modal/dialog components
- **@radix-ui/react-select** (^2.1.4) - Dropdown select components
- **@radix-ui/react-tabs** (^1.1.1) - Tab navigation components
- **@radix-ui/react-scroll-area** (^1.2.2) - Custom scrollable areas

### Styling
- **tailwindcss** (^3.4.17) - Utility-first CSS framework
- **tailwindcss-animate** (^1.0.7) - Animation utilities for Tailwind
- **class-variance-authority** (^0.7.1) - Dynamic class name generation
- **clsx** (^2.1.1) - Utility for constructing className strings
- **tailwind-merge** (^2.6.0) - Merge Tailwind classes without conflicts

### Icons
- **lucide-react** (^0.469.0) - Beautiful icon library (replaces react-icons)

### Form Handling
- **react-hook-form** (^7.54.2) - Performant form management
- **zod** (^3.24.1) - TypeScript-first schema validation
- **@hookform/resolvers** (^3.9.1) - Form validation resolvers

### Development
- **typescript** (^5.6.2) - Type safety
- **vite** (^6.0.5) - Fast build tool and dev server
- **@vitejs/plugin-react** (^4.3.4) - React plugin for Vite
- **eslint** (^9.17.0) - Code linting

## Library Purposes

### Why Zustand?
- Very lightweight (~3KB)
- Simple API, no boilerplate
- Perfect for small to medium apps
- TypeScript-friendly

### Why Radix UI?
- Unstyled, accessible components
- Full keyboard navigation support
- ARIA-compliant
- Works perfectly with Tailwind CSS
- Used by shadcn/ui under the hood

### Why Tailwind CSS?
- Rapid UI development
- Consistent design system
- Small bundle size (purges unused styles)
- Easy to customize
- Industry standard

### Why React Hook Form + Zod?
- Better performance than Formik
- Built-in validation with Zod schemas
- Type-safe forms
- Less re-renders

### Why Lucide React?
- Modern, consistent icon set
- Tree-shakeable (only imports icons you use)
- SVG-based, scalable
- Large library (1000+ icons)

## External APIs

### Claude API (Anthropic)
- **Purpose**: Convert passage images to text
- **Model**: claude-3-5-sonnet-20241022
- **Cost**: Pay-per-use (check Anthropic pricing)
- **Alternative**: Can use manual text entry instead

## Bundle Size Considerations

All libraries were chosen for:
1. **Small bundle size** - Most are <10KB gzipped
2. **Tree-shaking support** - Only bundle what you use
3. **TypeScript support** - Full type definitions
4. **Active maintenance** - Regular updates and community support

## No Backend Libraries Included

Currently, the app uses:
- **LocalStorage** for data persistence
- **No database** integration yet
- **No authentication** library yet

When you're ready to add a backend, recommended options:
- **Supabase** - PostgreSQL with real-time features
- **Firebase** - Google's platform
- **Prisma + tRPC** - Type-safe API layer
- **TanStack Query** - Server state management

## Development Dependencies

Only essential dev dependencies included:
- TypeScript compiler
- Vite for bundling
- ESLint for code quality
- Tailwind CSS compiler
- PostCSS for CSS processing

## Total Package Size

Approximate installed size: ~200MB (including node_modules)
Production bundle size: ~150-200KB gzipped

## Security Notes

1. **No vulnerabilities** in installed packages (as of installation)
2. **API key** must be secured (use backend proxy in production)
3. All packages from **trusted sources** (npm registry)
4. Regular updates recommended for security patches

## Useful Commands

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Audit security
npm audit

# View dependency tree
npm list --depth=0

# Check bundle size
npm run build
npx vite-bundle-visualizer
```

## Notes for Supervisor

All libraries are:
✅ Well-maintained and popular
✅ Production-ready
✅ TypeScript-friendly
✅ Documented extensively
✅ Have active communities

No experimental or unstable packages were used.

