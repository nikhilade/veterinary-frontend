import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Pet, PetOwner } from "@/lib/api/types";
import { OwnerSearchCombobox } from "@/components/app/kit/OwnerSearchCombobox";
import { PetPicker } from "@/components/app/kit/PetPicker";
import { SlotPicker } from "@/components/app/kit/SlotPicker";
import { DataTable } from "@/components/app/kit/DataTable";
import { IdempotentSubmitButton } from "@/components/app/kit/IdempotentSubmitButton";
import { MoneyInput } from "@/components/app/kit/MoneyInput";
import { GstBreakdown } from "@/components/app/kit/GstBreakdown";
import type { ReactNode } from "react";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Component Playground | Pet Good" },
      { name: "description", content: "Preview the shared building blocks used across the Pet Good staff console and owner portal." },
      { property: "og:title", content: "Component Playground | Pet Good" },
      { property: "og:description", content: "Owner search, pet picker, slot picker, data table, idempotent submit, money and GST components." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Playground,
});

function Story({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-card p-5 lg:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 mb-5 text-sm text-foreground/60">{note}</p>
      {children}
    </section>
  );
}

function Playground() {
  const [owner, setOwner] = useState<PetOwner | null>(null);
  const [pickerOwner, setPickerOwner] = useState<PetOwner | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [doctorId, setDoctorId] = useState("doc_1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<string | null>(null);
  const [amount, setAmount] = useState(2500);
  const [discount, setDiscount] = useState(250);
  const [interState, setInterState] = useState(false);

  return (
    <main className="min-h-screen bg-sand px-5 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-forest">Component Playground</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Shared building blocks, wired to the mock API through the typed client. Review these before we build the real
            screens.
          </p>
        </header>

        <Story title="1 · OwnerSearchCombobox" note="Type a phone number (e.g. 555), name or email. Falls back to a quick-create form.">
          <OwnerSearchCombobox value={owner} onChange={setOwner} />
          <pre className="mt-4 overflow-auto rounded-xl bg-muted p-3 text-xs">{JSON.stringify(owner, null, 2) || "null"}</pre>
        </Story>

        <Story title="2 · PetPicker" note="Cascading owner → pet select, with inline new-pet creation.">
          <PetPicker owner={pickerOwner} onOwnerChange={setPickerOwner} value={pet} onChange={setPet} />
          <pre className="mt-4 overflow-auto rounded-xl bg-muted p-3 text-xs">{pet ? JSON.stringify(pet, null, 2) : "no pet selected"}</pre>
        </Story>

        <Story title="3 · SlotPicker" note="Branch + doctor + date → available slots. Booked slots are disabled.">
          <div className="mb-4 max-w-xs">
            <label className="mb-1.5 block text-xs font-medium text-foreground/60">Doctor</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest"
            >
              <option value="doc_1">Dr. Amelia Reed</option>
              <option value="doc_2">Dr. Noah Fletcher</option>
              <option value="doc_3">Dr. Isabella Parker</option>
            </select>
          </div>
          <SlotPicker doctorId={doctorId} date={date} onDateChange={setDate} value={slot} onChange={setSlot} />
          <p className="mt-3 text-xs text-foreground/60">Selected: {slot ?? "—"}</p>
        </Story>

        <Story title="4 · DataTable" note="Cursor pagination via meta.next_cursor (2 rows per page here) plus client-side sorting.">
          <DataTable<PetOwner>
            rowKey={(o) => o.id}
            fetchPage={(cursor) =>
              apiClient.list<PetOwner>(endpoints.petOwners.list, { limit: 2, cursor: cursor ?? undefined })
            }
            columns={[
              { key: "name", header: "Owner", cell: (o) => o.name, sortValue: (o) => o.name },
              { key: "phone", header: "Phone", cell: (o) => o.phone },
              { key: "email", header: "Email", cell: (o) => o.email },
              { key: "pets", header: "Pets", cell: (o) => o.pets_count, sortValue: (o) => o.pets_count, className: "text-right" },
            ]}
          />
        </Story>

        <Story title="5 · IdempotentSubmitButton" note="Generates one UUID v4 per mount, sends it as Idempotency-Key, and reuses it on retry.">
          <IdempotentSubmitButton
            showKey
            onSubmit={(headers) =>
              apiClient.post(endpoints.appointments.create, {
                pet_id: pet?.id ?? "pet_1",
                doctor_id: doctorId,
                service: "Consultation",
                scheduled_at: slot ?? new Date().toISOString(),
              }, headers)
            }
          >
            Create appointment
          </IdempotentSubmitButton>
        </Story>

        <Story title="6 · MoneyInput + GstBreakdown" note="INR-formatted input and the tax summary reused by invoices and credit notes.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <MoneyInput label="Subtotal" value={amount} onChange={setAmount} />
              <MoneyInput label="Discount" value={discount} onChange={setDiscount} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={interState} onChange={(e) => setInterState(e.target.checked)} />
                Inter-state supply (IGST)
              </label>
            </div>
            <GstBreakdown subtotal={amount} discount={discount} gstRate={18} interState={interState} />
          </div>
        </Story>
      </div>
    </main>
  );
}
