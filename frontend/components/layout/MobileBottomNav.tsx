'use client';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen, Compass, LayoutGrid, LogIn, MessageSquare, Plus,
} from 'lucide-react';
import { useAccount } from '../../hooks/useAccount';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Home' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: null, icon: MessageSquare, label: 'Chat', match: /\/courses\/|\/chat\/|\/explore\// },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAccount();

  const isActive = (href: string | null, match?: RegExp) => {
    if (match) return match.test(pathname);
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 min-w-[3.5rem] py-1.5 px-2 rounded-xl transition-all duration-150 ${
      active ? 'text-accent bg-accent-muted/50' : 'text-ink-faint'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-bg-border bg-bg-surface/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] shadow-panel-lg">
      <div className="flex items-stretch justify-around px-2 pt-1.5 pb-1.5">
        {NAV_ITEMS.map(item => {
          const { href, icon: Icon, label } = item;
          const match = 'match' in item ? item.match : undefined;
          const active = isActive(href, match);
          return (
            <button
              key={label}
              type="button"
              onClick={() => href && router.push(href)}
              className={tabClass(active)}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => router.push('/courses/new')}
          className={tabClass(false)}
        >
          <Plus className="w-5 h-5" strokeWidth={1.75} />
          <span className="text-[10px] font-semibold">New</span>
        </button>

        <button
          type="button"
          onClick={() => router.push(user ? '/dashboard' : '/login')}
          className={`${tabClass(false)} text-accent`}
        >
          {user ? <BookOpen className="w-5 h-5" strokeWidth={1.75} /> : <LogIn className="w-5 h-5" strokeWidth={1.75} />}
          <span className="text-[10px] font-semibold">{user ? 'StudyPal' : 'Sign in'}</span>
        </button>
      </div>
    </nav>
  );
}
