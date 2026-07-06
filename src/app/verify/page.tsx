'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TopNav } from '@/components/TopNav';

export default function VerifyPage() {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(
      'ระบบตรวจสอบเอกสารจะพร้อมใช้งานหลังจากมีเอกสารดิจิทัลในระบบ',
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <TopNav />

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm"
        >
          <h1 className="text-center text-xl font-bold text-blue-600">
            🔍 ตรวจสอบเอกสารดิจิทัล
          </h1>

          <p className="mt-3 text-center text-sm text-slate-500">
            กรอก Credential ID หรือ Share Link เพื่อตรวจสอบความถูกต้องของเอกสาร
          </p>

          <div className="mt-6">
            <Input
              label="Credential ID / Share Link"
              placeholder="กรอกหมายเลขเอกสารหรือลิงก์สำหรับตรวจสอบ"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {message ? (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
              {message}
            </div>
          ) : null}

          <Button type="submit" fullWidth className="mt-5">
            ตรวจสอบเอกสาร
          </Button>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-xs text-blue-700">
            Network: Polygon Amoy Testnet • Chain ID: 80002 • Currency: POL
          </div>
        </form>
      </main>
    </div>
  );
}