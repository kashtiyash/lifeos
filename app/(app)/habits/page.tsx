import type { Metadata } from "next";
import { RepeatIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Habits",
};

export default function HabitsPage() {
  return (
    <>
      <PageHeader
        title="Habits"
        description="Daily check-ins, pause/archive, and streaks."
      />
      <EmptyState
        icon={RepeatIcon}
        title="No habits yet"
        description="Habits, logs, and timezone-aware streaks arrive in P-5."
      />
    </>
  );
}
