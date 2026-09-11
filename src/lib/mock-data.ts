/**
 * Seed data for the portal mockup. There is no database — this module is the
 * single source of truth, and `scripts/generate-pdfs.mjs` reads it to emit the
 * matching placeholder PDFs into `public/docs/`.
 *
 * Keep imports here relative and type-only so the file stays importable by
 * plain Node (which strips types but does not resolve the `@/` alias).
 */
import type {
  ClientOrg,
  DocumentType,
  DownloadEvent,
  Engagement,
  PortalDocument,
  Product,
} from "./types.ts";

export const products: Product[] = [
  {
    id: "prod_legacy_nutrient_deductions",
    name: "Legacy Nutrient Deductions",
    slug: "legacy-nutrient-deductions",
    description:
      "Quantify residual fertility left in the soil at acquisition and convert it into an amortizable deduction.",
  },
];

/**
 * One organization per legal entity. Dan Reft belongs to both, which is the
 * case this model exists to handle: the same person representing an operating
 * company and a family trust.
 */
export const clientOrgs: ClientOrg[] = [
  {
    id: "org_martin_llc",
    name: "Martin LLC",
    authorizedRepresentative: "Dan Reft",
    members: [
      {
        name: "Dan Reft",
        email: "dan.reft@martinllc.example",
        title: "Authorized Representative",
        role: "owner",
      },
      {
        name: "Katie Vogel",
        email: "katie.vogel@martinllc.example",
        title: "Operations Manager",
        role: "member",
      },
    ],
  },
  {
    id: "org_reft_family_trust",
    name: "Reft Family Trust",
    authorizedRepresentative: "Dan Reft",
    members: [
      {
        name: "Dan Reft",
        email: "dan.reft@martinllc.example",
        title: "Trustee",
        role: "owner",
      },
      {
        name: "Marcus Hale",
        email: "marcus.hale@martinllc.example",
        title: "Land Manager",
        role: "member",
      },
    ],
  },
];

/**
 * The six document types exchanged during a Legacy Nutrient Deductions
 * engagement, in lifecycle order. A second product brings its own set.
 */
export const documentTypes: DocumentType[] = [
  {
    id: "dt_lnd_request_for_service",
    productId: "prod_legacy_nutrient_deductions",
    name: "Request for Service",
    order: 1,
    description:
      "The signed intake request that opens the engagement, submitted through RFS Next.",
    providedBy: "client",
  },
  {
    id: "dt_lnd_boundary_maps",
    productId: "prod_legacy_nutrient_deductions",
    name: "Boundary Maps",
    order: 2,
    description:
      "Field boundaries for every parcel in scope, used to plan sampling and allocate results.",
    providedBy: "client",
  },
  {
    id: "dt_lnd_executed_contracts",
    productId: "prod_legacy_nutrient_deductions",
    name: "Executed Contracts",
    order: 3,
    description:
      "The countersigned service agreement and any amendments to it.",
    providedBy: "boa_safra",
  },
  {
    id: "dt_lnd_soil_samples",
    productId: "prod_legacy_nutrient_deductions",
    name: "Soil Samples",
    order: 4,
    description:
      "Sampling plans and laboratory results establishing residual nutrient levels.",
    providedBy: "boa_safra",
  },
  {
    id: "dt_lnd_groundwork_forms",
    productId: "prod_legacy_nutrient_deductions",
    name: "GroundWork Forms",
    order: 5,
    description:
      "Ownership, acquisition, and prior-management detail collected from the operator.",
    providedBy: "client",
  },
  {
    id: "dt_lnd_executed_report",
    productId: "prod_legacy_nutrient_deductions",
    name: "Executed Report",
    order: 6,
    description:
      "The final deduction report and supporting valuation, ready for your tax preparer.",
    providedBy: "boa_safra",
  },
];

