'use client';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Compass, LogIn, Plus } from 'lucide-react';
import { useAccount } from '../../hooks/useAccount';

const NAV_ITEMS = [
  { href: '/dashboard', icon: BookOpen, label: 'StudyPal', match: /^\/(dashboard|courses|chat)(\/|$)/ },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/courses/new', icon: Plus, label: 'New' },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAccount();

  const isActive = (href: string, match?: RegExp) => {
    if (match) return match.test(pathname);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 px-2 rounded-xl transition-all duration-150 ${
      active ? 'text-accent bg-accent-muted/50' : 'text-ink-faint'
    }`;

  if (!user) {
    return (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-bg-border bg-bg-surface/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] shadow-panel-lg">
        <div className="flex items-stretch justify-around px-4 pt-1.5 pb-1.5">
          <button
            type="button"
            onClick={() => router.push('/explore')}
            className={tabClass(pathname === '/explore' || pathname.startsWith('/explore/'))}
          >
            <Compass className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-[10px] font-semibold">Explore</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className={`${tabClass(false)} text-accent`}
          >
            <LogIn className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-[10px] font-semibold">Sign in</span>
          </button>
        </div>
      </nav>
    );
  }

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
              onClick={() => router.push(href)}
              className={tabClass(active)}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
