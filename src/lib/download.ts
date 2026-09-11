/**
 * Client-side download helpers. The mockup serves real PDFs from `public/docs`,
 * so a plain anchor with the `download` attribute is all that is needed.
 */

export function triggerDownload(fileUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = fileUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Downloads several files one after another. Browsers throttle simultaneous
 * downloads, so they are spaced out rather than zipped — a mockup does not need
 * the extra dependency.
 */
export async function triggerSequentialDownloads(
  files: { fileUrl: string; fileName: string }[],
  spacingMs = 400,
) {
  for (const [index, file] of files.entries()) {
    triggerDownload(file.fileUrl, file.fileName);
    if (index < files.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, spacingMs));
    }
  }
}
