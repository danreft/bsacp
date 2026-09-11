"use client";

import { Download, Eye, Search, Upload, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { DocumentRow } from "@/lib/data";
import { logDownload } from "@/lib/download-actions";
import { triggerDownload, triggerSequentialDownloads } from "@/lib/download";
import {
  DOCUMENT_STATUSES,
  DOCUMENT_STATUS_META,
  UPLOADER_KINDS,
  formatBytes,
  formatDate,
  formatUploader,
  isDownloadable,
} from "@/lib/format";
import type { DocumentType, Engagement, UploaderKind } from "@/lib/types";

import { PdfViewerModal } from "./pdf-viewer-modal";
import { DocumentStatusBadge } from "./status-badge";
import { Button, Card, cx } from "./ui";
import { useToast } from "./toast";

const ALL = "all";

interface Filters {
  search: string;
  typeId: string;
  status: string;
  uploadedBy: string;
  engagementId: string;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  typeId: ALL,
  status: ALL,
  uploadedBy: ALL,
  engagementId: ALL,
};

function matches(row: DocumentRow, filters: Filters) {
  const haystack =
    `${row.document.fileName} ${row.documentType.name} ${row.engagement.name}`.toLowerCase();

  if (filters.search && !haystack.includes(filters.search.toLowerCase())) {
    return false;
  }
  if (filters.typeId !== ALL && row.documentType.id !== filters.typeId) {
    return false;
  }
  if (filters.status !== ALL && row.document.status !== filters.status) {
    return false;
  }
  if (
    filters.uploadedBy !== ALL &&
    row.document.uploadedBy !== filters.uploadedBy
  ) {
    return false;
  }
  if (
    filters.engagementId !== ALL &&
    row.engagement.id !== filters.engagementId
  ) {
    return false;
  }
  return true;
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-hairline bg-white px-2.5 py-2 text-sm font-normal text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DocumentBrowser({
  rows,
  documentTypes,
  engagements,
  groupByType = false,
  enableBulkSelect = false,
  showEngagementColumn = false,
}: {
  rows: DocumentRow[];
  documentTypes: DocumentType[];
  engagements?: Engagement[];
  groupByType?: boolean;
  enableBulkSelect?: boolean;
  showEngagementColumn?: boolean;
}) {
  const { showToast } = useToast();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<DocumentRow | null>(null);

  const visibleRows = useMemo(
    () => rows.filter((row) => matches(row, filters)),
    [rows, filters],
  );

  const filtersActive = useMemo(
    () =>
      (Object.keys(EMPTY_FILTERS) as (keyof Filters)[]).some(
        (key) => filters[key] !== EMPTY_FILTERS[key],
      ),
    [filters],
  );

  const selectedRows = visibleRows.filter((row) =>
    selected.has(row.document.id),
  );
  // Only downloadable documents can be selected, so "select all" ignores the
  // rest rather than producing a selection that cannot be acted on.
  const selectableRows = visibleRows.filter((row) =>
    isDownloadable(row.document),
  );
  const allSelectableSelected =
    selectableRows.length > 0 && selectedRows.length === selectableRows.length;

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleRow(documentId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  }

  function toggleAllSelectable() {
    setSelected((current) => {
      const next = new Set(current);
      if (allSelectableSelected) {
        for (const row of selectableRows) next.delete(row.document.id);
      } else {
        for (const row of selectableRows) next.add(row.document.id);
      }
      return next;
    });
  }

  function downloadOne(row: DocumentRow) {
    if (!isDownloadable(row.document) || !row.document.fileUrl) return;
    triggerDownload(row.document.fileUrl, row.document.fileName);
    showToast(`Downloading “${row.document.fileName}”`);
    void logDownload(row.document.id);
  }

  async function downloadSelected() {
    const downloadable = selectedRows.filter((row) =>
      isDownloadable(row.document),
    );
    const skipped = selectedRows.length - downloadable.length;

    if (downloadable.length === 0) {
      showToast(
        "Nothing to download — preliminary documents cannot be downloaded.",
        "info",
      );
      return;
    }

    showToast(
      skipped > 0
        ? `Downloading ${downloadable.length} of ${selectedRows.length} — ${skipped} preliminary ${
            skipped === 1 ? "document was" : "documents were"
          } skipped.`
        : downloadable.length === 1
          ? `Downloading “${downloadable[0].document.fileName}”`
          : `Downloading ${downloadable.length} documents`,
      skipped > 0 ? "info" : "success",
    );

    for (const row of downloadable) void logDownload(row.document.id);
    await triggerSequentialDownloads(
      downloadable.map((row) => ({
        fileUrl: row.document.fileUrl!,
        fileName: row.document.fileName,
      })),
    );
  }

  const typeOptions = [
    { value: ALL, label: "All types" },
    ...documentTypes.map((type) => ({ value: type.id, label: type.name })),
  ];
  const presentStatuses = DOCUMENT_STATUSES.filter((status) =>
    rows.some((row) => row.document.status === status),
  );
  const statusOptions = [
    { value: ALL, label: "All statuses" },
    ...presentStatuses.map((status) => ({
      value: status,
      label: DOCUMENT_STATUS_META[status].label,
    })),
  ];
  const uploaderOptions = [
    { value: ALL, label: "Anyone" },
    ...UPLOADER_KINDS.map((kind: UploaderKind) => ({
      value: kind,
      label: kind === "client" ? "You" : "Boa Safra Ag",
    })),
  ];

  const columnCount =
    2 +
    (enableBulkSelect ? 1 : 0) +
    (groupByType ? 0 : 1) +
    (showEngagementColumn ? 1 : 0) +
    4;

  const tableProps = {
    columnCount,
    enableBulkSelect,
    showEngagementColumn,
    selected,
    allSelected: allSelectableSelected,
    onToggleRow: toggleRow,
    onToggleAll: toggleAllSelectable,
    onPreview: setPreview,
    onDownload: downloadOne,
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-xs font-medium text-muted">
            Search
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="File name, type, or engagement"
                className="w-full rounded-md border border-hairline bg-white py-2 pr-2.5 pl-8 text-sm font-normal text-ink placeholder:text-muted/70"
              />
            </span>
          </label>

          <Select
            label="Document type"
            value={filters.typeId}
            onChange={(value) => setFilter("typeId", value)}
            options={typeOptions}
          />
          {presentStatuses.length > 1 ? (
            <Select
              label="Status"
              value={filters.status}
              onChange={(value) => setFilter("status", value)}
              options={statusOptions}
            />
          ) : null}
          <Select
            label="Uploaded by"
            value={filters.uploadedBy}
            onChange={(value) => setFilter("uploadedBy", value)}
            options={uploaderOptions}
          />
          {engagements ? (
            <Select
              label="Engagement"
              value={filters.engagementId}
              onChange={(value) => setFilter("engagementId", value)}
              options={[
                { value: ALL, label: "All engagements" },
                ...engagements.map((engagement) => ({
                  value: engagement.id,
                  label: engagement.name,
                })),
              ]}
            />
          ) : null}

          {filtersActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          ) : null}
        </div>

        <p aria-live="polite" className="mt-3 text-xs text-muted">
          Showing {visibleRows.length} of {rows.length}{" "}
          {rows.length === 1 ? "document" : "documents"}
        </p>
      </Card>

      {enableBulkSelect && selectedRows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-sm text-brand-900">
            {selectedRows.length}{" "}
            {selectedRows.length === 1 ? "document" : "documents"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Clear selection
            </Button>
            <Button size="sm" onClick={downloadSelected}>
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              Download selected
            </Button>
          </div>
        </div>
      ) : null}

      {groupByType ? (
        <div className="space-y-4">
          {documentTypes.map((documentType) => {
            const typeRows = visibleRows.filter(
              (row) => row.documentType.id === documentType.id,
            );
            const allTypeRows = rows.filter(
              (row) => row.documentType.id === documentType.id,
            );
            const hasFiles = allTypeRows.some((row) => row.document.fileUrl);

            return (
              <Card key={documentType.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">
                      <span className="mr-2 text-muted tabular-nums">
                        {documentType.order}.
                      </span>
                      {documentType.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">
                      {documentType.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted tabular-nums">
                    {allTypeRows.length}{" "}
                    {allTypeRows.length === 1 ? "document" : "documents"}
                  </span>
                </div>

                {typeRows.length > 0 ? (
                  <DocumentTable
                    {...tableProps}
                    rows={typeRows}
                    caption={`${documentType.name} documents`}
                    minWidthClass="min-w-[46rem]"
                    showTypeColumn={false}
                  />
                ) : allTypeRows.length > 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted">
                    No documents of this type match the current filters.
                  </p>
                ) : (
                  <AwaitingPanel documentType={documentType} />
                )}

                {/*
                  Upload lands per document type, so the extension point sits
                  inside the step it belongs to rather than as one generic
                  action somewhere else.
                */}
                {documentType.providedBy === "client" && !hasFiles ? (
                  <UploadDropZone documentType={documentType} />
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          {visibleRows.length > 0 ? (
            <DocumentTable
              {...tableProps}
              rows={visibleRows}
              caption="All documents"
              minWidthClass="min-w-[60rem]"
              showTypeColumn
            />
          ) : (
            <p className="px-4 py-10 text-center text-sm text-muted">
              No documents match the current filters.
            </p>
          )}
        </Card>
      )}

      {preview?.document.fileUrl ? (
        <PdfViewerModal
          fileName={preview.document.fileName}
          fileUrl={preview.document.fileUrl}
          subtitle={`${preview.documentType.name} · ${preview.engagement.name}`}
          isPreliminary={!isDownloadable(preview.document)}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}

function AwaitingPanel({ documentType }: { documentType: DocumentType }) {
  const awaitingClient = documentType.providedBy === "client";

  return (
    <div
      className={cx(
        "px-4 py-5",
        awaitingClient ? "bg-orange-50" : "bg-canvas",
      )}
    >
      <p
        className={cx(
          "text-sm font-medium",
          awaitingClient ? "text-orange-900" : "text-ink",
        )}
      >
        {awaitingClient ? "Awaiting your upload" : "Awaiting Boa Safra Ag"}
      </p>
      <p className="mt-0.5 text-xs text-muted">
        {awaitingClient
          ? "Nothing has been filed yet."
          : "We will post these here as soon as they are ready."}
      </p>
    </div>
  );
}

/** Disabled placeholder for the per-document-type upload flow. */
function UploadDropZone({ documentType }: { documentType: DocumentType }) {
  return (
    <div className="px-4 pt-1 pb-4">
      <div
        title="Coming soon"
        aria-disabled="true"
        className="flex cursor-not-allowed flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-hairline bg-canvas/60 px-4 py-6 text-center"
      >
        <Upload aria-hidden="true" className="h-5 w-5 text-muted" />
        <p className="text-sm font-medium text-muted">
          Upload your {documentType.name} here
        </p>
        <p className="text-xs text-muted">
          Coming soon — for now your engagement lead will collect these
          directly.
        </p>
      </div>
    </div>
  );
}

function DocumentTable({
  rows,
  caption,
  columnCount,
  minWidthClass,
  enableBulkSelect,
  showTypeColumn,
  showEngagementColumn,
  selected,
  allSelected,
  onToggleRow,
  onToggleAll,
  onPreview,
  onDownload,
}: {
  rows: DocumentRow[];
  caption: string;
  columnCount: number;
  minWidthClass: string;
  enableBulkSelect: boolean;
  showTypeColumn: boolean;
  showEngagementColumn: boolean;
  selected: Set<string>;
  allSelected: boolean;
  onToggleRow: (documentId: string) => void;
  onToggleAll: () => void;
  onPreview: (row: DocumentRow) => void;
  onDownload: (row: DocumentRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cx(
          "w-full border-collapse text-left text-sm",
          minWidthClass,
        )}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-hairline bg-canvas text-xs tracking-wide text-muted uppercase">
            {enableBulkSelect ? (
              <th scope="col" className="w-9 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Select all downloadable documents"
                  className="h-4 w-4 rounded border-hairline accent-brand-700"
                />
              </th>
            ) : null}
            <th scope="col" className="px-3 py-2.5 font-semibold">
              Document
            </th>
            {showTypeColumn ? (
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Type
              </th>
            ) : null}
            {showEngagementColumn ? (
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Engagement
              </th>
            ) : null}
            <th scope="col" className="px-3 py-2.5 font-semibold">
              Status
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold">
              Uploaded by
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold">
              Date
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">
              Size
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = selected.has(row.document.id);
            const downloadable = isDownloadable(row.document);
            const previewable = Boolean(row.document.fileUrl);

            return (
              <tr
                key={row.document.id}
                className={cx(
                  "border-b border-hairline last:border-b-0",
                  isSelected ? "bg-brand-50/60" : "hover:bg-canvas/70",
                )}
              >
                {enableBulkSelect ? (
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!downloadable}
                      onChange={() => onToggleRow(row.document.id)}
                      aria-label={
                        downloadable
                          ? `Select ${row.document.fileName}`
                          : `${row.document.fileName} cannot be downloaded`
                      }
                      title={
                        downloadable
                          ? undefined
                          : "Only final documents can be downloaded"
                      }
                      className="h-4 w-4 rounded border-hairline accent-brand-700 disabled:opacity-40"
                    />
                  </td>
                ) : null}

                <th
                  scope="row"
                  className="max-w-[16rem] px-3 py-3 align-middle font-normal"
                >
                  <Link
                    href={`/documents/${row.document.id}`}
                    className="font-medium text-ink underline-offset-2 hover:text-brand-700 hover:underline"
                  >
                    {row.document.fileName}
                  </Link>
                  <span className="mt-0.5 block text-xs text-muted">
                    {row.document.fileUrl
                      ? `Version ${row.document.version}`
                      : "Not yet provided"}
                  </span>
                </th>

                {showTypeColumn ? (
                  <td className="px-3 py-3 align-middle text-muted">
                    {row.documentType.name}
                  </td>
                ) : null}
                {showEngagementColumn ? (
                  <td className="px-3 py-3 align-middle text-muted">
                    <Link
                      href={`/engagements/${row.engagement.id}`}
                      className="underline-offset-2 hover:text-brand-700 hover:underline"
                    >
                      {row.engagement.name}
                    </Link>
                  </td>
                ) : null}
                <td className="px-3 py-3 align-middle">
                  <DocumentStatusBadge status={row.document.status} />
                </td>
                <td className="px-3 py-3 align-middle text-muted">
                  {formatUploader(row.document.uploadedBy)}
                </td>
                <td className="px-3 py-3 align-middle whitespace-nowrap text-muted">
                  {formatDate(row.document.uploadedAt)}
                </td>
                <td className="px-3 py-3 text-right align-middle whitespace-nowrap text-muted tabular-nums">
                  {formatBytes(row.document.sizeBytes)}
                </td>
                <td className="px-3 py-3 align-middle">
                  <div className="flex items-center justify-end gap-2">
                    {previewable ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPreview(row)}
                      >
                        <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>View</span>
                        <span className="sr-only"> {row.document.fileName}</span>
                      </Button>
                    ) : null}
                    {downloadable ? (
                      <Button size="sm" onClick={() => onDownload(row)}>
                        <Download aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>Download</span>
                        <span className="sr-only"> {row.document.fileName}</span>
                      </Button>
                    ) : (
                      <span className="text-xs whitespace-nowrap text-muted">
                        {previewable ? "Preview only" : "Awaiting upload"}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columnCount}
                className="px-4 py-10 text-center text-sm text-muted"
              >
                No documents match the current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
