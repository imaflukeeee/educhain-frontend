'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  title: string;
  subtitle: string;
  items: SidebarItem[];
}

export function Sidebar({ title, subtitle, items }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-blue-600 text-white">
      <div className="border-b border-white/20 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-blue-600">
            🎓
          </div>

          <div>
            <div className="font-bold leading-tight">{title}</div>
            <div className="text-xs text-blue-100">{subtitle}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-50 hover:bg-white/10',
              ].join(' ')}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/20 p-5">
        <button
          type="button"
          onClick={handleLogout}
          className="h-10 w-full rounded-lg bg-white text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}