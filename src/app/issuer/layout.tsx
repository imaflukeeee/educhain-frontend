'use client';

import { RoleGuard } from '@/components/RoleGuard';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';

const issuerMenu = [
  {
    label: 'ภาพรวมระบบ',
    href: '/issuer/overview',
    icon: '📊',
  },
  {
    label: 'ออกเอกสารรับรองใบปริญญา',
    href: '/issuer/dashboard',
    icon: '/educhain-logo.png',
  },
  {
    label: 'รายการใบรับรองที่ถูกออก',
    href: '/issuer/credentials',
    icon: '🗂️',
  },
  {
    label: 'นักศึกษาทั้งหมด',
    href: '/issuer/students',
    icon: '🎓',
  },
  {
    label: 'คำร้องเอกสาร',
    href: '/issuer/requests',
    icon: '📨',
  },
  {
    label: 'แม่แบบเอกสาร',
    href: '/issuer/templates',
    icon: '📝',
  },
  {
    label: 'ออกเอกสารจำนวนมาก',
    href: '/issuer/batches',
    icon: '📚',
  },
  {
    label: 'ตรวจสอบและอนุมัติเอกสาร',
    href: '/issuer/workflow',
    icon: '✅',
  },
  {
    label: 'จัดการเจ้าหน้าที่',
    href: '/issuer/staff',
    icon: '👥',
  },
  {
    label: 'ลายเซ็นดิจิทัล',
    href: '/issuer/signature',
    icon: '✒️',
  },
  {
    label: 'จัดการคณะและสาขาวิชา',
    href: '/issuer/university',
    icon: '🏫',
  },
  {
    label: 'ตั้งค่าบัญชี',
    href: '/issuer/settings',
    icon: '⚙️',
  },
];

function getUniversityTitle(user: ReturnType<typeof useAuth>['user']) {
  return (
    user?.universityOwner?.universityNameTh ||
    user?.universityNameTh ||
    user?.universityOwner?.name ||
    user?.name ||
    'มหาวิทยาลัย'
  );
}

function getUniversitySubtitle(user: ReturnType<typeof useAuth>['user']) {
  return (
    user?.universityOwner?.universityNameEn ||
    user?.universityNameEn ||
    'ผู้ออกเอกสาร'
  );
}

export default function IssuerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <RoleGuard role="ISSUER">
      <div className="flex min-h-screen bg-[#f5f7fb]">
        <Sidebar
          title={getUniversityTitle(user)}
          subtitle={getUniversitySubtitle(user)}
          items={issuerMenu}
        />

        <main className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
            <h1 className="text-2xl font-bold text-blue-600">
              ระบบมหาวิทยาลัย
            </h1>

            <span className="text-sm font-medium text-slate-500">
              ผู้ออกเอกสาร (Issuer)
            </span>
          </header>

          <div className="p-8">{children}</div>
        </main>
      </div>
    </RoleGuard>
  );
}