export const engagements: Engagement[] = [
  {
    id: "eng_north_40_2026",
    productId: "prod_legacy_nutrient_deductions",
    clientOrgId: "org_martin_llc",
    name: "North 40",
    legalOwner: "Martin LLC",
    fields: ["North 40", "Creek Bottom", "Highway 12 Quarter"],
    status: "awaiting_client",
    startedAt: "2026-03-04T15:12:00.000Z",
    updatedAt: "2026-08-27T18:41:00.000Z",
  },
  {
    id: "eng_home_place_2025",
    productId: "prod_legacy_nutrient_deductions",
    clientOrgId: "org_martin_llc",
    name: "Home Place (2025)",
    legalOwner: "Martin LLC",
    fields: ["Home Place", "South Pasture"],
    status: "completed",
    startedAt: "2025-02-10T14:02:00.000Z",
    updatedAt: "2025-11-14T21:07:00.000Z",
    completedAt: "2025-11-14T21:07:00.000Z",
  },
  {
    // Archived and close to the end of its seven-year window, so the
    // "available until" and expiring-soon states are both visible.
    id: "eng_sandhill_quarter_2019",
    productId: "prod_legacy_nutrient_deductions",
    clientOrgId: "org_martin_llc",
    name: "Sandhill Quarter (2019)",
    legalOwner: "Martin LLC",
    fields: ["Sandhill Quarter"],
    status: "archived",
    startedAt: "2019-03-18T13:40:00.000Z",
    updatedAt: "2019-11-20T17:25:00.000Z",
    completedAt: "2019-11-20T17:25:00.000Z",
  },
  {
    id: "eng_trust_ridge_2026",
    productId: "prod_legacy_nutrient_deductions",
    clientOrgId: "org_reft_family_trust",
    name: "Trust Ridge",
    legalOwner: "Reft Family Trust",
    fields: ["Trust Ridge", "Wagner Draw"],
    status: "in_progress",
    startedAt: "2026-05-12T16:20:00.000Z",
    updatedAt: "2026-08-19T14:05:00.000Z",
  },
];

/**
 * Documents. Note the three kinds of row that are not ordinary downloads:
 *   - `visibility: "internal"` — Boa Safra work product, filtered out entirely.
 *   - `status: "pending"` — requested from the client, so `fileUrl` is null.
 *   - non-final documents — visible and previewable, but never downloadable.
 */
