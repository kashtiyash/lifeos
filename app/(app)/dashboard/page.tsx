import type { Metadata } from "next";
import { SunriseIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Today",
};

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Today"
        description="Tasks, habits, and reminders for the current User Day."
      />
      <EmptyState
        icon={SunriseIcon}
        title="Nothing on your plate yet"
        description="Once tasks and habits exist, today's work shows up here. This is the empty, loading, and error state contract every data view follows."
      />
    </>
  );
}
