import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

function uuidv4() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface IdempotentSubmitButtonProps {
  /** Receives the stable Idempotency-Key; pass it through to apiClient.post(path, body, headers). */
  onSubmit: (headers: { "Idempotency-Key": string }, key: string) => Promise<unknown>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onSuccess?: (result: unknown) => void;
  /** Shows the key under the button — handy in the playground. */
  showKey?: boolean;
}

/**
 * Submit button with at-most-once semantics: the UUID v4 key is generated once
 * per mount and reused on retries, so a network failure + retry never
 * double-creates the resource.
 */
export function IdempotentSubmitButton({
  onSubmit,
  children,
  className = "",
  disabled,
  onSuccess,
  showKey = false,
}: IdempotentSubmitButtonProps) {
  const keyRef = useRef<string>(uuidv4());
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function run() {
    setState("pending");
    setMessage("");
    try {
      const result = await onSubmit({ "Idempotency-Key": keyRef.current }, keyRef.current);
      setState("done");
      onSuccess?.(result);
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Request failed — retry uses the same key.");
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={run}
        disabled={disabled || state === "pending"}
        className={`inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60 ${className}`}
      >
        {state === "pending" ? <Loader2 className="size-4 animate-spin" /> : null}
        {state === "pending" ? "Submitting…" : state === "error" ? "Retry" : children}
      </button>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
      {state === "done" ? <p className="text-xs text-forest">Submitted.</p> : null}
      {showKey ? <p className="font-mono text-[11px] text-foreground/50">Idempotency-Key: {keyRef.current}</p> : null}
    </div>
  );
}
