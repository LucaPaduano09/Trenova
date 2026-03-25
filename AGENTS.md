# AGENTS.md

## Project Overview
Trenova is a multi-tenant SaaS platform for personal trainers and their clients.
The platform supports trainer operations, client management, booking flows, workout planning, package handling, and client access from a centralized backend.

Core stack:
- Next.js
- TypeScript
- Prisma ORM
- MongoDB
- Zod
- Tailwind CSS
- NextAuth
- Vercel

## Product Context
Trenova is a product-oriented SaaS, not a generic CRUD app.

Core areas include:
- strict tenant isolation
- role-aware flows for trainer and client experiences
- appointment scheduling and lifecycle management
- workout templates, plans, sessions, and versioning
- package purchases and session-credit logic
- invitation-based client association
- client portal access
- future mobile integration with the same backend

Every implementation should preserve scalability, data integrity, and product consistency.

## Non-Negotiable Rules
- Multi-tenant isolation is mandatory
- Never leak data across tenants
- Never bypass authorization checks
- Never trust client input
- Validate all external input with Zod
- Keep business rules on the server
- Use Prisma for all database access
- Prefer production-safe solutions over shortcuts

## Architecture Rules
- Use TypeScript strictly
- Avoid `any` unless there is no reasonable alternative
- Prefer clear, explicit typing
- Keep domain logic out of presentational UI components
- Keep server logic isolated in actions, services, or route handlers
- Prefer small, composable units over mixed-responsibility files
- Reuse domain utilities instead of duplicating logic
- Preserve consistency with the existing architecture

## Next.js Rules
- Prefer App Router conventions
- Prefer server components by default
- Use client components only when interactivity requires them
- Keep data fetching close to where data is consumed
- Handle loading, empty, and error states intentionally
- Be careful with caching, revalidation, and dynamic rendering
- Avoid unsafe caching assumptions for user-specific or tenant-specific data
- Prefer server actions for mutations when aligned with the current codebase

## Authentication and Authorization Rules
- Respect the existing authentication model
- Keep session-dependent logic on the server
- Resolve tenant context before reading or mutating tenant-bound data
- Enforce role checks where required
- Do not expose sensitive session or tenant data to the client unnecessarily
- Any trainer/client linking flow must be validated and safely scoped

## Database Rules
- MongoDB is the source of truth for persisted data
- Use Prisma for all reads and writes
- Be careful with MongoDB ObjectId expectations and nullability
- Respect existing schema design and relationships
- Do not introduce schema changes casually
- Any schema update must consider:
  - tenant scoping
  - backwards compatibility
  - current production data shape
  - relation integrity
- Prefer predictable queries over clever shortcuts

## Validation Rules
- Use Zod for:
  - form inputs
  - server action inputs
  - route handler payloads
  - URL and query-derived parameters when applicable
  - important domain transformations
- Return user-friendly validation feedback
- Keep schemas close to the relevant domain
- Do not let invalid values reach database logic

## Multi-Tenant Rules
- Every tenant-bound entity must be scoped correctly
- Reads must always consider tenant context when required
- Writes must always verify the current user can act within the target tenant
- Never assume `tenantId` exists unless it has been explicitly resolved
- Be especially careful with:
  - clients
  - appointments
  - workout plans
  - package purchases
  - invitation flows
  - dashboard aggregations

## Domain-Specific Guidance

### Clients
- Client data must remain isolated per tenant
- Linking a client user to a trainer tenant must be explicit and safe
- Invitation flows must be token-based, validated, and expiry-aware
- Status changes should remain predictable

### Appointments / Booking
- Appointment states must remain consistent
- Preserve logic for scheduled, completed, and canceled flows
- Handle date and time carefully
- Avoid breaking dashboard and calendar assumptions
- Payment-related fields must not be updated carelessly

### Packages / Credits
- Package logic must preserve credit integrity
- Ledger-style changes should remain traceable
- Do not allow session-credit drift through unsafe mutations
- Monthly and bundle logic should remain explicit

### Workouts
- Preserve snapshot and versioning behavior where present
- Do not overwrite historical workout context unintentionally
- Keep template, plan, version, and session concerns clearly separated
- Respect the difference between editable definitions and historical snapshots

### Client Portal
- Client-facing flows must remain simple and secure
- Auth, invite, and access flows must not leak trainer-side data
- UX should prioritize clarity and low friction

## Frontend Rules
- Use Tailwind CSS consistently
- Reuse existing design patterns and utility classes when available
- Favor clean, premium, product-oriented UI
- Keep layouts responsive
- Avoid inconsistent styling patterns
- Prefer accessible markup and sensible semantics
- Dashboard UI should prioritize clarity over clutter

## Code Style
- Prefer readability over cleverness
- Use explicit naming
- Avoid deeply nested logic when possible
- Extract repeated logic into utilities, hooks, or services
- Keep components focused on a single responsibility
- Add comments only when intent is not obvious from the code itself

## Performance and Reliability
- Avoid unnecessary client-side state when server-driven state is enough
- Be mindful of expensive queries and repeated aggregations
- Preserve operational reliability over micro-optimizations
- Consider production implications for Vercel deployment and serverless execution
- Prefer robust patterns for async flows, loading states, and failure recovery

## What AI Agents Should Optimize For
- Tenant safety
- Authorization correctness
- Validation-first implementation
- Clean architecture
- Product consistency
- Long-term maintainability
- Scalable SaaS patterns
- Clear UX for both trainers and clients

## What AI Agents Must Avoid
- Cross-tenant data leakage
- Skipping authorization or validation
- Mixing DB logic into UI components
- Introducing fragile hacks
- Breaking historical workout or package assumptions
- Adding inconsistent UI or architectural patterns
- Making unsafe caching assumptions for user-specific data
