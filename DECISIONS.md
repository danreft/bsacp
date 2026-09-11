# Decisions & Open Questions

What has been decided and built, what is queued as a follow-up, and the
judgment calls worth a second look.

---

## Decided (implemented)

### Org and access model

**Q10 — Multi-entity: yes. Migrated to Clerk Organizations.**
A client organization is now one legal entity. The active organization — not a
`publicMetadata` field, and not the per-deal email list that preceded it —
scopes every accessor. An org switcher sits in the header: Clerk's
`<OrganizationSwitcher />` when configured, a matching cookie-backed control in
dev-bypass mode. Seeded: Dan Reft owns both Martin LLC (three engagements) and
Reft Family Trust (one). A document id from another organization still 404s.

**Q11 — Roles: `owner` and `member`.**
Mapped onto Clerk's `org:admin` / `org:member`. Both see everything the
organization owns; only an owner manages members and sees download activity. No
document-type-level permissions — see Follow-ups.

**Q12 — Invitations only.**
The `/sign-up` route is deleted and removed from the proxy's public routes.
Clients join through a staff-issued Clerk organization invitation. `/sign-in`
carries an "Invitation required" note pointing at the client email address.

### Documents and visibility

**Q1 — Internal-only documents: added.**
`Document.visibility: 'client' | 'internal'`, filtered in `data.ts` so nothing
above the data layer ever holds one. Three internal documents are seeded (one
each on North 40, Home Place, and Trust Ridge). The PDF generator refuses to
write them to disk at all. Verified: they appear in no list, no count, and a
direct id lookup 404s.

**Q2 — Non-final documents: visible, previewable, not downloadable.**
No download button (the row reads "Preview only"), a persistent *"Preliminary —
not for distribution"* banner on the preview, and the "open in new tab" escape
hatch removed so the file cannot be trivially saved from the viewer. Non-final
rows cannot be bulk-selected, and bulk download skips any that slip through and
says how many in the toast. `isDownloadable()` is the single predicate, and the
server re-checks it before writing an audit row.

**Q3 — Client-facing status labels.**
Internal statuses stay in the model and are translated for display:
`pending` → **Requested** (orange, the action-needed color), `received` →
Received (muted), `under_review` → In Progress (muted), `final` → **Final**
(green).

### Versioning

**Q4 — Version history: unchanged.** Current version only in tables, full
history on `/documents/[id]`.

**Q5 — Version rules.** Only Boa Safra creates versions, and a new version
supersedes the same logical document. Superseded versions carry a **Superseded**
badge and are previewable but not downloadable — the per-version download
buttons are gone, replaced by "View v*N*". Only the current version gets a
download button, and only when it is final.

**Q6 — Supersede notes are required.** `DocumentVersion.note` is now
non-optional, and all seed data has one.

### Retention and access

**Q7 — Seven years from engagement completion.** `Engagement.completedAt` was
added, and `retentionEndsAt()` derives the end date. An engagement still open
has no retention end. An `archived` status was added: archived engagements are
hidden from the default Engagements list behind a "Show archived (n)" toggle,
and remain fully viewable and downloadable until the retention date. Completed
and archived engagements show "Available until &lt;date&gt;" on both the list
and the detail page, highlighted inside 180 days of expiry. Seeded **Sandhill
Quarter (2019)**, archived and available until Nov 2026, so the near-expiry
state is actually visible.

**Q8 — Relationships are permanent.** Clients keep full access for the life of
the retention window. No "relationship ended" state exists or was added.

**Q9 — Download audit trail: added.** `DownloadEvent { id, userId, userName,
orgId, documentId, version, downloadedAt }`, written on every download
including bulk. A read-only "Download activity" table on `/documents/[id]` is
visible to `owner` only. No export UI. The write happens in a server action
that re-resolves the session and re-checks that the document is the caller's
and is downloadable, so a forged client call cannot log a bogus row.

### Scope

**Q13 — Upload shaped as drag-and-drop per document type.** Every
client-supplied lifecycle step with nothing filed shows a dashed drop zone
reading "Upload your &lt;Document Type&gt; here", disabled with a "Coming soon"
tooltip. The generic Upload button that used to sit in the awaiting panel is
gone.

**Q14 — "Start New RFS" carries the org.** The link now passes
`?clientOrgId=<active org id>`. The other half is in Follow-ups.

**Q15 — Notifications: not in the mockup.** A "Notification preferences" card
on `/account` shows the three planned options as disabled toggles labeled
"Coming soon", and README has a Roadmap section.

---

## Follow-ups

1. **A restricted role is a likely future ask.** Today `owner` and `member`
   both see everything the organization owns. The obvious next request is a
   narrower role — a farm manager who sees only Boundary Maps and Soil Samples,
   or an outside lender who sees only the Executed Report. That means
   document-type-level permissions: a role → allowed `documentTypeId[]` mapping
   applied in `data.ts` alongside the existing filters. Deliberately not built
   now, but the filter it would slot into already exists in one place.

