'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TopNav } from '@/components/TopNav';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/api';
import type { UserRole } from '@/types/api';

export default function LoginPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const { login } = useAuth();

  const role = useMemo<UserRole>(() => {
    return params.role === 'holder' ? 'HOLDER' : 'ISSUER';
  }, [params.role]);

  const isIssuer = role === 'ISSUER';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      const user = await login({
        email,
        password,
        expectedRole: role,
      });

      router.push(user.role === 'ISSUER' ? '/issuer/dashboard' : '/holder/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <TopNav />

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
        >
          <h1 className="text-center text-xl font-bold text-blue-600">
            {isIssuer ? '🏫 เข้าสู่ระบบมหาวิทยาลัย' : '👨‍🎓 เข้าสู่ระบบนักศึกษา'}
          </h1>

          <p className="mt-2 text-center text-sm text-slate-500">
            เข้าสู่ระบบเพื่อใช้งาน EduChain
          </p>

          <div className="mt-6 space-y-4">
            <Input
              label="อีเมล"
              type="email"
              placeholder={isIssuer ? 'example@educhain.ac.th' : 'student@example.com'}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <Input
              label="รหัสผ่าน"
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" fullWidth className="mt-5" isLoading={isSubmitting}>
            เข้าสู่ระบบ
          </Button>

          <p className="mt-4 text-center text-sm text-slate-500">
            ยังไม่มีบัญชี?{' '}
            <Link
              href={isIssuer ? '/register/issuer' : '/register/holder'}
              className="font-semibold text-blue-600"
            >
              สมัครใช้งาน
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}