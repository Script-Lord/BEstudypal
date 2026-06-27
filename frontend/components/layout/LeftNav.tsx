'use client';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen, Compass, LayoutGrid, MessageSquare, Plus, PanelLeft,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: null, icon: MessageSquare, label: 'Chat', match: /\/courses\/|\/chat\// },
] as const;

export function LeftNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string | null, match?: RegExp) => {
    if (match) return match.test(pathname);
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="w-[56px] shrink-0 bg-bg-base border-r border-bg-border flex flex-col items-center py-3 gap-1">
      <button
        type="button"
        className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-faint hover:text-ink hover:bg-bg-elevated transition-all mb-1"
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => router.push('/courses/new')}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-faint hover:text-secondary hover:bg-secondary-muted transition-all"
        aria-label="New course"
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-secondary mb-2"
        aria-label="StudyBuddy home"
      >
        <BookOpen className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(item => {
          const { href, icon: Icon, label } = item;
          const match = 'match' in item ? item.match : undefined;
          const active = isActive(href, match);
          return (
            <button
              key={label}
              type="button"
              onClick={() => href && router.push(href)}
              title={label}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                active
                  ? 'bg-secondary text-white shadow-lg shadow-secondary/25'
                  : 'text-ink-faint hover:text-ink hover:bg-bg-elevated'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
