'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TopNav } from '@/components/TopNav';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  formatDate,
  formatDateTime,
  getAmoyAddressUrl,
  getAmoyTransactionUrl,
  middleEllipsis,
  getStatusText,
} from '@/lib/credentials';
import type { PublicVerificationResult } from '@/types/api';

type VerifyTarget =
  | { type: 'credential'; credentialId: string }
  | { type: 'share'; token: string };

function parseVerifyInput(value: string): VerifyTarget | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const tokenFromQuery =
      url.searchParams.get('token') ?? url.searchParams.get('share');
    const credentialFromQuery =
      url.searchParams.get('credentialId') ?? url.searchParams.get('id');

    if (tokenFromQuery) {
      return { type: 'share', token: tokenFromQuery };
    }

    if (credentialFromQuery) {
      return { type: 'credential', credentialId: credentialFromQuery };
    }

    const shareMatch = url.pathname.match(/\/credentials\/share\/([^/]+)\/verify/i);

    if (shareMatch?.[1]) {
      return { type: 'share', token: shareMatch[1] };
    }

    const publicCredentialMatch = url.pathname.match(
      /\/credentials\/public\/([^/]+)\/verify/i,
    );

    if (publicCredentialMatch?.[1]) {
      return { type: 'credential', credentialId: publicCredentialMatch[1] };
    }
  } catch {
    // ไม่ใช่ URL ให้ตรวจเป็น token หรือ credential id ด้านล่าง
  }

  const sharePathMatch = trimmed.match(/credentials\/share\/([^/]+)\/verify/i);

  if (sharePathMatch?.[1]) {
    return { type: 'share', token: sharePathMatch[1] };
  }

  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    return { type: 'share', token: trimmed };
  }

  return { type: 'credential', credentialId: trimmed };
}

function CheckRow({ label, value }: { label: string; value?: boolean }) {
  if (value === undefined) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span
        className={[
          'rounded-full px-2 py-0.5 text-xs font-semibold',
          value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
        ].join(' ')}
      >
        {value ? 'ผ่าน' : 'ไม่ผ่าน'}
      </span>
    </div>
  );
}

