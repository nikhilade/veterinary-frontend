import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Upload, UserRound } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { EmptyState, Loading, Panel, formatDate } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { OwnerDocument, PetOwner } from "@/lib/api/types";

export const Route = createFileRoute("/portal/profile")({
  head: () => ({
    meta: [
      { title: "My Profile | Pet Good Owner Portal" },
      { name: "description", content: "Manage your contact details and upload documents for your pet's clinic file." },
      { property: "og:title", content: "My Profile | Pet Good Owner Portal" },
      { property: "og:description", content: "Your contact details and documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

const OWNER_ID = "own_1";
const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

function ProfilePage() {
  const [owner, setOwner] = useState<PetOwner | null>(null);
  const [docs, setDocs] = useState<OwnerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ firstName: "", email: "", phoneNumber: "", address: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get<PetOwner>(endpoints.petOwners.detail(OWNER_ID)),
      apiClient.get<OwnerDocument[]>(endpoints.petOwners.documents(OWNER_ID)),
    ])
      .then(([o, d]) => {
        setOwner(o);
        setDocs(d);
        setDraft({ firstName: o.name, email: o.email, phoneNumber: o.phone, address: o.address });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    const updated = await apiClient.patch<PetOwner>(endpoints.petOwners.update(OWNER_ID), draft);
    setOwner(updated);
    setSaved(true);
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    const created = await apiClient.post<OwnerDocument>(endpoints.petOwners.documents(OWNER_ID), {
      name: file.name,
      type: "Other",
      sizeKb: Math.round(file.size / 1024),
    });
    setDocs((d) => [...d, created]);
  }

  return (
    <PortalLayout title="My Profile">
      {loading || !owner ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <Panel title="Contact details">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-forest/10 text-forest">
                <UserRound className="size-6" />
              </span>
              <div>
                <p className="font-medium">{owner.firstName}</p>
                <p className="text-xs text-foreground/60">Client since {formatDate(owner.createdAt)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <input className={field} value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} placeholder="Full name" />
              <input className={field} value={draft.phoneNumber} onChange={(e) => setDraft({ ...draft, phoneNumber: e.target.value })} placeholder="Phone" />
              <input className={field} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
              <textarea className={field} rows={3} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Address" />
              {saved ? <p className="text-sm text-forest">Profile updated.</p> : null}
              <button onClick={save} className="w-full rounded-full bg-forest px-5 py-3 text-sm text-primary-foreground">
                Save changes
              </button>
            </div>
          </Panel>

          <Panel
            title="My documents"
            action={
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-forest">
                <Upload className="size-4" /> Upload
                <input type="file" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
              </label>
            }
          >
            {docs.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-8" />}
                title="No documents yet"
                message="Upload your ID, insurance or consent forms so the clinic has them on file."
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
                          {d.type} · {d.sizeKb} KB
                        </span>
                      </span>
                    </span>
                    <span className="text-xs text-foreground/60">{formatDate(d.uploadedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </PortalLayout>
  );
}
