'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/api';

interface RoleGuardProps {
  role: UserRole;
  children: ReactNode;
}

export function RoleGuard({ role, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace(role === 'ISSUER' ? '/login/issuer' : '/login/holder');
      return;
    }

    if (user.role !== role) {
      router.replace(
        user.role === 'ISSUER' ? '/issuer/dashboard' : '/holder/dashboard',
      );
    }
  }, [isLoading, isAuthenticated, user, role, router]);

  if (isLoading || !isAuthenticated || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        กำลังตรวจสอบสิทธิ์การใช้งาน...
      </div>
    );
  }

  return children;
}