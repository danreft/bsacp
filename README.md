# Boa Safra Ag — Client Portal (Mockup)

A clickable prototype of the external client portal: clients sign in, see their
engagements, and view or download the documents exchanged during an engagement.
Built to match the visual language of the existing **RFS Next** app — white
cards on a light gray page, dark green primary buttons, serif page headings,
simple bordered tables, and the blue environment banner across the top.

This is a **mockup for stakeholder review**, not production code. There is no
database and no upload flow; clients are read-only.

## Client experience

The home page lists engagements directly. Open one to see requested documents,
preview files, and download final documents. **All documents** provides search
across engagements, with optional filters and bulk download. Account is in the
avatar menu. Engagement details, version history, and owner download activity
expand on demand. Upload and notification placeholders are hidden until those
features are available. Existing `/engagements` bookmarks redirect to `/`,
preserving `?archived=1`.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

That is the whole setup. With no environment variables at all, the portal runs
on a **dev bypass** identity (see below) and every screen — including document
preview, download, and the audit trail — works end to end.

Other scripts:

| Script                  | What it does                                        |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Dev server (Turbopack).                              |
| `npm run build`         | Production build, including a TypeScript pass.       |
| `npm start`             | Serve the production build.                          |
| `npm run lint`          | ESLint.                                              |
| `npm run typecheck`     | `tsc --noEmit`.                                      |
| `npm run generate:pdfs` | Regenerate the placeholder PDFs in `public/docs/`.   |

### Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · `@clerk/nextjs` ·
Lucide icons. No database.

> **Note on Next.js 16:** middleware is now called **proxy**, so the Clerk
> middleware lives in [`src/proxy.ts`](src/proxy.ts), not `middleware.ts`.

---

## The access rules

All of them are enforced in one file — [`src/lib/data.ts`](src/lib/data.ts) —
so there is a single place to audit and a single place to change.

### 1. Organization scoping

A **client organization is one legal entity**. Every accessor takes the
caller's *active organization* and returns only that organization's work. An
engagement or document id from another organization returns nothing, so it
404s.

One person can belong to several organizations — an operating company and a
family trust, say — and switches between them with the org switcher in the
header. Clerk owns membership when it is configured.

### 2. Roles

Two roles per organization, mapped onto Clerk's built-in org roles:

| Portal role | Clerk role   | Sees                    | Manages members | Sees download activity |
| ----------- | ------------ | ----------------------- | --------------- | ---------------------- |
| `owner`     | `org:admin`  | Everything the org owns | Yes             | Yes                    |
| `member`    | `org:member` | Everything the org owns | No              | No                     |

There are deliberately **no document-type-level permissions**. Both roles see
everything the organization owns.

### 3. Internal documents are never returned

A document marked `visibility: "internal"` is Boa Safra work product. It is
filtered out in the data layer, so nothing above it ever holds one — not the
lists, not the counts, not a direct id lookup.

### 4. Only final documents can be downloaded

Non-final documents **are** visible and previewable, so clients can follow
progress. They cannot be downloaded:

- No download button, and their row shows **Preview only**.
- The preview carries a persistent *"Preliminary — not for distribution"*
  banner, and the "open in new tab" escape hatch is removed.
- They cannot be bulk-selected; if a selection somehow contains one, bulk
  download skips it and the toast says how many were skipped.
- Superseded versions follow the same rule: viewable, never downloadable.

`isDownloadable()` in [`format.ts`](src/lib/format.ts) is the single predicate,
and the server re-checks it before writing an audit row.

### 5. Retention: seven years after completion

The clock runs from the engagement's `completedAt`, so a report and the
boundary map supporting it always expire together. An engagement that is still
open has no retention end yet. Past the end date, the engagement and all of its
documents stop being returned. See
[`src/lib/retention.ts`](src/lib/retention.ts).

Completed and archived engagements show **"Available until &lt;date&gt;"**, and
anything inside 180 days of expiry is highlighted.

> **Production note:** serving documents from `public/` is fine for a mockup
> but wrong for real data — anything in `public/` is world-readable by URL with
> no auth check, which means rules 1, 3, 4 and 5 hold only above the data
> layer. Real documents must be served through an authorized route handler that
> re-checks all of them on every request. The PDF generator does at least
> refuse to write internal documents to disk at all.

---

## Authentication: Clerk keys vs. dev bypass

The portal runs in one of two modes, decided by whether
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set.

### Clients join by invitation only