2. **RFS Next integration (other half of Q14).** A submitted RFS should create
   the engagement in the portal automatically, rather than someone keying it in
   twice. Pending confirmation from the RFS Next team on whether it can call a
   webhook or write to a shared store, and on what it knows at submit time
   (legal entity, fields, authorized representative). The portal side needs an
   ingest endpoint and a rule for which organization the new engagement lands
   in when the submitter belongs to several.

3. **Notifications (Q15).** Email on new document posted, email on action
   needed, and a daily digest cap. The digest cap matters most: an engagement
   that posts several documents in one afternoon should not send several
   emails. Needs a delivery provider, a per-member preference store (the
   `/account` card is a placeholder with no persistence), and an unsubscribe
   path.

---

## Judgment calls worth a second look

1. **A `Requested` document has no file.** Q3 defines `pending` as "client
   needs to provide", which means such a row is a placeholder for something not
   yet supplied — so `fileUrl` and `sizeBytes` are now nullable, and the row
   shows "Not yet provided", a dash for size, and "Awaiting upload" instead of
   actions. The alternative reading — a blank form Boa Safra issues for the
   client to fill in — would have a file, but then it would be non-final and
   therefore not downloadable, which defeats the point of sending a form. Flag
   it if you meant the latter.

2. **Non-final previews lost their "open in new tab" link.** Q2 says
   previewable but not downloadable; leaving a direct link to the PDF made the
   download rule trivial to bypass. The consequence is that preliminary
   documents can only be read in the modal, which is a smaller viewport.

3. **The seeded org ids must match Clerk's.** Clerk owns organization
   membership under real auth, but the seed data is keyed by id. If the ids do
   not line up, the portal shows no engagements for that org rather than
   failing loudly. README says so; a real implementation would look orgs up by
   Clerk id and store the mapping.

4. **The audit trail is in-memory.** `downloadEvents` is a module-level array,
   so it persists for the life of the server process and resets on restart.
   Enough to demonstrate the feature; `recordDownloadEvent()` is the one place
   to swap for a real insert.

5. **`public/` still has no auth.** Every access rule is enforced above the
   data layer, but the PDFs are served statically, so a guessed URL bypasses
   all of them. The generator at least refuses to write internal documents to
   disk. Real documents need an authorized route handler — this is the single
   biggest gap between the mockup and something shippable.

---

## Assumptions still in force

1. **`providedBy` on `DocumentType`** distinguishes "Awaiting your upload" from
   "Awaiting Boa Safra Ag" and decides where the upload drop zone appears,
   without hard-coding anything about Legacy Nutrient Deductions.

2. **Engagement status is stored, not derived,** so ops can override it. It can
   drift from what the documents imply.

3. **Data accessors are `async`** even though the data is in memory, so
   swapping in a real backend touches only `data.ts`.

4. **The auth-mode switch is the publishable key alone** — one flag readable on
   both server and client. Both keys or neither.

5. **Both dev switchers are inert under real auth,** and the org switcher
   re-checks membership server-side.

6. **No product picker** while there is one product; the dashboard renders one
   section per product. Worth adding at three or more.

7. **Bulk download is sequential, not zipped** (~400 ms apart), to avoid a
   dependency and holding every file in memory.

8. **PDF preview uses the browser's viewer in an `<iframe>`** — no PDF library
   in the bundle.

9. **Dates render in UTC with a fixed `en-US` format,** so server and client
   always produce the same string. Real users would likely want their own
   timezone.

10. **Wide tables scroll horizontally inside their card.** Standard, but not
    especially discoverable on small screens.

11. **The archived toggle is a link, not client state,** so it survives a
    reload, can be shared, and needs no JavaScript.

12. **Placeholder content.** The RFS Next URL, the support email, the sprout
    logo mark, and the brand green (`#1f4d31`) are stand-ins matched by eye.

---

## Still open

1. **What happens at the seven-year mark, and who is warned?** Documents simply
   stop being returned. Should the client be emailed at 90 days out, offered a
   "download everything" export, or does Boa Safra archive them somewhere they
   can still be retrieved on request? The near-expiry highlight is in, but
   nothing acts on it.

2. **Who archives an engagement, and is it reversible?** `archived` is a stored
   status with no transition rules and no UI to set it.

3. **Should the audit trail cover previews too, not just downloads?** A
   preliminary document can be read on screen without leaving a trace. For work
   product this sensitive, "who looked at it" may matter as much as "who saved
   it".

4. **Can an owner export the audit trail?** Read-only table today, no CSV.

5. **Does an organization owner need to invite members themselves?** Today all
   invitations are staff-issued. Clerk supports delegating this to org admins,
   which would take Boa Safra out of the loop for a client adding their own
   bookkeeper.
