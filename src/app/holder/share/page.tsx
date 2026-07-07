'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  formatDate,
  formatDateTime,
  getCredentialDisplayId,
  getStatusClass,
  getStatusText,
  normalizeCredentials,
  type CredentialsResponse,
} from '@/lib/credentials';
import type {
  CreateShareLinkResponse,
  Credential,
  ListShareLinksResponse,
  RevokeShareLinkResponse,
  ShareLink,
} from '@/types/api';

async function fetchHolderCredentials() {
  const response = await api.get<CredentialsResponse>('/credentials/holder');

  return normalizeCredentials(response.data);
}

function toFrontendVerifyUrl(token: string) {
  if (typeof window === 'undefined') {
    return `/verify?token=${token}`;
  }

  return `${window.location.origin}/verify?token=${token}`;
}

function getShareStatusText(link: ShareLink) {
  if (link.status === 'REVOKED' || link.revokedAt) {
    return 'ยกเลิกแล้ว';
  }

  if (link.status === 'EXPIRED') {
    return 'หมดอายุ';
  }

  return 'ใช้งานได้';
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

export default function HolderSharePage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState('');
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [processingToken, setProcessingToken] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const verifiedCredentials = useMemo(
    () => credentials.filter((credential) => credential.status === 'VERIFIED'),
    [credentials],
  );

  const selectedCredential = useMemo(
    () => credentials.find((credential) => credential.id === selectedCredentialId) ?? null,
    [credentials, selectedCredentialId],
  );

  async function loadCredentials() {
    setError('');
    setActionMessage('');
    setIsLoadingCredentials(true);

    try {
      const items = await fetchHolderCredentials();
      setCredentials(items);

      const params = new URLSearchParams(window.location.search);
      const credentialIdFromUrl = params.get('credentialId');
      const firstVerified = items.find((credential) => credential.status === 'VERIFIED');
      const urlCredential = items.find(
        (credential) =>
          credential.id === credentialIdFromUrl && credential.status === 'VERIFIED',
      );

      setSelectedCredentialId(
        urlCredential?.id ?? firstVerified?.id ?? '',
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoadingCredentials(false);
    }
  }

  async function loadShareLinks(credentialId: string) {
    if (!credentialId) {
      setShareLinks([]);
      return;
    }

    setError('');
    setIsLoadingLinks(true);

    try {
      const response = await api.get<ListShareLinksResponse>(
        `/credentials/${credentialId}/share-links`,
      );

      setShareLinks(response.data.shareLinks);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setShareLinks([]);
    } finally {
      setIsLoadingLinks(false);
    }
  }

  useEffect(() => {
    void loadCredentials();
  }, []);

  useEffect(() => {
    void loadShareLinks(selectedCredentialId);
  }, [selectedCredentialId]);

  async function handleCreateShareLink() {
    if (!selectedCredentialId) {
      setError('กรุณาเลือกเอกสารก่อนสร้างลิงก์แชร์');
      return;
    }

    setError('');
    setActionMessage('');
    setIsCreating(true);

    try {
      const response = await api.post<CreateShareLinkResponse>(
        `/credentials/${selectedCredentialId}/share-link`,
      );

      setActionMessage(response.data.message);
      await loadShareLinks(selectedCredentialId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevokeShareLink(token: string) {
    setError('');
    setActionMessage('');
    setProcessingToken(token);

    try {
      const response = await api.post<RevokeShareLinkResponse>(
        `/credentials/share/${token}/revoke`,
      );

      setActionMessage(response.data.message);
      await loadShareLinks(selectedCredentialId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingToken(null);
    }
  }

  async function handleCopy(token: string) {
    const verifyUrl = toFrontendVerifyUrl(token);

    try {
      await navigator.clipboard.writeText(verifyUrl);
      setActionMessage('คัดลอกลิงก์ตรวจสอบเรียบร้อยแล้ว');
    } catch {
      setActionMessage(verifyUrl);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">
              🔗 แชร์เอกสารดิจิทัล
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              สร้างลิงก์สำหรับแชร์เอกสารให้หน่วยงานภายนอกตรวจสอบได้โดยไม่ต้องเข้าสู่ระบบ ลิงก์จะหมดอายุภายใน 7 วัน
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={loadCredentials}
            isLoading={isLoadingCredentials}
          >
            รีเฟรชข้อมูล
          </Button>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {actionMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-slate-800">
              เลือกเอกสารที่ยืนยันแล้ว
            </div>

            {isLoadingCredentials ? (
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                กำลังโหลดเอกสาร...
              </div>
            ) : null}

            {!isLoadingCredentials && verifiedCredentials.length === 0 ? (
              <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                ยังไม่มีเอกสารที่ยืนยันแล้ว จึงยังไม่สามารถสร้างลิงก์ตรวจสอบได้
              </div>
            ) : null}

            {!isLoadingCredentials && verifiedCredentials.length > 0 ? (
              <select
                value={selectedCredentialId}
                onChange={(event) => setSelectedCredentialId(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {verifiedCredentials.map((credential) => (
                  <option key={credential.id} value={credential.id}>
                    {credential.documentTitle} • {credential.studentId} • {getCredentialDisplayId(credential)}
                  </option>
                ))}
              </select>
            ) : null}

            {selectedCredential ? (
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <div className="font-semibold text-slate-800">
                  {selectedCredential.documentTitle}
                </div>
                <div className="mt-2 text-slate-600">
                  {selectedCredential.studentName} • {selectedCredential.studentId}
                </div>
                <div className="mt-1 text-slate-500">
                  {selectedCredential.faculty ?? '-'} / {selectedCredential.major ?? '-'}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                      getStatusClass(selectedCredential.status),
                    ].join(' ')}
                  >
                    {getStatusText(selectedCredential.status)}
                  </span>
                  <span className="text-xs text-slate-400">
                    วันที่ออก {formatDate(selectedCredential.issuedAt)}
                  </span>
                </div>
                <code className="mt-3 block break-all rounded bg-white px-2 py-2 text-xs text-slate-600">
                  รหัสเอกสาร: {getCredentialDisplayId(selectedCredential)}
                </code>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <div className="text-sm font-semibold text-blue-800">
              สร้างลิงก์แชร์ใหม่
            </div>
            <p className="mt-2 text-sm leading-6 text-blue-700">
              เมื่อกดสร้างลิงก์ ระบบจะสร้างลิงก์ตรวจสอบใหม่พร้อมวันหมดอายุให้อัตโนมัติ
            </p>
            <Button
              type="button"
              onClick={handleCreateShareLink}
              isLoading={isCreating}
              disabled={!selectedCredentialId || Boolean(processingToken)}
              fullWidth
              className="mt-5"
            >
              สร้างลิงก์ตรวจสอบ
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-xl font-bold text-blue-600">ลิงก์ตรวจสอบของเอกสารนี้</h3>

        {isLoadingLinks ? (
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
            กำลังโหลดลิงก์ตรวจสอบ...
          </div>
        ) : null}

        {!isLoadingLinks && selectedCredentialId && shareLinks.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center text-sm text-blue-700">
            เอกสารนี้ยังไม่มีลิงก์ตรวจสอบ
          </div>
        ) : null}

        {!isLoadingLinks && shareLinks.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse bg-white text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">ลิงก์สำหรับตรวจสอบ</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3">สร้างเมื่อ</th>
                    <th className="px-4 py-3">หมดอายุ</th>
                    <th className="px-4 py-3">จัดการ</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {shareLinks.map((link) => {
                    const frontendUrl = toFrontendVerifyUrl(link.token);
                    const isRevoked = Boolean(link.revokedAt) || link.status === 'REVOKED';
                    const isExpired = link.status === 'EXPIRED';
                    const canRevoke = !isRevoked && !isExpired;

                    return (
                      <tr key={link.token} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <code className="block max-w-[520px] break-all rounded bg-slate-100 px-2 py-2 text-xs text-slate-700">
                            {frontendUrl}
                          </code>
                          <div className="mt-2 text-xs text-slate-400">
                            รหัสลิงก์: {link.token}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                              getShareStatusClass(link),
                            ].join(' ')}
                          >
                            {getShareStatusText(link)}
                          </span>
                          {link.revokedAt ? (
                            <div className="mt-2 text-xs text-slate-400">
                              ยกเลิกเมื่อ {formatDateTime(link.revokedAt)}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {formatDateTime(link.createdAt)}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {formatDateTime(link.expiresAt)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleCopy(link.token)}
                              className="h-9 px-3 text-xs"
                            >
                              คัดลอกลิงก์
                            </Button>

                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => handleRevokeShareLink(link.token)}
                              isLoading={processingToken === link.token}
                              disabled={!canRevoke || Boolean(processingToken)}
                              className="h-9 px-3 text-xs"
                            >
                              ยกเลิกลิงก์
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
