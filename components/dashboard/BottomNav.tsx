"use client";

import { usePathname } from "next/navigation";
import {
  BriefcaseIcon,
  MicrophoneIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/jobs", label: "Jobs", Icon: BriefcaseIcon },
  { href: "/reporters", label: "Reporters", Icon: MicrophoneIcon },
  { href: "/editors", label: "Editors", Icon: PencilSquareIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="btm-nav lg:hidden">
      {navItems.map(({ href, label, Icon }) => (
        <button
          key={href}
          type="button"
          className={pathname.startsWith(href) ? "active" : ""}
          onClick={() => { window.location.href = href; }}
        >
          <Icon className="h-5 w-5" />
          <span className="btm-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
