import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, FileText, ShieldCheck, X } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel } from "@/components/app/ui";
import { INR, MoneyInput } from "@/components/app/kit/MoneyInput";
import { IdempotentSubmitButton } from "@/components/app/kit/IdempotentSubmitButton";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/store";
import { can } from "@/lib/auth/permissions";
import { SUPER_ADMIN_REFUND_THRESHOLD } from "@/lib/api/billing-types";
import type { CreditNote, InvoiceDetail, Refund } from "@/lib/api/billing-types";

export const Route = createFileRoute("/app/refunds")({
  head: () => ({
    meta: [
      { title: "Refunds & Credit Notes | Pet Good Console" },
      { name: "description", content: "Dual-authorisation refund requests with automatic GST credit notes." },
      { property: "og:title", content: "Refunds & Credit Notes | Pet Good Console" },
      { property: "og:description", content: "Request, approve and document clinic refunds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RefundsPage,
});

const steps = ["Request", "Admin approval", "Credit note & payout"];

function RefundsPage() {
  const { user, role } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceDetail[] | null>(null);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [notes, setNotes] = useState<CreditNote[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const canApprove = can(role, "refunds:approve");
  const canRequest = can(role, "refunds:request");

  const load = useCallback(() => {
    apiClient
      .get<InvoiceDetail[] | { content: InvoiceDetail[] }>(endpoints.billing.invoices)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.content ?? []);
        setInvoices(list.filter((i) => i.amountPaid > 0));
      })
      .catch(() => setInvoices([]));
    apiClient.get<Refund[]>(endpoints.refunds.list).then(setRefunds).catch(() => setRefunds([]));
    apiClient.get<CreditNote[]>(endpoints.creditNotes.list).then(setNotes).catch(() => setNotes([]));
  }, []);

  useEffect(() => load(), [load]);

  const invoice = (invoices ?? []).find((i) => i.id === invoiceId) ?? null;
  const needsSuperAdmin = amount > SUPER_ADMIN_REFUND_THRESHOLD;

  async function submitRequest(headers: { "Idempotency-Key": string }) {
    setError("");
    if (!invoice) throw new Error("Select the invoice being refunded.");
    return apiClient.post<Refund>(
      endpoints.refunds.create,
      { invoiceId, amount, reason, requestedBy: user?.name ?? "Billing Staff" },
      headers,
    );
  }

  async function decide(refund: Refund, action: "approve" | "reject") {
    setError("");
    setBusy(refund.id);
    try {
      const path = action === "approve" ? endpoints.refunds.approve(refund.id) : endpoints.refunds.reject(refund.id);
      await apiClient.post<Refund>(path, {
        approver_name: user?.name ?? "Administrator",
        approver_role: role,
        reason: action === "reject" ? "Rejected after review." : undefined,
      });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update this request.");
    } finally {
      setBusy("");
    }
  }

  return (
    <StaffLayout title="Refunds" subtitle="Dual authorisation and credit notes" permission="billing:read">
      {!invoices ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <Panel title="How a refund moves">
            <ol className="grid gap-3 sm:grid-cols-3">
              {steps.map((s, index) => (
                <li key={s} className="rounded-2xl border border-border p-4">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-forest text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="mt-2 text-sm font-medium">{s}</p>
                  <p className="mt-1 text-xs text-foreground/55">
                    {index === 0
                      ? "Billing staff raise the request with an amount and reason."
                      : index === 1
                        ? "A different administrator authorises it — nobody approves their own request."
                        : "GST-finalised invoices get a sequential credit note before the payout."}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>

          {error ? (
            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <Panel title="Step 1 · Request a refund">
              {!canRequest ? (
                <EmptyState message="Your role can review refunds but not raise them." />
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground/60">Paid invoice</label>
                    <select
                      value={invoiceId}
                      onChange={(e) => {
                        setInvoiceId(e.target.value);
                        const next = invoices.find((i) => i.id === e.target.value);
                        setAmount(next ? next.amountPaid : 0);
                      }}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest"
                    >
                      <option value="">Select an invoice…</option>
                      {invoices.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.invoiceNumber} · {i.ownerName} · paid {INR(i.amountPaid)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <MoneyInput label="Refund amount" value={amount} onChange={setAmount} />

                  {invoice?.gstFinalised ? (
                    <p className="rounded-2xl bg-muted px-4 py-3 text-xs text-foreground/65">
                      {invoice.invoiceNumber} is GST-finalised — a sequential credit note is generated automatically on
                      approval, before the money moves.
                    </p>
                  ) : null}

                  {needsSuperAdmin ? (
                    <div className="flex items-start gap-3 rounded-2xl bg-clay/15 p-4 text-sm text-clay">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <p>
                        Refunds above ₹{SUPER_ADMIN_REFUND_THRESHOLD.toLocaleString("en-IN")} require{" "}
                        <span className="font-semibold">Super Admin</span> approval. This request will wait for that
                        authorisation.
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground/60">Reason</label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this being refunded?"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest"
                    />
                  </div>

                  <div title="Refunds coming soon">
                    <IdempotentSubmitButton
                      key={invoiceId}
                      disabled={true}
                      onSubmit={submitRequest}
                      onSuccess={() => {
                        setReason("");
                        setAmount(0);
                        setInvoiceId("");
                        load();
                      }}
                    >
                      Submit for approval
                    </IdempotentSubmitButton>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title={`Step 2 · Approvals (${refunds.filter((r) => r.status === "PENDING_APPROVAL").length} pending)`}>
              {refunds.length === 0 ? (
                <EmptyState message="No refund requests yet." />
              ) : (
                <ul className="space-y-3">
                  {refunds.map((r) => (
                    <li key={r.id} className="rounded-2xl border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            <span className="block font-medium">{r.invoiceNumber}</span>
                            <span className="block text-xs text-foreground/55">
                               requested by {r.requestedBy} · {new Date(r.requestedAt).toLocaleDateString()}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-foreground/60">
                            {r.ownerName} — {r.reason}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                            r.status === "COMPLETED"
                              ? "bg-forest/10 text-forest"
                              : r.status === "REJECTED"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-clay/15 text-clay"
                          }`}
                        >
                          {r.status.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>

                      {r.requiresSuperAdmin && r.status === "PENDING_APPROVAL" ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-clay">
                          <ShieldCheck className="size-3.5" /> Super Admin authorisation required
                        </p>
                      ) : null}

                      {r.creditNote ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                          <FileText className="size-3.5" /> Credit note {r.creditNote.number} ·{" "}
                          {INR(r.creditNote.amount)}
                        </p>
                      ) : null}

                      {r.status === "PENDING_APPROVAL" && canApprove ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            disabled={busy === r.id}
                            onClick={() => decide(r, "approve")}
                            className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
                          >
                            <Check className="size-3.5" /> Approve
                          </button>
                          <button
                            disabled={busy === r.id}
                            onClick={() => decide(r, "reject")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium disabled:opacity-60"
                          >
                            <X className="size-3.5" /> Reject
                          </button>
                        </div>
                      ) : r.status === "PENDING_APPROVAL" ? (
                        <p className="mt-3 text-xs text-foreground/50">Awaiting an administrator.</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title={`Step 3 · Credit notes (${notes.length})`}>
            {notes.length === 0 ? (
              <EmptyState message="Credit notes appear here once GST-finalised refunds are approved." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="text-xs uppercase text-foreground/50">
                    <tr>
                      <th className="pb-3">Credit note</th>
                      <th className="pb-3">Against invoice</th>
                      <th className="pb-3">Issued</th>
                      <th className="pb-3">Tax reversed</th>
                      <th className="pb-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((n) => (
                      <tr key={n.id} className="border-t border-border">
                        <td className="py-3 font-medium">{n.number}</td>
                        <td className="py-3 text-foreground/70">Against {n.invoiceNumber}</td>
                        <td className="py-3 text-foreground/70">{new Date(n.issuedAt).toLocaleDateString()}</td>
                        <td className="py-3 tabular-nums text-foreground/70">{INR(n.tax)}</td>
                        <td className="py-3 tabular-nums">{INR(n.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}
    </StaffLayout>
  );
}
