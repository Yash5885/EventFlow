import { ReactNode } from 'react';

export function Sidebar({ children }: { children: ReactNode }) {
  return <aside className="w-full border-r border-border bg-white p-4 md:w-64">{children}</aside>;
}

