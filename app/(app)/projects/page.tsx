import type { Metadata } from "next";
import { FolderIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Group tasks into outcomes with milestones and progress."
      />
      <EmptyState
        icon={FolderIcon}
        title="No projects yet"
        description="Projects, milestones, and batch Trash arrive in P-3."
      />
    </>
  );
}
