# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Multi-tenant SaaS template with authentication, billing, organizations, lead management, and AI chat.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict)
- **API**: tRPC v11 for type-safe APIs
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth (organizations, 2FA, Google OAuth)
- **Billing**: Stripe (subscriptions, per-seat, one-time)
- **UI**: Tailwind CSS 4, Shadcn UI, Radix, Lucide React
- **Forms**: React Hook Form + Zod
- **Email**: Resend + React Email
- **Testing**: Vitest (unit), Playwright (E2E)

## Essential Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run db:migrate    # Run migrations
npm run db:studio     # Drizzle Studio GUI
npm run db:generate   # Generate migration
npm run lint          # Biome linter
npm run typecheck     # Type check
npm run test          # Unit tests
npm run e2e           # E2E tests
```

## Project Structure

```
app/
├── (marketing)/          # Public pages
├── (saas)/
│   ├── auth/             # Sign in/up
│   └── dashboard/        # Protected app
│       ├── admin/        # Platform admin
│       └── organization/ # Org features
└── api/                  # API routes
components/               # React components
config/                   # App, auth, billing config
lib/
├── auth/                 # Better Auth
├── billing/              # Stripe
├── db/schema/            # Drizzle schema
└── email/                # Email templates
schemas/                  # Zod schemas
trpc/routers/             # tRPC endpoints
```

## Core Patterns

### tRPC Procedures

```typescript
publicProcedure; // No auth
protectedProcedure; // Requires login
protectedAdminProcedure; // Requires platform admin
protectedOrganizationProcedure; // Requires org membership
```

### Multi-Tenant Data (CRITICAL)

Always filter by organization:

```typescript
// ✅ CORRECT
const leads = await db.query.leadTable.findMany({
  where: eq(leadTable.organizationId, ctx.organization.id),
});

// ❌ WRONG - Data leak
const leads = await db.query.leadTable.findMany();
```

### Role System

1. **Platform Role** (`user.role`): `user` | `admin`
2. **Organization Role** (`member.role`): `owner` | `admin` | `member`

```typescript
// Platform admin
if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

// Org admin
if (ctx.membership.role !== "owner" && ctx.membership.role !== "admin") {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

### Authentication

```typescript
// Client
import { useSession } from "@/hooks/use-session";
const { user, isPending } = useSession();

// Server
import { getSession } from "@/lib/auth/server";
const session = await getSession();
```

### Forms

```typescript
import { useZodForm } from "@/hooks/use-zod-form";
const form = useZodForm({ schema, defaultValues: {} });
```

### Logging (Object first, message second)

```typescript
import { logger } from "@/lib/logger";
logger.info({ userId, action }, "User performed action");
logger.error({ error }, "Operation failed");
// NEVER use console.log
```

## Code Style

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions: `camelCase`
- Never use `any` - use `unknown` or proper types
- Use existing UI from `@/components/ui/`
- All inputs validated with Zod

## Key Files

| File                       | Purpose         |
| -------------------------- | --------------- |
| `config/app.config.ts`     | App settings    |
| `config/billing.config.ts` | Plans, pricing  |
| `lib/db/schema/tables.ts`  | Database schema |
| `trpc/init.ts`             | tRPC setup      |

## Internationalization (i18n)

All user-facing text must be translated. Never hardcode strings in components.

### Translation Files

```
messages/
├── es/           # Spanish (primary)
│   ├── common.json
│   ├── auth.json
│   ├── dashboard.json
│   ├── organization.json
│   ├── training.json
│   └── ...
└── en/           # English
    └── ...
```

### Using Translations

```typescript
// Server components
import { getTranslations } from "next-intl/server";
const t = await getTranslations("namespace");

// Client components
import { useTranslations } from "next-intl";
const t = useTranslations("namespace");

// Usage
<h1>{t("title")}</h1>
<p>{t("description", { name: user.name })}</p>
```

### Adding New Translations

1. Add keys to both `messages/es/*.json` and `messages/en/*.json`
2. Use nested keys for organization: `"section.subsection.key"`
3. Use ICU format for plurals: `"{count, plural, one {item} other {items}}"`

## Type Safety (CRITICAL)

**Always run typecheck after making changes:**

```bash
npm run typecheck
```

### Common Practices

- Run `npm run typecheck` after modifying components, schemas, or tRPC routers
- Fix all TypeScript errors before committing
- Never use `@ts-ignore` or `any` - find proper types
- Use `unknown` for truly unknown types, then narrow with type guards

## Before Committing

```bash
npm run lint && npm run typecheck
```

Never use `--no-verify` to skip hooks.

## Related Docs

- [AGENTS.md](./AGENTS.md) - Full guidelines
- [ROLES.md](./ROLES.md) - Role system
- [QUICKSTART.md](./QUICKSTART.md) - Setup guide
