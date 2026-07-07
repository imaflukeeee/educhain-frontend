'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  formatDateTime,
  getCredentialDisplayId,
  normalizeCredentials,
  type CredentialsResponse,
} from '@/lib/credentials';
import type { Credential, ListShareLinksResponse, ShareLink } from '@/types/api';

interface ShareHistoryItem {
  credential: Credential;
  link: ShareLink;
}

async function fetchHolderCredentials() {
  const response = await api.get<CredentialsResponse>('/credentials/holder');

  return normalizeCredentials(response.data);
}

function getShareStatusText(link: ShareLink) {
  if (link.status === 'REVOKED' || link.revokedAt) {
    return 'ยกเลิกลิงก์';
  }

  if (link.status === 'EXPIRED') {
    return 'ลิงก์หมดอายุ';
  }

  return 'สร้างลิงก์แชร์';
}

function getShareStatusClass(link: ShareLink) {
  if (link.status === 'REVOKED' || link.revokedAt) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (link.status === 'EXPIRED') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-700';
  }

  return 'border-green-200 bg-green-50 text-green-700';
}

export default function HolderHistoryPage() {
  const [historyItems, setHistoryItems] = useState<ShareHistoryItem[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadHistory() {
    setError('');
    setIsLoading(true);

    try {
      const credentials = await fetchHolderCredentials();
      const verifiedCredentials = credentials.filter(
        (credential) => credential.status === 'VERIFIED',
      );

      const results = await Promise.allSettled(
        verifiedCredentials.map(async (credential) => {
          const response = await api.get<ListShareLinksResponse>(
            `/credentials/${credential.id}/share-links`,
          );

          return response.data.shareLinks.map((link) => ({ credential, link }));
        }),
      );

      const items = results
        .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
        .sort((a, b) => {
          const aDate = a.link.revokedAt ?? a.link.createdAt ?? a.link.expiresAt;
          const bDate = b.link.revokedAt ?? b.link.createdAt ?? b.link.expiresAt;

          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

      setHistoryItems(items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">📊 ประวัติการใช้งาน</h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            หน้านี้แสดงประวัติการสร้าง ยกเลิก และหมดอายุของลิงก์ตรวจสอบเอกสารในบัญชีของคุณ
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={loadHistory} isLoading={isLoading}>
          รีเฟรชข้อมูล
        </Button>
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
          กำลังโหลดประวัติการใช้งาน...
        </div>
      ) : null}

      {!isLoading && historyItems.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center text-sm text-blue-700">
          ยังไม่มีประวัติลิงก์ตรวจสอบ
          <div className="mt-3">
            <Link href="/holder/share" className="font-semibold text-blue-700 underline">
              ไปสร้างลิงก์ตรวจสอบ
            </Link>
          </div>
        </div>
      ) : null}

      {!isLoading && historyItems.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse bg-white text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">กิจกรรม</th>
                  <th className="px-4 py-3">เอกสาร</th>
                  <th className="px-4 py-3">รหัสลิงก์</th>
                  <th className="px-4 py-3">เวลาที่เกี่ยวข้อง</th>
                  <th className="px-4 py-3">จัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {historyItems.map(({ credential, link }) => (
                  <tr key={`${credential.id}:${link.token}`} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <span
                        className={[
                          'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                          getShareStatusClass(link),
                        ].join(' ')}
                      >
                        {getShareStatusText(link)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800">
                        {credential.documentTitle}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {credential.studentName} • {credential.studentId}
                      </div>
                      <code className="mt-2 block max-w-72 break-all rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {getCredentialDisplayId(credential)}
                      </code>
                    </td>

                    <td className="px-4 py-4">
                      <code className="block max-w-80 break-all rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {link.token}
                      </code>
                    </td>

                    <td className="px-4 py-4 text-xs leading-6 text-slate-600">
                      <div>สร้าง: {formatDateTime(link.createdAt)}</div>
                      <div>หมดอายุ: {formatDateTime(link.expiresAt)}</div>
                      {link.revokedAt ? <div>ยกเลิก: {formatDateTime(link.revokedAt)}</div> : null}
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/holder/share?credentialId=${credential.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        เปิดหน้าลิงก์ตรวจสอบ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
