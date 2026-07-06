import { RoleGuard } from '@/components/RoleGuard';
import { Sidebar } from '@/components/Sidebar';

const holderMenu = [
  {
    label: 'ใบรับรองของฉัน',
    href: '/holder/dashboard',
    icon: '📄',
  },
  {
    label: 'แชร์เอกสาร (VP)',
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

export default function HolderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="HOLDER">
      <div className="flex min-h-screen bg-[#f5f7fb]">
        <Sidebar
          title="นักศึกษา"
          subtitle="ผู้ถือเอกสาร (Holder)"
          items={holderMenu}
        />

        <main className="flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
            <h1 className="text-2xl font-bold text-blue-600">
              ระบบนักศึกษา
            </h1>

            <span className="text-sm text-slate-500">
              Polygon Amoy Testnet
            </span>
          </header>

          <div className="p-8">{children}</div>
        </main>
      </div>
    </RoleGuard>
  );
}