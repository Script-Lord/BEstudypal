'use client';
import { ReactNode } from 'react';
import { LeftNav } from './LeftNav';

interface AppShellProps {
  children: ReactNode;
  sources?: ReactNode;
  studio?: ReactNode;
  header?: ReactNode;
}

export function AppShell({ children, sources, studio, header }: AppShellProps) {
  return (
    <div className="h-dvh bg-bg-base flex overflow-hidden">
      <LeftNav />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {header}
        <div className="flex-1 flex min-h-0 overflow-hidden pr-2 pb-2 pl-2">
          {sources}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-surface border border-bg-border rounded-2xl">
            {children}
          </main>
          {studio}
        </div>
      </div>
    </div>
  );
}
