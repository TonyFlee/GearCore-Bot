import Link from "next/link";
import type { ReactNode } from "react";
import LogoutButton from "./LogoutButton";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function DashboardShell({ title, description, children }: Props) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>GearCore Bot</strong>
          <span>Control panel</span>
        </div>
        <nav className="nav">
          <Link href="/">Status</Link>
          <Link href="/announcements">Announcements</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/support">Support inbox</Link>
        </nav>
        <LogoutButton />
      </aside>
      <main className="main">
        <header className="page-header">
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {children}
      </main>
    </div>
  );
}
