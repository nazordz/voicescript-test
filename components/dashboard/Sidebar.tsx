"use client";

import Link from "next/link";
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-full w-64 flex-col bg-base-100 p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Voicescript</h1>
        <p className="text-sm text-base-content/60">Court reporting ops</p>
      </div>
      <ul className="menu w-full p-0">
        {navItems.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={pathname.startsWith(href) ? "menu-active" : ""}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
