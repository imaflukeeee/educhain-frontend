'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  formatDate,
  getAmoyTransactionUrl,
  getCredentialDisplayId,
  getStatusClass,
  getStatusText,
  getTransactionHash,
  middleEllipsis,
  normalizeCredentials,
  type CredentialsResponse,
} from '@/lib/credentials';
import type { Credential, DownloadUrlResponse, VerifyChainResponse } from '@/types/api';

async function fetchHolderCredentials() {
  const response = await api.get<CredentialsResponse>('/credentials/holder');

  return normalizeCredentials(response.data);
}

function getIssuedByText(credential: Credential) {
  return (
    credential.issuedByName ??
    credential.issuerStaff?.name ??
    credential.issuer?.name ??
    '-'
  );
}

function getIssuedByEmail(credential: Credential) {
  return (
    credential.issuedByEmail ??
    credential.issuerStaff?.email ??
    '-'
  );
}

function getIssuedByPosition(credential: Credential) {
  return credential.issuedByPosition ?? credential.issuerStaff?.staffPosition ?? '-';
}

function getIssuedByDepartment(credential: Credential) {
  return credential.issuedByDepartment ?? credential.issuerStaff?.staffDepartment ?? '-';
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || '-'}
      </div>
    </div>
  );
}

function CheckBadge({ value }: { value?: boolean }) {
  if (value === undefined) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <span
      className={[
        'rounded-full px-2 py-0.5 text-xs font-semibold',
        value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
      ].join(' ')}
    >
      {value ? 'ผ่าน' : 'ไม่ผ่าน'}
    </span>
  );
}

