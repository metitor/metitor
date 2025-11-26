# Metior

An elegant, open-source platform for exploring startup and funding data with a powerful plugin system.

## ✨ Features

- **Clean, Modern UI** - Elegant white theme with smooth transitions
- **Company Profiles** - Detailed company information with funding history
- **Investor Profiles** - Explore investor portfolios and investment patterns
- **Advanced Search** - Fast, powerful search across companies and investors
- **Analytics Dashboard** - Visualize funding trends and market insights
- **Plugin System** - Extend functionality with 20+ available plugins
- **Better Auth Integration** - Secure authentication with email/password
- **RESTful API** - Complete API with Swagger documentation

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Setup database
docker-compose up -d
pnpm prisma generate
pnpm prisma db push

# Seed sample data
pnpm run seed

# Start development server
pnpm dev
```

Visit http://localhost:3000

**Demo Account:**
- Email: `demo@example.com`
- Password: `password123`

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Better Auth
- **UI**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Vitest, Playwright, fast-check

## 🔌 Plugin System

Metior features a powerful plugin architecture with 20+ available plugins:

### Installed Plugins
- **Analytics Plugin** - Funding trend visualizations
- **Welcome Banner Plugin** - Friendly welcome messages

### Available Better Auth Plugins

**Authentication:**
- Two-Factor Authentication (2FA)
- Passkey Authentication
- Magic Link
- Email OTP
- Phone Number
- Username
- Anonymous
- Generic OAuth
- One Tap

**Security:**
- Have I Been Pwned
- Captcha

**Management:**
- Organization Management
- Admin Panel
- Multi Session

**API:**
- Bearer Token
- JWT
- API Key

**Enterprise:**
- SSO (Single Sign-On)
- SCIM

**Payments:**
- Stripe
- Polar

Visit `/plugins` to see all available plugins and installation instructions.

### Creating Custom Plugins

```typescript
// plugins/my-plugin/index.tsx
const myPlugin: Plugin = {
  name: "my-plugin",
  version: "1.0.0",
  register: async (api: PluginAPI) => {
    // Add custom routes
    api.registerRoute("/my-page", MyComponent);
    
    // Inject UI components
    api.registerSlot("CompanyProfile.Details", MyWidget);
    
    // Access database
    const data = await api.db.object.findMany();
  },
};
```

## 📊 Sample Data

Run `pnpm run seed` to populate with:
- 3 companies (Facebook, Google, Stripe)
- 2 investors (Sequoia Capital, Andreessen Horowitz)
- Funding rounds and investments
- Office locations

## 🧪 Testing

```bash
pnpm test              # Run unit tests
pnpm test:watch        # Run tests in watch mode
pnpm test:e2e          # Run end-to-end tests
```

## � Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm run seed` - Seed sample data
- `pnpm prisma studio` - Open database GUI

## 🌐 API Documentation

Interactive API documentation:
- **Swagger UI**: http://localhost:3000/docs-api
- **OpenAPI JSON**: http://localhost:3000/api/docs

## 🎨 Design System

- **Clean white theme** - Professional, elegant design
- **Consistent spacing** - 4px, 8px, 12px, 16px grid
- **Typography** - Clear hierarchy with bold headings
- **Borders** - Subtle gray borders (gray-100, gray-200)
- **Hover states** - Smooth transitions to gray-900
- **Rounded corners** - xl (12px) for cards, lg (8px) for buttons

## 🔐 Authentication

Powered by Better Auth with:
- Email & Password authentication
- Secure session management
- 7-day session expiration
- Cookie-based authentication
- Easy to extend with 20+ plugins

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication by [Better Auth](https://www.better-auth.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
