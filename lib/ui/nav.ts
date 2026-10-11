import type { LucideIcon } from "lucide-react";
import {
  FolderIcon,
  HomeIcon,
  ListTodoIcon,
  RepeatIcon,
  StickyNoteIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Primary navigation. Home is Today (`docs/ui-guidelines.md`). The bottom
 * navigation keeps at most five items on phones.
 */
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: HomeIcon },
  { href: "/tasks", label: "Tasks", icon: ListTodoIcon },
  { href: "/projects", label: "Projects", icon: FolderIcon },
  { href: "/habits", label: "Habits", icon: RepeatIcon },
  { href: "/notes", label: "Notes", icon: StickyNoteIcon },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