There is **no `/sign-up` route**. Access is granted by a staff-issued Clerk
**organization invitation** sent to the person's email address. `/sign-in`
carries an "Invitation required" note explaining this.

### Dev bypass (default, no keys needed)

With no publishable key present:

- `<ClerkProvider>` is never mounted, so nothing crashes on a missing key.
- `src/proxy.ts` passes every request straight through.
- Identities come from [`src/lib/dev-session.ts`](src/lib/dev-session.ts),
  derived from the seeded organization members so they cannot drift from the
  data. The active identity and active org live in `httpOnly` cookies.

The avatar menu has a **Sign in as** switcher. The three seeded identities
demonstrate the whole access model:

| Identity    | Organizations                                | Demonstrates                          |
| ----------- | -------------------------------------------- | ------------------------------------- |
| Dan Reft    | Martin LLC (owner), Reft Family Trust (owner) | Multi-entity + the org switcher + the owner-only audit trail |
| Katie Vogel | Martin LLC (member)                           | The member role — no download activity |
| Marcus Hale | Reft Family Trust (member)                    | Organization isolation — no Martin LLC work at all |

Both switchers are backed by server actions that **no-op when Clerk is
configured**, and the org switcher re-checks membership, so neither can be used
to reach an organization you do not belong to.

### Real Clerk auth

Create `.env.local` (start from [`.env.example`](.env.example)) and set **both**
keys:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Then, in the Clerk dashboard:

1. **Enable Organizations.**
2. Create an organization per legal entity. For the seed data to line up, give
   them the ids in `src/lib/mock-data.ts` (`org_martin_llc`,
   `org_reft_family_trust`) — otherwise Clerk's org is authoritative and the
   portal simply shows no engagements for it.
3. Invite each client member to their organization, with role `org:admin`
   (portal `owner`) or `org:member` (portal `member`).

Now `<ClerkProvider>` wraps the app, `clerkMiddleware()` protects everything
except `/sign-in`, the header shows Clerk's `<OrganizationSwitcher />` and
`<UserButton />`, and `/account` renders Clerk's `<UserProfile />`.

> Both keys are required together. If the publishable key is set but
> `CLERK_SECRET_KEY` is not, Clerk mounts on the client and then fails on the
> first server-side call. There is no partial mode.

---

## How the mock data is structured

Files under `src/lib/`, in dependency order:

| File               | Role                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `types.ts`         | The domain model. Product-agnostic by design.                               |
| `mock-data.ts`     | The seed data — plain exported arrays. **The single source of truth.**      |
| `retention.ts`     | The seven-year retention policy.                                            |
| `data.ts`          | Read-only accessors. Enforces every access rule above. All `async`.         |
| `format.ts`        | Formatting, client-facing status labels, and `isDownloadable()`.            |
| `auth.ts`          | Resolves a `PortalSession` (user + memberships + active org + role).        |
| `dev-session.ts`   | Dev-bypass identities and the active-org cookie.                            |

### The model

```
Product        ── e.g. Legacy Nutrient Deductions
  └── DocumentType[]   ordered lifecycle steps, each with providedBy: client | boa_safra
ClientOrg      ── one legal entity, with members[] (each owner | member)
Engagement     ── belongs to one Product and one ClientOrg
  │                 completedAt starts the seven-year retention clock
  └── Document[]     visibility: client | internal
        │            fileUrl is null for a requested-but-unsupplied document
        └── previousVersions[]   each with a required supersede note
DownloadEvent  ── the audit trail, written on every download
PortalSession  ── user + memberships + activeOrgId + activeRole
```

### Client-facing status labels

Internal workflow statuses are stored as they are and translated for display:

| Stored         | Shown to client | Meaning                              |
| -------------- | --------------- | ------------------------------------ |
| `pending`      | **Requested**   | We need this from you (orange)       |
| `received`     | Received        | Arrived, not yet finalized (muted)   |
| `under_review` | In Progress     | Being worked on (muted)              |
| `final`        | **Final**       | Finished — the only downloadable one |

### Seed data

- **Martin LLC** — Dan Reft (owner), Katie Vogel (member). Three engagements:
  **North 40** (active, action needed), **Home Place (2025)** (completed,
  available until Nov 2032), and **Sandhill Quarter (2019)** (archived,
  available until Nov 2026 — close enough to expiry that the warning shows).
- **Reft Family Trust** — Dan Reft (owner), Marcus Hale (member). One
  engagement: **Trust Ridge** (in progress).
- 24 documents, of which 3 are `internal` (never returned) and 2 are
  `Requested` placeholders with no file. 22 placeholder PDFs on disk.
