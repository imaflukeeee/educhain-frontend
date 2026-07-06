import { RoleGuard } from '@/components/RoleGuard';
import { Sidebar } from '@/components/Sidebar';

const issuerMenu = [
  {
    label: 'ออกเอกสารรับรองใบปริญญา',
    href: '/issuer/dashboard',
    icon: '📄',
  },
  {
    label: 'รายการใบรับรองที่ถูกออก',
    href: '/issuer/credentials',
    icon: '🗂️',
  },
  {
    label: 'ลายเซ็นดิจิทัล',
    href: '/issuer/signature',
    icon: '✒️',
  },
  {
    label: 'ตั้งค่าบัญชี',
    href: '/issuer/settings',
    icon: '⚙️',
  },
];

export default function IssuerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="ISSUER">
      <div className="flex min-h-screen bg-[#f5f7fb]">
        <Sidebar
          title="มหาวิทยาลัย"
          subtitle="ผู้ออกเอกสาร (Issuer)"
          items={issuerMenu}
        />

        <main className="flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
            <h1 className="text-2xl font-bold text-blue-600">
              ระบบมหาวิทยาลัย
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