'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [message, setMessage] = useState('กำลังยืนยันอีเมล...');

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus('error');
        setMessage('ไม่พบรหัสยืนยันอีเมล');
        return;
      }

      try {
        const response = await api.post<{ message: string }>(
          '/auth/verify-email',
          { token },
        );

        setStatus('success');
        setMessage(response.data.message || 'ยืนยันอีเมลสำเร็จ');
      } catch (error) {
        setStatus('error');
        setMessage(getApiErrorMessage(error));
      }
    }

    void verifyEmail();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        {status === 'loading' ? (
          <>
            <div className="text-4xl">⏳</div>
            <h1 className="mt-4 text-xl font-bold text-slate-800">
              กำลังยืนยันอีเมล
            </h1>
          </>
        ) : null}

        {status === 'success' ? (
          <>
            <div className="text-4xl">✅</div>
            <h1 className="mt-4 text-xl font-bold text-green-700">
              ยืนยันอีเมลสำเร็จ
            </h1>
          </>
        ) : null}

        {status === 'error' ? (
          <>
            <div className="text-4xl">❌</div>
            <h1 className="mt-4 text-xl font-bold text-red-700">
              ไม่สามารถยืนยันอีเมลได้
            </h1>
          </>
        ) : null}

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {message}
        </p>

        {status !== 'loading' ? (
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
        ) : null}
      </div>
    </main>
  );
}

function VerifyEmailLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">⏳</div>
        <h1 className="mt-4 text-xl font-bold text-slate-800">
          กำลังเปิดหน้าตรวจสอบ
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          กรุณารอสักครู่
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}