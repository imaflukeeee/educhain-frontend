'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { TopNav } from '@/components/TopNav';
import { api, getApiErrorMessage } from '@/lib/api';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('กำลังยืนยันอีเมล...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('ไม่พบรหัสยืนยันอีเมล');
      return;
    }

    api.post<{ message: string }>('/auth/verify-email', { token })
      .then((response) => {
        setStatus('success');
        setMessage(response.data.message);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(getApiErrorMessage(error));
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <TopNav />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className={[
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl',
            status === 'success' ? 'bg-green-100 text-green-700' :
            status === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700',
          ].join(' ')}>
            {status === 'success' ? '✓' : status === 'error' ? '!' : '…'}
          </div>
          <h1 className="mt-5 text-xl font-bold text-slate-800">ยืนยันอีเมล</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          {status !== 'loading' ? (
            <Link href="/">
              <Button type="button" fullWidth className="mt-6">ไปหน้าเข้าสู่ระบบ</Button>
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