function VerificationResultCard({ result }: { result: PublicVerificationResult }) {
  const txUrl = getAmoyTransactionUrl(result.blockchain?.transactionHash);
  const issuerUrl = getAmoyAddressUrl(result.blockchain?.issuerAddress);
  const holderUrl = getAmoyAddressUrl(result.blockchain?.holderAddress);

  return (
    <div
      className={[
        'mt-6 rounded-2xl border p-5 text-sm',
        result.isValid
          ? 'border-green-200 bg-green-50 text-green-900'
          : 'border-red-200 bg-red-50 text-red-900',
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-lg font-bold">
            {result.isValid
              ? '✅ เอกสารถูกต้อง'
              : '❌ เอกสารไม่ผ่านการตรวจสอบ'}
          </div>
          <p className="mt-1 leading-6">{result.message}</p>
        </div>

        <div className="rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">
          ตรวจเมื่อ {formatDateTime(result.verifiedAt)}
        </div>
      </div>

      {result.credential ? (
        <div className="mt-5 grid gap-3 rounded-xl bg-white/70 p-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ชื่อเอกสาร
            </div>
            <div className="mt-1 font-semibold text-slate-800">
              {result.credential.documentTitle}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              รหัสเอกสาร
            </div>
            <code className="mt-1 block break-all text-xs text-slate-700">
              {result.credential.credentialId}
            </code>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              นักศึกษา
            </div>
            <div className="mt-1 text-slate-700">
              {result.credential.studentName}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              รหัสนักศึกษา
            </div>
            <div className="mt-1 text-slate-700">
              {result.credential.studentId ?? '-'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              คณะ
            </div>
            <div className="mt-1 text-slate-700">
              {result.credential.faculty ?? '-'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              สาขาวิชา
            </div>
            <div className="mt-1 text-slate-700">
              {result.credential.major ?? '-'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              วันที่ออก
            </div>
            <div className="mt-1 text-slate-700">
              {formatDate(result.credential.issuedAt)}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              สถานะเอกสาร
            </div>
            <div className="mt-1 text-slate-700">
              {getStatusText(result.credential.status)}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              มหาวิทยาลัยผู้ออกเอกสาร
            </div>
            <div className="mt-1 text-slate-700">
              {result.issuer?.name ?? '-'}
            </div>
          </div>
        </div>
      ) : null}

      {result.uploadedFile ? (
        <div className="mt-5 rounded-xl bg-white/70 p-4">
          <div className="font-semibold text-slate-800">ไฟล์ที่อัปโหลด</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                ชื่อไฟล์
              </div>
              <div className="mt-1 break-all text-slate-700">
                {result.uploadedFile.fileName}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                ประเภทไฟล์
              </div>
              <div className="mt-1 text-slate-700">
                {result.uploadedFile.mimeType}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                SHA-256 ของไฟล์
              </div>
              <code className="mt-1 block break-all text-xs text-slate-700">
                {result.uploadedFile.sha256Hash}
              </code>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-xl bg-white/70 p-4">
          <div className="font-semibold text-slate-800">ผลตรวจสอบ</div>
          <CheckRow
            label="ไฟล์ที่อัปโหลดตรงกับเอกสารต้นฉบับ"
            value={result.checks?.uploadedFileMatched}
          />
          <CheckRow
            label="ข้อมูลไฟล์ตรงกับข้อมูลที่ยืนยันไว้"
            value={result.checks?.documentHashMatched}
          />
          <CheckRow
            label="บัญชีผู้รับเอกสารตรงกับข้อมูลที่ยืนยันไว้"
            value={result.checks?.holderAddressMatched}
          />
          <CheckRow
            label="สถานะเอกสารยืนยันแล้ว"
            value={result.checks?.databaseStatusVerified}
          />
          <CheckRow
            label="มีเลขอ้างอิงการยืนยัน"
            value={result.checks?.hasTransaction}
          />
        </div>

        <div className="space-y-3 rounded-xl bg-white/70 p-4">
          <div className="font-semibold text-slate-800">ข้อมูลยืนยัน</div>
          <div className="text-xs text-slate-600">
            ระบบยืนยัน: {result.blockchain?.network ?? '-'}
          </div>
          <div className="text-xs text-slate-600">
            ลำดับการบันทึก: {result.blockchain?.blockNumber ?? '-'}
          </div>

          {txUrl ? (
            <a
              href={txUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-xs font-semibold text-blue-600 hover:underline"
            >
              เปิดเลขอ้างอิง: {middleEllipsis(result.blockchain?.transactionHash)}
            </a>
          ) : (
            <div className="text-xs text-slate-400">
              ยังไม่มีเลขอ้างอิงการยืนยัน
            </div>
          )}

          {issuerUrl ? (
            <a
              href={issuerUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-blue-600 hover:underline"
            >
              บัญชีดิจิทัลของผู้ออกเอกสาร: {middleEllipsis(result.blockchain?.issuerAddress)}
            </a>
          ) : null}

          {holderUrl ? (
            <a
              href={holderUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-blue-600 hover:underline"
            >
              บัญชีดิจิทัลของผู้รับเอกสาร: {middleEllipsis(result.blockchain?.holderAddress)}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PublicVerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function verify(rawInput: string, selectedFile: File | null) {
    const target = parseVerifyInput(rawInput);

    if (!target) {
      setError('กรุณากรอก รหัสเอกสาร หรือ ลิงก์ตรวจสอบ');
      return;
    }

    setError('');
    setResult(null);
    setIsSubmitting(true);

    try {
      if (target.type === 'share') {
        if (selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);

          const response = await api.post<PublicVerificationResult>(
            `/credentials/share/${target.token}/verify`,
            formData,
          );

          setResult(response.data);
          return;
        }

        const response = await api.post<PublicVerificationResult>(
          `/credentials/share/${target.token}/verify`,
        );

        setResult(response.data);
        return;
      }

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await api.post<PublicVerificationResult>(
          `/credentials/public/${target.credentialId}/verify-file`,
          formData,
        );
        setResult(response.data);
        return;
      }

      const response = await api.get<PublicVerificationResult>(
        `/credentials/public/${target.credentialId}/verify`,
      );
      setResult(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void verify(query, file);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') ?? params.get('share');
    const credentialId = params.get('credentialId') ?? params.get('id');

    if (token) {
      setQuery(token);
      void verify(token, null);
      return;
    }

    if (credentialId) {
      setQuery(credentialId);
      void verify(credentialId, null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <TopNav />

      <main className="flex min-h-[calc(100vh-4rem)] justify-center px-6 py-10">
        <div className="w-full max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-8 shadow-sm"
          >
            <h1 className="text-center text-xl font-bold text-blue-600">
              🔍 ตรวจสอบเอกสารดิจิทัล
            </h1>

            <p className="mt-3 text-center text-sm text-slate-500">
              กรอกรหัสเอกสารหรือลิงก์ตรวจสอบ เพื่อตรวจสอบความถูกต้องของเอกสาร
            </p>

            <div className="mt-6">
              <Input
                label="รหัสเอกสาร / ลิงก์ตรวจสอบ"
                placeholder="เช่น รหัสเอกสาร หรือลิงก์ตรวจสอบที่ได้รับ"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                อัปโหลด PDF เพื่อตรวจเทียบกับเอกสารต้นฉบับ (ไม่บังคับ)
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100"
              />

              <span className="mt-1 block text-xs text-slate-400">
                ถ้าอัปโหลดไฟล์ ระบบจะตรวจเทียบกับข้อมูลเอกสารที่ยืนยันไว้
              </span>
            </label>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" fullWidth isLoading={isSubmitting}>
                ตรวจสอบเอกสาร
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setFile(null);
                  setResult(null);
                  setError('');

                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="sm:w-44"
              >
                ล้างข้อมูล
              </Button>
            </div>

            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-xs text-blue-700">
              ระบบทดสอบสำหรับยืนยันเอกสาร
            </div>
          </form>

          {result ? <VerificationResultCard result={result} /> : null}
        </div>
      </main>
    </div>
  );
}
