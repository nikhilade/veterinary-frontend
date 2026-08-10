import { useEffect, useState } from "react";
import { FileText, Download, Loader2, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { PrescriptionPdf } from "@/lib/api/types";

function base64ToBlobUrl(base64: string, mime: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

/** Fetches GET /prescriptions/{id}/pdf, shows an inline preview, then downloads. */
export function PrescriptionPdfButton({
  prescriptionId,
  label = "Generate PDF",
  className = "",
}: {
  prescriptionId: string;
  label?: string;
  className?: string;
}) {
  const [pdf, setPdf] = useState<PrescriptionPdf | null>(null);
  const [href, setHref] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (href) URL.revokeObjectURL(href);
  }, [href]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const result = await apiClient.get<PrescriptionPdf>(endpoints.prescriptions.pdf(prescriptionId));
      setPdf(result);
      setHref(base64ToBlobUrl(result.contentBase64, result.mimeType));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the PDF.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    if (href) URL.revokeObjectURL(href);
    setHref("");
    setPdf(null);
  }


  return (
    <div className={className}>
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-forest px-4 py-2 text-sm font-medium text-forest disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
        {loading ? "Generating…" : label}
      </button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      {pdf ? (
        <div className="mt-4 rounded-[1.25rem] border border-border bg-background p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{pdf.filename}</p>
            <div className="flex items-center gap-2">
              <a
                href={href}
                download={pdf.filename}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs font-medium text-primary-foreground"
              >
                <Download className="size-3.5" />
                Download
              </a>
              <button
                type="button"
                aria-label="Close preview"
                onClick={close}
                className="inline-flex size-8 items-center justify-center rounded-full border border-border"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
          <object data={href} type="application/pdf" className="h-[28rem] w-full rounded-[1rem]" aria-label="Prescription preview">
            <p className="p-4 text-sm text-foreground/60">
              Inline preview isn’t supported here —{" "}
              <a href={href} download={pdf.filename} className="underline">
                download the PDF
              </a>
              .
            </p>
          </object>

        </div>
      ) : null}
    </div>
  );
}
