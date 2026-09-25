import { useState } from "react";
import { useCreateLabResult } from "@/hooks/use-lab";
import { useAuth } from "@/lib/auth/store";

interface LabResultFormProps {
  labOrderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LabResultForm({ labOrderId, onSuccess, onCancel }: LabResultFormProps) {
  const { user } = useAuth();
  const createResult = useCreateLabResult();

  const [form, setForm] = useState({
    result: "",
    remarks: "",
    reportUrl: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    try {
      await createResult.mutateAsync({
        labOrderId,
        result: form.result,
        remarks: form.remarks,
        reportUrl: form.reportUrl,
        testedBy: user.id,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lab result");
    }
  };

  const fieldClass =
    "w-full rounded-[1.25rem] border border-border bg-background px-4 py-3 text-[15px] outline-none focus:border-forest";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">Result Summary *</label>
        <textarea
          required
          rows={3}
          value={form.result}
          onChange={(e) => setForm({ ...form, result: e.target.value })}
          placeholder="Enter the main lab result or findings..."
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">Additional Remarks</label>
        <textarea
          rows={2}
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          placeholder="Any additional notes or remarks"
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">Report URL (Optional)</label>
        <input
          type="url"
          value={form.reportUrl}
          onChange={(e) => setForm({ ...form, reportUrl: e.target.value })}
          placeholder="https://example.com/report.pdf"
          className={fieldClass}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 font-medium text-foreground/70 hover:bg-muted"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={createResult.isPending}
          className="rounded-full bg-forest px-6 py-2.5 font-medium text-primary-foreground disabled:opacity-60"
        >
          {createResult.isPending ? "Saving..." : "Save Result"}
        </button>
      </div>
    </form>
  );
}