- A seeded download audit trail so the owner-only table is not empty.

### The PDFs are real

`public/docs/` holds actual one-page PDFs so **View** and **Download** work end
to end. They are generated by
[`scripts/generate-pdfs.mjs`](scripts/generate-pdfs.mjs), which imports
`src/lib/mock-data.ts` directly (Node strips the types) and writes one file per
`fileUrl` — including previous versions, and **excluding internal documents**.
Filenames therefore cannot drift from the seed data.

After editing seed data, re-run:

```bash
npm run generate:pdfs
```

### Demoing the loading skeletons

Every route has a `loading.tsx`. To actually see them, set a delay:

```bash
MOCK_LATENCY_MS=800 npm run dev
```

---

## How to add a second product

The model is product-agnostic, so this is a data change plus one optional copy
tweak. Nothing about the routing or the components has to change.

**1. Add the product** — `src/lib/mock-data.ts`, `products` array:

```ts
{
  id: "prod_conservation_easements",
  name: "Conservation Easements",
  slug: "conservation-easements",
  description: "…",
}
```

**2. Add its document types** — same file, `documentTypes` array. Point
`productId` at the new product, number `order` from 1, and set `providedBy` to
whoever normally supplies each type (this drives the "awaiting" messaging and
where the upload drop zone appears):

```ts
{
  id: "dt_ce_appraisal",
  productId: "prod_conservation_easements",
  name: "Appraisal",
  order: 1,
  description: "…",
  providedBy: "boa_safra",
}
```

**3. Add engagements and documents** — `engagements` with the new `productId`
and a `clientOrgId`, `documents` referencing the new `documentTypeId`s.

**4. Regenerate the PDFs** — `npm run generate:pdfs`.

That is it. Specifically, what happens for free:

- **`/` (Engagements)** lists the organization’s engagements and shows the
  product name on each card.
- **`/engagements`** redirects to the engagement home page.
- **`/engagements/[id]`** builds its requested-document summary from
  `getDocumentTypesForProduct(engagement.productId)`, so the new lifecycle
  renders with however many steps it has.
- **`/documents`** widens its type filter to cover every product the
  organization has an engagement in.

**Only if you want a product picker** (worth it once there are three or more):
add it to the dashboard and to the `/documents` filter bar
([`src/components/document-browser.tsx`](src/components/document-browser.tsx)
already takes a list of document types — pass a filtered set).

---

## Project layout

```
src/
  app/
    layout.tsx                     root: env banner, toasts, conditional ClerkProvider
    (auth)/sign-in/[[...sign-in]]/ Clerk <SignIn /> or the dev-bypass notice
    (portal)/
      layout.tsx                   requires a session, renders the app shell
      page.tsx                     engagement home
      engagements/                 legacy list redirect and [id] detail
      documents/                   library and [id] detail (preview, versions, audit)
      account/                     profile, organization + members, notification prefs
  components/                      app shell, org switcher, document browser, stepper
  lib/
    types.ts  mock-data.ts         the model and the seed
    data.ts                        accessors — enforces every access rule
    retention.ts                   seven-year policy
    auth.ts  clerk.ts              session resolution, either mode
    dev-session.ts                 dev-bypass identities and active org
    session-actions.ts             identity / organization switch actions
    download-actions.ts            audit-trail write
  proxy.ts                         Clerk middleware, only active when keys exist
public/docs/                       generated placeholder PDFs (no internal documents)
scripts/generate-pdfs.mjs          generates them from the seed data
```

---

## Roadmap

Not in the mockup, in rough priority order:

**Notifications.** A placeholder card sits on `/account` with these three
disabled, labeled "Coming soon":

1. **Email on new document posted** — when a final document is added to an
   engagement.
2. **Email on action needed** — when Boa Safra Ag requests something from the
   client.
3. **Daily digest cap** — roll a day's activity into a single email instead of
   one per event, so an active engagement cannot flood an inbox.

**Client upload.** Read-only today. The extension point is already shaped:
every client-supplied lifecycle step with nothing filed shows a dashed
drop zone reading *"Upload your &lt;Document Type&gt; here"*, disabled with a
"Coming soon" tooltip. Upload is per document type, not a generic inbox.

**RFS Next integration.** "Start New RFS" already passes
`?clientOrgId=<active org id>` so the request can be prefilled. The other half —
a submitted RFS creating the engagement in the portal automatically — is
pending confirmation from the RFS Next team.

See [`DECISIONS.md`](DECISIONS.md) for what has been decided and what is still
open.
