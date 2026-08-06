import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, FileText, MessageSquare, PawPrint, Pencil, Plus, Upload } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, formatDate } from "@/components/app/ui";
import { PetForm } from "@/components/app/kit/PetForm";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { CommunicationLog, OwnerDocument, Pet, PetOwner } from "@/lib/api/types";

export const Route = createFileRoute("/app/owners/$id")({
  head: () => ({
    meta: [
      { title: "Owner Profile | Pet Good Console" },
      { name: "description", content: "Owner profile with pets, documents and communication history." },
      { property: "og:title", content: "Owner Profile | Pet Good Console" },
      { property: "og:description", content: "Everything about one client in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerDetailPage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

function OwnerDetailPage() {
  const { id } = Route.useParams();
  const [owner, setOwner] = useState<PetOwner | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [docs, setDocs] = useState<OwnerDocument[]>([]);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingPet, setAddingPet] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", address: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [o, p, d, c] = await Promise.all([
      apiClient.get<PetOwner>(endpoints.petOwners.detail(id)),
      apiClient.get<Pet[]>(endpoints.pets.byOwner(id)),
      apiClient.get<OwnerDocument[]>(endpoints.petOwners.documents(id)),
      apiClient.get<CommunicationLog[]>(endpoints.petOwners.communications(id)),
    ]);
    setOwner(o);
    setPets(p);
    setDocs(d);
    setLogs(c);
    setDraft({ name: o.name, email: o.email, phone: o.phone, address: o.address });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  async function saveOwner() {
    const updated = await apiClient.patch<PetOwner>(endpoints.petOwners.update(id), draft);
    setOwner(updated);
    setEditing(false);
  }

  async function uploadDoc(file: File | undefined) {
    if (!file) return;
    const created = await apiClient.post<OwnerDocument>(endpoints.petOwners.documents(id), {
      name: file.name,
      type: "Other",
      size_kb: Math.round(file.size / 1024),
    });
    setDocs((d) => [...d, created]);
  }

  return (
    <StaffLayout title={owner?.name ?? "Owner"} subtitle="Client profile" permission="owners:read">
      <Link to="/app/owners" className="mb-4 inline-flex items-center gap-1.5 text-sm text-forest">
        <ArrowLeft className="size-4" /> Back to owners
      </Link>

      {loading || !owner ? (
        <Loading />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Profile"
            action={
              <button onClick={() => setEditing((v) => !v)} className="inline-flex items-center gap-1.5 text-sm text-forest">
                <Pencil className="size-4" /> {editing ? "Cancel" : "Edit"}
              </button>
            }
          >
            {editing ? (
              <div className="space-y-3">
                <input className={field} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" />
                <input className={field} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
                <input className={field} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
                <textarea className={field} rows={3} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Address" />
                <button onClick={saveOwner} className="rounded-full bg-forest px-5 py-2.5 text-sm text-primary-foreground">
                  Save changes
                </button>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-foreground/60">Phone</dt>
                  <dd>{owner.phone}</dd>
                </div>
                <div>
                  <dt className="text-foreground/60">Email</dt>
                  <dd>{owner.email || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-foreground/60">Address</dt>
                  <dd>{owner.address || "—"}</dd>
                </div>
                <div>
                  <dt className="text-foreground/60">Client since</dt>
                  <dd>{formatDate(owner.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-foreground/60">Pets</dt>
                  <dd>{pets.length}</dd>
                </div>
              </dl>
            )}
          </Panel>

          <Panel
            title="Pets"
            action={
              <button onClick={() => setAddingPet((v) => !v)} className="inline-flex items-center gap-1.5 text-sm text-forest">
                <Plus className="size-4" /> {addingPet ? "Close" : "Add pet"}
              </button>
            }
          >
            {addingPet ? (
              <div className="mb-4 rounded-2xl border border-border p-4">
                <PetForm
                  ownerId={owner.id}
                  onSaved={(pet) => {
                    setPets((p) => (p.some((x) => x.id === pet.id) ? p : [...p, pet]));
                    setAddingPet(false);
                  }}
                />
              </div>
            ) : null}
            {pets.length === 0 ? (
              <EmptyState
                icon={<PawPrint className="size-7" />}
                title="No pets yet"
                message="This owner has no pets on record. Add their first pet to start a medical history."
              />
            ) : (
              <ul className="space-y-2">
                {pets.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/app/pets/$id"
                      params={{ id: p.id }}
                      className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm"
                    >
                      <PawPrint className="size-4 text-clay" />
                      <span>
                        <span className="block font-medium">{p.name}</span>
                        <span className="block text-xs text-foreground/60">
                          {p.species} · {p.breed} · {p.age_years}y
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Documents"
            action={
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-forest">
                <Upload className="size-4" /> Upload
                <input type="file" className="hidden" onChange={(e) => uploadDoc(e.target.files?.[0])} />
              </label>
            }
          >
            {docs.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-7" />}
                title="No documents"
                message="Upload ID proofs, consent forms or insurance papers for this client."
              />
            ) : (
              <ul className="space-y-2 text-sm">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
                    <span className="flex items-center gap-3">
                      <FileText className="size-4 text-clay" />
                      <span>
                        <span className="block font-medium">{d.name}</span>
                        <span className="block text-xs text-foreground/60">
                          {d.type} · {d.size_kb} KB
                        </span>
                      </span>
                    </span>
                    <span className="text-xs text-foreground/60">{formatDate(d.uploaded_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Communication history">
            {logs.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="size-7" />}
                title="Nothing sent yet"
                message="Reminders, invoices and call notes for this owner will appear here."
              />
            ) : (
              <ol className="space-y-3">
                {logs.map((l) => (
                  <li key={l.id} className="rounded-2xl border border-border px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{l.subject}</span>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{l.channel}</span>
                    </div>
                    <p className="mt-1 text-foreground/70">{l.body}</p>
                    <p className="mt-1 text-xs text-foreground/50">
                      {l.direction === "INBOUND" ? "Received" : "Sent"} · {formatDate(l.sent_at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      )}
    </StaffLayout>
  );
}
