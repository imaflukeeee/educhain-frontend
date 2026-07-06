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

export default function RegisterPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const { register } = useAuth();

  const role = useMemo<UserRole>(() => {
    return params.role === 'holder' ? 'HOLDER' : 'ISSUER';
  }, [params.role]);

  const isIssuer = role === 'ISSUER';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepted, setAccepted] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (password !== confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!accepted) {
      setError('กรุณายอมรับเงื่อนไขการใช้งาน');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register({
        name,
        email,
        password,
        role,
        walletAddress,
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

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm"
        >
          <h1 className="text-center text-xl font-bold text-blue-600">
            {isIssuer
              ? '🏫 ลงทะเบียนสำหรับมหาวิทยาลัย'
              : '👨‍🎓 ลงทะเบียนสำหรับนักศึกษา'}
          </h1>

          <p className="mt-2 text-center text-sm text-slate-500">
            สมัครใช้งานระบบ EduChain
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Input
              label={isIssuer ? 'ชื่อมหาวิทยาลัย / หน่วยงาน' : 'ชื่อ - นามสกุล'}
              placeholder={isIssuer ? 'EduChain University' : 'วรากร กิจสุวรรณมานพ'}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <Input
              label="อีเมล"
              type="email"
              placeholder={isIssuer ? 'admin@university.ac.th' : 'student@example.com'}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <Input
              label="Wallet Address"
              placeholder="0x..."
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
            />

            <div className="hidden md:block" />

            <Input
              label="รหัสผ่าน"
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <Input
              label="ยืนยันรหัสผ่าน"
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          <label className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            ข้าพเจ้ายืนยันว่าข้อมูลถูกต้องและยอมรับเงื่อนไขการใช้งาน
          </label>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" fullWidth className="mt-5" isLoading={isSubmitting}>
            ลงทะเบียน
          </Button>

          <p className="mt-4 text-center text-sm text-slate-500">
            มีบัญชีแล้ว?{' '}
            <Link
              href={isIssuer ? '/login/issuer' : '/login/holder'}
              className="font-semibold text-blue-600"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}