export default function HolderCredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [chainResults, setChainResults] = useState<Record<string, VerifyChainResponse>>({});

  async function loadCredentials() {
    setError('');
    setActionMessage('');
    setIsLoading(true);

    try {
      const items = await fetchHolderCredentials();
      setCredentials(items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCredentials();
  }, []);

  async function handleDownload(credential: Credential) {
    setError('');
    setActionMessage('');
    setProcessingId(`download:${credential.id}`);

    try {
      const response = await api.get<DownloadUrlResponse>(
        `/credentials/${credential.id}/download-url`,
      );

      window.open(response.data.downloadUrl, '_blank', 'noopener,noreferrer');
      setActionMessage('สร้างลิงก์ดาวน์โหลดสำเร็จ ลิงก์จะหมดอายุภายใน 5 นาที');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleVerifyChain(credential: Credential) {
    setError('');
    setActionMessage('');
    setProcessingId(`verify:${credential.id}`);

    try {
      const response = await api.get<VerifyChainResponse>(
        `/credentials/${credential.id}/verify-chain`,
      );

      setChainResults((current) => ({
        ...current,
        [credential.id]: response.data,
      }));
      setActionMessage(response.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">
              📄 ใบรับรองของฉัน
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              แสดงรายการเอกสารวุฒิการศึกษาดิจิทัลที่เป็นของผู้ใช้งาน สามารถดาวน์โหลดไฟล์ PDF ตรวจสถานะการยืนยัน และนำไปสร้างลิงก์แชร์ได้
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={loadCredentials}
            isLoading={isLoading}
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

        {isLoading ? (
          <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
            กำลังโหลดรายการเอกสาร...
          </div>
        ) : null}

        {!isLoading && credentials.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center text-sm text-blue-700">
            ยังไม่มีเอกสารในบัญชีนี้ ถ้ามหาวิทยาลัยออกเอกสารแล้ว ให้ตรวจสอบว่าใช้อีเมลนักศึกษาตรงกับบัญชีนี้หรือไม่
          </div>
        ) : null}

        {!isLoading && credentials.length > 0 ? (
          <div className="mt-8 grid gap-4">
            {credentials.map((credential) => {
              const txHash = getTransactionHash(credential);
              const txUrl = getAmoyTransactionUrl(txHash);
              const chainResult = chainResults[credential.id];

              return (
                <article
                  key={credential.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                            getStatusClass(credential.status),
                          ].join(' ')}
                        >
                          {getStatusText(credential.status)}
                        </span>
                        <span className="text-xs text-slate-400">
                          วันที่ออก {formatDate(credential.issuedAt)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {credential.documentTitle}
                      </h3>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <InfoItem label="รหัสนักศึกษา" value={credential.studentId} />
                        <InfoItem label="คณะ" value={credential.faculty} />
                        <InfoItem label="สาขาวิชา" value={credential.major} />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <InfoItem label="ชื่อ - นามสกุล" value={credential.studentName} />
                        <InfoItem label="มหาวิทยาลัย" value={credential.issuer?.name} />
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-56">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setSelectedCredential(credential)}
                        className="h-10 px-3 text-xs"
                      >
                        ดูรายละเอียด
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleDownload(credential)}
                        isLoading={processingId === `download:${credential.id}`}
                        disabled={Boolean(processingId) || credential.status !== 'VERIFIED'}
                        className="h-10 px-3 text-xs"
                      >
                        ดาวน์โหลด PDF
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleVerifyChain(credential)}
                        isLoading={processingId === `verify:${credential.id}`}
                        disabled={Boolean(processingId) || credential.status !== 'VERIFIED'}
                        className="h-10 px-3 text-xs"
                      >
                        ตรวจการยืนยัน
                      </Button>

                      <Link
                        href={`/holder/share?credentialId=${credential.id}`}
                        className={[
                          'inline-flex h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold transition',
                          credential.status === 'VERIFIED'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'pointer-events-none bg-slate-100 text-slate-400',
                        ].join(' ')}
                      >
                        แชร์เอกสาร
                      </Link>
                    </div>
                  </div>

                  {txUrl || chainResult ? (
                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-400">
                            เลขอ้างอิงการยืนยัน
                          </div>
                          {txUrl ? (
                            <a
                              href={txUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block text-xs font-semibold text-blue-600 hover:underline"
                            >
                              {middleEllipsis(txHash)}
                            </a>
                          ) : (
                            <div className="mt-1 text-xs text-slate-400">
                              ยังไม่มีเลขอ้างอิงการยืนยัน
                            </div>
                          )}
                        </div>

                        {chainResult ? (
                          <div className="space-y-2">
                            <div
                              className={[
                                'text-xs font-semibold',
                                chainResult.isValid ? 'text-green-700' : 'text-red-700',
                              ].join(' ')}
                            >
                              {chainResult.isValid ? 'ข้อมูลตรงกัน' : 'ข้อมูลไม่ตรง'}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                              <div className="flex justify-between gap-2 text-xs text-slate-500">
                                <span>ไฟล์เอกสาร</span>
                                <CheckBadge value={chainResult.checks.documentHashMatched} />
                              </div>
                              <div className="flex justify-between gap-2 text-xs text-slate-500">
                                <span>ผู้รับเอกสาร</span>
                                <CheckBadge value={chainResult.checks.holderAddressMatched} />
                              </div>
                              <div className="flex justify-between gap-2 text-xs text-slate-500">
                                <span>สถานะเอกสาร</span>
                                <CheckBadge value={chainResult.checks.databaseStatusVerified} />
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </div>

      {selectedCredential ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-6">
              <div>
                <h3 className="text-xl font-bold text-blue-600">
                  รายละเอียดใบรับรอง
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedCredential.documentTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCredential(null)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-200"
              >
                ปิด
              </button>
            </div>

            <div className="space-y-6 p-6">
              <section>
                <div className="mb-3 text-sm font-bold text-slate-800">
                  ข้อมูลเอกสาร
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoItem label="ชื่อเอกสาร" value={selectedCredential.documentTitle} />
                  <InfoItem label="สถานะ" value={getStatusText(selectedCredential.status)} />
                  <InfoItem label="วันที่ออก" value={formatDate(selectedCredential.issuedAt)} />
                  <InfoItem label="รหัสเอกสาร" value={getCredentialDisplayId(selectedCredential)} />
                  <InfoItem label="ชื่อไฟล์" value={selectedCredential.fileName} />
                  <InfoItem label="ชนิดไฟล์" value={selectedCredential.mimeType} />
                </div>
              </section>

              <section>
                <div className="mb-3 text-sm font-bold text-slate-800">
                  ข้อมูลนักศึกษา
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <InfoItem label="รหัสนักศึกษา" value={selectedCredential.studentId} />
                  <InfoItem label="คณะ" value={selectedCredential.faculty} />
                  <InfoItem label="สาขาวิชา" value={selectedCredential.major} />
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <InfoItem label="ชื่อ - นามสกุล" value={selectedCredential.studentName} />
                  <InfoItem label="อีเมลนักศึกษา" value={selectedCredential.holder?.email} />
                </div>
              </section>

              <section>
                <div className="mb-3 text-sm font-bold text-slate-800">
                  ข้อมูลผู้ออกเอกสาร
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoItem label="มหาวิทยาลัย" value={selectedCredential.issuer?.name} />
                  <InfoItem label="ชื่อ - นามสกุลเจ้าหน้าที่" value={getIssuedByText(selectedCredential)} />
                  <InfoItem label="ตำแหน่ง" value={getIssuedByPosition(selectedCredential)} />
                  <InfoItem label="ฝ่าย / หน่วยงาน" value={getIssuedByDepartment(selectedCredential)} />
                  <InfoItem label="อีเมลเจ้าหน้าที่" value={getIssuedByEmail(selectedCredential)} />
                </div>
              </section>

              <section>
                <div className="mb-3 text-sm font-bold text-slate-800">
                  ข้อมูลการยืนยัน
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoItem label="เลขอ้างอิงการยืนยัน" value={getTransactionHash(selectedCredential)} />
                  <InfoItem label="เครือข่าย" value={selectedCredential.network} />
                  <InfoItem label="หมายเลขบล็อก" value={selectedCredential.blockNumber} />
                  <InfoItem label="ข้อมูลอ้างอิงไฟล์" value={selectedCredential.documentHash ?? selectedCredential.fileHash} />
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
