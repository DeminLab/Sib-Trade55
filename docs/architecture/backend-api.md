# Backend API migration boundary

Sib-Trade55 keeps the current JSON repositories as the local content source and exposes a second, typed adapter layer for the future backend.

## Runtime flow

```text
React UI / Server Component
        ↓
domain repository or service interface
        ↓
typed API adapter (`src/lib/repositories/api-*`)
        ↓
Next API route or external backend API
        ↓
backend application services
        ↓
PostgreSQL / object storage / payment provider
```

React components must not import database clients, SQL, or storage SDKs. They should receive domain data from repository/service functions only.

## Repository selection

- Existing JSON implementations remain the default for public catalog and CMS pages.
- API implementations are available from `src/lib/repositories/api-repositories.ts`.
- `apiRepositoryRegistry` is the single typed registry for the API adapters.
- Switching a surface from JSON to API means changing the composition/export boundary, not rewriting the UI.
- `api-client.ts` supports a configurable `NEXT_PUBLIC_API_BASE_URL`, injected `fetcher`, credentials, pagination, filters, search, and multi-field sorting.

## Domain contracts

`src/types/index.ts` contains contracts for Product, Category, ProductVariant, Customer, Company, Order, OrderItem, QuoteRequest, Quote, Case, CaseImage, Review, ContactRequest, and File. Existing names such as `OrderLineItem` and `CaseProjectImage` remain as aliases for current UI compatibility.

## Query contract

Repositories use `RepositoryQuery<TFilters>` with:

- `pagination`: page and limit;
- `filters`: resource-specific typed filters;
- `search`: full-text query passed to the backend;
- `sort`: one or more `{ field, order }` values.

The API adapter serializes these values into URL parameters. The backend owns validation, authorization, filtering, sorting, and pagination totals.

## Authentication and RBAC

`AuthContext` carries user, customer/company, roles, permissions, and session expiry. `authorizationService` provides a small policy boundary for UI hints and service-level checks. Backend endpoints remain the source of truth and must repeat authorization checks server-side.

## Files

`FileRepository` models a two-step upload: request an upload through `createUpload`, upload/complete through the backend or object storage flow, then call `completeUpload`. The UI only handles `File`/`Blob` and never receives database or storage credentials.

## Orders and quotes

`ApiOrderRepository` owns order listing, creation, and status changes. `QuoteRequestRepository` owns B2B request lifecycle; `QuoteRepository` owns the generated commercial proposal lifecycle. Admin actions should call these repositories rather than mutating Zustand or browser storage.

## PostgreSQL mapping direction

The backend can map these contracts to separate aggregates/tables such as products, product_variants, categories, customers, companies, orders, order_items, quote_requests, quotes, cases, case_images, reviews, contact_requests, and files. This repository layer intentionally contains no SQL or database assumptions.
