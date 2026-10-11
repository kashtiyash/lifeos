import type { Metadata } from "next";
import { StickyNoteIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Notes",
};

export default function NotesPage() {
  return (
    <>
      <PageHeader
        title="Notes"
        description="Markdown notes, sanitized before rendering."
      />
      <EmptyState
        icon={StickyNoteIcon}
        title="No notes yet"
        description="Notes with rehype-sanitize arrive in P-7."
      />
    </>
  );
}
