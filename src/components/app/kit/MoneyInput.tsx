import { useState } from "react";

export const INR = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

/** INR-formatted currency input. Value is always a plain number in rupees. */
export function MoneyInput({ value, onChange, label = "Amount", placeholder = "0.00", disabled }: MoneyInputProps) {
  const [text, setText] = useState(value ? String(value) : "");
  const [focused, setFocused] = useState(false);

  return (
    <div>
      {label ? <label className="mb-1.5 block text-xs font-medium text-foreground/60">{label}</label> : null}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/50">₹</span>
        <input
          inputMode="decimal"
          disabled={disabled}
          placeholder={placeholder}
          value={focused ? text : value ? INR(value).replace("₹", "").trim() : ""}
          onFocus={() => {
            setFocused(true);
            setText(value ? String(value) : "");
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, "");
            setText(raw);
            onChange(Number(raw) || 0);
          }}
          className="w-full rounded-2xl border border-border bg-background py-2.5 pl-8 pr-4 text-sm tabular-nums outline-none focus:border-forest disabled:opacity-60"
        />
      </div>
    </div>
  );
}
