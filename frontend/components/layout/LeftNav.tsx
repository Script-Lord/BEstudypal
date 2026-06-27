'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen, Compass, LayoutGrid, LogIn, LogOut, MessageSquare, Plus, PanelLeft,
} from 'lucide-react';
import { useAccount } from '../../hooks/useAccount';
import { signOut } from '../../lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: null, icon: MessageSquare, label: 'Chat', match: /\/courses\/|\/chat\// },
] as const;

export function LeftNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAccount();
  const [expanded, setExpanded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string | null, match?: RegExp) => {
    if (match) return match.test(pathname) || pathname.startsWith('/explore/');
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.replace('/login');
  };

  const row = (active = false) =>
    `h-9 rounded-xl flex items-center gap-3 transition-all duration-150 ${
      expanded ? 'px-3 mx-2' : 'w-9 justify-center mx-auto'
    } ${active ? 'nav-active' : ''}`;

  return (
    <motion.aside
      animate={{ width: expanded ? 208 : 60 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="hidden md:flex shrink-0 bg-bg-surface/80 backdrop-blur-md border-r border-bg-border flex-col py-4 gap-0.5 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={`${row()} text-ink-faint hover:text-ink hover:bg-bg-elevated mb-2`}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <PanelLeft className="w-4 h-4 shrink-0" />
        {expanded && <span className="text-sm font-medium whitespace-nowrap">Collapse</span>}
      </button>

      <button
        type="button"
        onClick={() => router.push('/courses/new')}
        className={`${row()} text-ink-faint hover:text-accent hover:bg-accent-muted/60 mb-1`}
        aria-label="New course"
      >
        <Plus className="w-4 h-4 shrink-0" />
        {expanded && <span className="text-sm font-medium whitespace-nowrap">New course</span>}
      </button>

      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className={`${row()} text-accent mb-3`}
        aria-label="StudyPal home"
      >
        <BookOpen className="w-4 h-4 shrink-0" />
        {expanded && <span className="text-sm font-bold whitespace-nowrap tracking-tight">StudyPal</span>}
      </button>

      <div className="flex flex-col gap-0.5 flex-1 px-1">
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
              className={`${row(active)} ${
                active ? '' : 'text-ink-faint hover:text-ink hover:bg-bg-elevated'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {expanded && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-3 border-t border-bg-border flex flex-col gap-0.5">
        {user ? (
          <>
            <div
              className={`flex items-center gap-3 py-1 ${expanded ? 'px-3 mx-2' : 'justify-center mx-auto'}`}
              title={user.email ?? 'Account'}
            >
              <span className="w-8 h-8 rounded-full bg-accent-muted text-accent text-xs font-bold flex items-center justify-center shrink-0 uppercase ring-2 ring-accent/20">
                {(user.email?.[0] ?? 'U')}
              </span>
              {expanded && (
                <span className="text-xs text-ink-muted truncate">{user.email}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className={`${row()} text-ink-faint hover:text-status-failed hover:bg-status-failed/10 disabled:opacity-40`}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {expanded && <span className="text-sm font-medium whitespace-nowrap">Sign out</span>}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/login')}
            className={`${row()} text-ink-faint hover:text-ink hover:bg-bg-elevated`}
            aria-label="Sign in"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            {expanded && <span className="text-sm font-medium whitespace-nowrap">Sign in</span>}
          </button>
        )}
      </div>
    </motion.aside>
  );
}