export const documents: PortalDocument[] = [
  // ---------------------------------------------------------------- North 40
  {
    id: "doc_n40_rfs_1",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_request_for_service",
    fileName: "RFS-2026-0142 North 40.pdf",
    fileUrl: "/docs/rfs-2026-0142-north-40.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2026-03-04T15:12:00.000Z",
    uploadedBy: "client",
    sizeBytes: 184_320,
  },
  {
    id: "doc_n40_map_north40",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_boundary_maps",
    fileName: "North 40 Boundary Map.pdf",
    fileUrl: "/docs/north-40-boundary-map-v2.pdf",
    version: 2,
    status: "final",
    visibility: "client",
    uploadedAt: "2026-04-02T16:35:00.000Z",
    uploadedBy: "client",
    sizeBytes: 1_248_576,
    previousVersions: [
      {
        version: 1,
        fileName: "North 40 Boundary Map.pdf",
        fileUrl: "/docs/north-40-boundary-map-v1.pdf",
        uploadedAt: "2026-03-18T13:20:00.000Z",
        uploadedBy: "client",
        sizeBytes: 1_198_204,
        note: "Superseded — northeast corner excluded the road easement.",
      },
    ],
  },
  {
    id: "doc_n40_map_creek",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_boundary_maps",
    fileName: "Creek Bottom Boundary Map.pdf",
    fileUrl: "/docs/creek-bottom-boundary-map.pdf",
    version: 1,
    status: "received",
    visibility: "client",
    uploadedAt: "2026-03-18T13:22:00.000Z",
    uploadedBy: "client",
    sizeBytes: 987_430,
  },
  {
    id: "doc_n40_map_hwy12",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_boundary_maps",
    fileName: "Highway 12 Quarter Boundary Map.pdf",
    fileUrl: "/docs/highway-12-quarter-boundary-map.pdf",
    version: 1,
    status: "received",
    visibility: "client",
    uploadedAt: "2026-03-19T19:05:00.000Z",
    uploadedBy: "client",
    sizeBytes: 1_043_912,
  },
  {
    id: "doc_n40_contract",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_executed_contracts",
    fileName: "Service Agreement Martin LLC (Executed).pdf",
    fileUrl: "/docs/service-agreement-martin-llc-2026-executed.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2026-04-15T20:44:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 412_880,
  },
  {
    id: "doc_n40_soil_plan",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_soil_samples",
    fileName: "Soil Sampling Plan.pdf",
    fileUrl: "/docs/soil-sampling-plan-north-40.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2026-05-30T17:18:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 623_104,
  },
  {
    id: "doc_n40_soil_north40",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_soil_samples",
    fileName: "Soil Sample Results North 40.pdf",
    fileUrl: "/docs/soil-sample-results-north-40.pdf",
    version: 1,
    status: "under_review",
    visibility: "client",
    uploadedAt: "2026-06-22T14:50:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 2_310_144,
  },
  {
    id: "doc_n40_soil_creek",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_soil_samples",
    fileName: "Soil Sample Results Creek Bottom.pdf",
    fileUrl: "/docs/soil-sample-results-creek-bottom.pdf",
    version: 1,
    status: "under_review",
    visibility: "client",
    uploadedAt: "2026-06-22T14:51:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 2_104_320,
  },
  {
    // Internal work product — the client must never see this row at all.
    id: "doc_n40_internal_qc",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_soil_samples",
    fileName: "INTERNAL Lab QC Review North 40.pdf",
    fileUrl: "/docs/internal-lab-qc-review-north-40.pdf",
    version: 1,
    status: "under_review",
    visibility: "internal",
    uploadedAt: "2026-07-02T15:10:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 744_512,
  },
  {
    // Requested from the client and not yet supplied: no file.
    id: "doc_n40_groundwork_requested",
    engagementId: "eng_north_40_2026",
    documentTypeId: "dt_lnd_groundwork_forms",
    fileName: "GroundWork Form North 40",
    fileUrl: null,
    version: 1,
    status: "pending",
    visibility: "client",
    uploadedAt: "2026-08-27T18:41:00.000Z",
    uploadedBy: "client",
    sizeBytes: null,
  },

  // -------------------------------------------------------- Home Place (2025)
  {
    id: "doc_hp_rfs",
    engagementId: "eng_home_place_2025",
    documentTypeId: "dt_lnd_request_for_service",
    fileName: "RFS-2025-0088 Home Place.pdf",
    fileUrl: "/docs/rfs-2025-0088-home-place.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2025-02-10T14:02:00.000Z",
    uploadedBy: "client",
    sizeBytes: 176_128,
  },
  {
    id: "doc_hp_map",
    engagementId: "eng_home_place_2025",
    documentTypeId: "dt_lnd_boundary_maps",
    fileName: "Home Place Boundary Map.pdf",
    fileUrl: "/docs/home-place-boundary-map.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2025-02-24T16:40:00.000Z",
    uploadedBy: "client",
    sizeBytes: 1_120_256,
  },
  {
    id: "doc_hp_contract",
    engagementId: "eng_home_place_2025",
    documentTypeId: "dt_lnd_executed_contracts",
    fileName: "Service Agreement Martin LLC 2025 (Executed).pdf",
    fileUrl: "/docs/service-agreement-martin-llc-2025-executed.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2025-03-12T15:31:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 398_336,
  },
  {
    id: "doc_hp_soil",
    engagementId: "eng_home_place_2025",
    documentTypeId: "dt_lnd_soil_samples",
    fileName: "Soil Sample Results Home Place.pdf",
    fileUrl: "/docs/soil-sample-results-home-place.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2025-05-19T18:12:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 1_894_400,
  },
  {
    id: "doc_hp_internal_valuation",
    engagementId: "eng_home_place_2025",
    documentTypeId: "dt_lnd_executed_report",
    fileName: "INTERNAL Valuation Workpapers Home Place.pdf",
    fileUrl: "/docs/internal-valuation-workpapers-home-place.pdf",
    version: 1,
    status: "final",
    visibility: "internal",
    uploadedAt: "2025-10-30T14:15:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 1_310_720,
  },
  {
    id: "doc_hp_groundwork",
    engagementId: "eng_home_place_2025",
    documentTypeId: "dt_lnd_groundwork_forms",
    fileName: "GroundWork Form Home Place (Completed).pdf",
    fileUrl: "/docs/groundwork-form-home-place-completed.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2025-06-30T13:47:00.000Z",
    uploadedBy: "client",
    sizeBytes: 742_400,
  },
  {
    id: "doc_hp_report",
    engagementId: "eng_home_place_2025",
    documentTypeId: "dt_lnd_executed_report",
    fileName: "Legacy Nutrient Deduction Report Home Place 2025.pdf",
    fileUrl: "/docs/legacy-nutrient-deduction-report-home-place-2025-v3.pdf",
    version: 3,
    status: "final",
    visibility: "client",
    uploadedAt: "2025-11-14T21:07:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 3_468_902,
    previousVersions: [
      {
        version: 2,
        fileName: "Legacy Nutrient Deduction Report Home Place 2025.pdf",
        fileUrl:
          "/docs/legacy-nutrient-deduction-report-home-place-2025-v2.pdf",
        uploadedAt: "2025-10-28T19:55:00.000Z",
        uploadedBy: "boa_safra",
        sizeBytes: 3_402_118,
        note: "Superseded — South Pasture acreage corrected against county records.",
      },
      {
        version: 1,
        fileName: "Legacy Nutrient Deduction Report Home Place 2025.pdf",
        fileUrl:
          "/docs/legacy-nutrient-deduction-report-home-place-2025-v1.pdf",
        uploadedAt: "2025-10-09T16:30:00.000Z",
        uploadedBy: "boa_safra",
        sizeBytes: 3_385_754,
        note: "Superseded — reissued to include the South Pasture parcel.",
      },
    ],
  },

  // --------------------------------------------------- Sandhill Quarter (2019)
  {
    id: "doc_sq_rfs",
    engagementId: "eng_sandhill_quarter_2019",
    documentTypeId: "dt_lnd_request_for_service",
    fileName: "RFS-2019-0031 Sandhill Quarter.pdf",
    fileUrl: "/docs/rfs-2019-0031-sandhill-quarter.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2019-03-18T13:40:00.000Z",
    uploadedBy: "client",
    sizeBytes: 158_720,
  },
  {
    id: "doc_sq_report",
    engagementId: "eng_sandhill_quarter_2019",
    documentTypeId: "dt_lnd_executed_report",
    fileName: "Legacy Nutrient Deduction Report Sandhill Quarter 2019.pdf",
    fileUrl: "/docs/legacy-nutrient-deduction-report-sandhill-quarter-2019.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2019-11-20T17:25:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 2_988_032,
  },

  // ------------------------------------------------------------- Trust Ridge
  {
    id: "doc_tr_rfs",
    engagementId: "eng_trust_ridge_2026",
    documentTypeId: "dt_lnd_request_for_service",
    fileName: "RFS-2026-0188 Trust Ridge.pdf",
    fileUrl: "/docs/rfs-2026-0188-trust-ridge.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2026-05-12T16:20:00.000Z",
    uploadedBy: "client",
    sizeBytes: 191_488,
  },
  {
    id: "doc_tr_map",
    engagementId: "eng_trust_ridge_2026",
    documentTypeId: "dt_lnd_boundary_maps",
    fileName: "Trust Ridge Boundary Map.pdf",
    fileUrl: "/docs/trust-ridge-boundary-map.pdf",
    version: 1,
    status: "received",
    visibility: "client",
    uploadedAt: "2026-06-03T15:44:00.000Z",
    uploadedBy: "client",
    sizeBytes: 1_067_008,
  },
  {
    id: "doc_tr_contract",
    engagementId: "eng_trust_ridge_2026",
    documentTypeId: "dt_lnd_executed_contracts",
    fileName: "Service Agreement Reft Family Trust (Executed).pdf",
    fileUrl: "/docs/service-agreement-reft-family-trust-executed.pdf",
    version: 1,
    status: "final",
    visibility: "client",
    uploadedAt: "2026-07-01T19:12:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 405_504,
  },
  {
    id: "doc_tr_internal_scope",
    engagementId: "eng_trust_ridge_2026",
    documentTypeId: "dt_lnd_executed_contracts",
    fileName: "INTERNAL Scoping Notes Trust Ridge.pdf",
    fileUrl: "/docs/internal-scoping-notes-trust-ridge.pdf",
    version: 1,
    status: "final",
    visibility: "internal",
    uploadedAt: "2026-06-28T13:02:00.000Z",
    uploadedBy: "boa_safra",
    sizeBytes: 286_720,
  },
  {
    id: "doc_tr_groundwork_requested",
    engagementId: "eng_trust_ridge_2026",
    documentTypeId: "dt_lnd_groundwork_forms",
    fileName: "GroundWork Form Trust Ridge",
    fileUrl: null,
    version: 1,
    status: "pending",
    visibility: "client",
    uploadedAt: "2026-08-19T14:05:00.000Z",
    uploadedBy: "client",
    sizeBytes: null,
  },
];

/**
 * The download audit trail. Seeded with a little history so the owner-only
 * table on a document page is not empty; `recordDownload()` appends to it.
 */
export const downloadEvents: DownloadEvent[] = [
  {
    id: "dl_seed_1",
    userId: "user_dev_dan_reft",
    userName: "Dan Reft",
    orgId: "org_martin_llc",
    documentId: "doc_hp_report",
    version: 3,
    downloadedAt: "2025-11-15T14:22:00.000Z",
  },
  {
    id: "dl_seed_2",
    userId: "user_dev_katie_vogel",
    userName: "Katie Vogel",
    orgId: "org_martin_llc",
    documentId: "doc_hp_report",
    version: 3,
    downloadedAt: "2026-01-08T17:41:00.000Z",
  },
  {
    id: "dl_seed_3",
    userId: "user_dev_dan_reft",
    userName: "Dan Reft",
    orgId: "org_martin_llc",
    documentId: "doc_n40_contract",
    version: 1,
    downloadedAt: "2026-04-16T13:05:00.000Z",
  },
];
