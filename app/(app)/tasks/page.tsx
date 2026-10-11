import type { Metadata } from "next";
import { ListTodoIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Tasks",
};

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks"
        description="Everything on your plate, filtered your way."
      />
      <EmptyState
        icon={ListTodoIcon}
        title="No tasks yet"
        description="Tasks arrive in the first product slice. Each view ships with loading, empty, and retryable error states."
      />
    </>
  );
}
