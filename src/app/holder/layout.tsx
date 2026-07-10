'use client';

import { RoleGuard } from '@/components/RoleGuard';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';

const holderMenu = [
  {
    label: 'ใบรับรองของฉัน',
    href: '/holder/dashboard',
    icon: '/educhain-logo.png',
  },
  {
    label: 'คำร้องเอกสารของฉัน',
    href: '/holder/requests',
    icon: '📨',
  },
  {
    label: 'แชร์เอกสาร',
    href: '/holder/share',
    icon: '🔗',
  },
  {
    label: 'ประวัติการใช้งาน',
    href: '/holder/history',
    icon: '📊',
  },
  {
    label: 'ตั้งค่าบัญชีผู้ใช้งาน',
    href: '/holder/settings',
    icon: '⚙️',
  },
];

function compactName(...parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(' ');
}

export default function HolderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const holderName =
    compactName(user?.firstNameTh, user?.lastNameTh) ||
    compactName(user?.firstNameEn, user?.lastNameEn) ||
    user?.name ||
    'นักศึกษา';

  return (
    <RoleGuard role="HOLDER">
      <div className="flex min-h-screen bg-[#f5f7fb]">
        <Sidebar
          title={holderName}
          subtitle={user?.faculty || 'ผู้ถือเอกสาร'}
          items={holderMenu}
        />

        <main className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
            <h1 className="text-2xl font-bold text-blue-600">
              ระบบนักศึกษา
            </h1>

            <span className="text-sm font-medium text-slate-500">
              ผู้ถือเอกสาร (Holder)
            </span>
          </header>

          <div className="p-8">{children}</div>
        </main>
      </div>
    </RoleGuard>
  );
}
