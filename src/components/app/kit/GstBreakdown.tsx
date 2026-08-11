import { INR } from "./MoneyInput";

export interface GstBreakdownInput {
  subtotal: number;
  discount?: number;
  gstRate?: number; // percent, e.g. 18
  /** Interstate supplies use IGST; intrastate splits into CGST + SGST. */
  interState?: boolean;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export function computeGst({ subtotal, discount = 0, gstRate = 18, interState = false }: GstBreakdownInput) {
  const taxable = Math.max(0, subtotal - discount);
  const tax = (taxable * gstRate) / 100;
  const cgst = interState ? 0 : tax / 2;
  const sgst = interState ? 0 : tax / 2;
  const igst = interState ? tax : 0;
  return { taxable, discount, cgst, sgst, igst, tax, grandTotal: taxable + tax };
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 text-sm ${strong ? "font-semibold text-forest" : ""}`}>
      <span className={strong ? "" : "text-foreground/60"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/** Invoice / credit-note tax summary. */
export function GstBreakdown(props: GstBreakdownInput) {
  const computed = computeGst(props);
  const taxable = computed.taxable;
  const discount = computed.discount;
  const cgst = props.cgst ?? computed.cgst;
  const sgst = props.sgst ?? computed.sgst;
  const igst = props.igst ?? computed.igst;
  const grandTotal = props.cgst !== undefined || props.sgst !== undefined || props.igst !== undefined
    ? taxable + cgst + sgst + igst
    : computed.grandTotal;
  const rate = props.gstRate ?? 18;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Row label="Subtotal" value={INR(props.subtotal)} />
      {discount ? <Row label="Discount" value={`− ${INR(discount)}`} /> : null}
      <Row label="Taxable value" value={INR(taxable)} />
      {props.interState ? (
        <Row label={`IGST @ ${rate}%`} value={INR(igst)} />
      ) : (
        <>
          <Row label={`CGST @ ${rate / 2}%`} value={INR(cgst)} />
          <Row label={`SGST @ ${rate / 2}%`} value={INR(sgst)} />
        </>
      )}
      <div className="mt-2 border-t border-border pt-2">
        <Row label="Grand total" value={INR(grandTotal)} strong />
      </div>
    </div>
  );
}
