'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { api, getApiErrorMessage } from '@/lib/api';
import { getDisplayFileName } from '@/lib/credentials';
import type { Credential, CredentialStatus } from '@/types/api';

type CredentialsResponse =
  | Credential[]
  | {
      credentials?: Credential[];
      data?: Credential[];
      items?: Credential[];
    };

type CredentialActionResponse =
  | Credential
  | {
      message?: string;
      credential?: Credential;
      data?: Credential;
    };

function normalizeCredentials(data: CredentialsResponse): Credential[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.credentials ?? data.data ?? data.items ?? [];
}

function normalizeCredential(data: CredentialActionResponse): Credential | null {
  if ('id' in data) {
    return data;
  }

  return data.credential ?? data.data ?? null;
}

async function fetchIssuerCredentials(): Promise<Credential[]> {
  const response = await api.get<CredentialsResponse>('/credentials/issuer');

  return normalizeCredentials(response.data);
}

function getStatusText(status: CredentialStatus) {
  switch (status) {
    case 'PENDING':
      return 'รอการยืนยัน';
    case 'VERIFIED':
      return 'ยืนยันแล้ว';
    case 'INVALID':
      return 'ถูกเพิกถอน';
    default:
      return status;
  }
}

function getStatusClass(status: CredentialStatus) {
  switch (status) {
    case 'PENDING':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    case 'VERIFIED':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'INVALID':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function compactValue(...values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).filter(Boolean).join(' ');
}

function getIssuedByText(credential: Credential) {
  return (
    credential.issuedByName ??
    credential.issuerStaff?.name ??
    credential.issuer?.name ??
    '-'
  );
}

function getIssuedBySubText(credential: Credential) {
  return [credential.issuedByPosition, credential.issuedByDepartment]
    .filter(Boolean)
    .join(' · ');
}

function getTransactionHash(credential: Credential) {
  return (
    credential.blockchainTxHash ??
    credential.txHash ??
    credential.transactionHash ??
    credential.blockchainTransactionHash ??
    credential.tx_hash ??
    credential.transaction_hash ??
    credential.blockchain_tx_hash ??
    null
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 break-words text-sm font-semibold text-slate-800">{value || '-'}</div>
    </div>
  );
}

export default function IssuerCredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CredentialStatus>('ALL');
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);

  const filteredCredentials = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return credentials.filter((credential) => {
      const statusMatched = statusFilter === 'ALL' || credential.status === statusFilter;
      const textMatched = !keyword || [
        credential.documentTitle,
        credential.studentName,
        credential.studentId,
        credential.faculty,
        credential.major,
        credential.holderEmail,
        getIssuedByText(credential),
        credential.credentialId,
        credential.id,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));

      return statusMatched && textMatched;
    });
  }, [credentials, searchText, statusFilter]);

  useEffect(() => {
    let isActive = true;

    async function loadInitialCredentials() {
      try {
        const items = await fetchIssuerCredentials();

        if (!isActive) {
          return;
        }

        setCredentials(items);
      } catch (err) {
        if (!isActive) {
          return;
        }

        setError(getApiErrorMessage(err));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialCredentials();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleRefresh() {
    setError('');
    setActionMessage('');
    setIsLoading(true);

    try {
      const items = await fetchIssuerCredentials();
      setCredentials(items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegisterChain(credentialId: string) {
    setError('');
    setActionMessage('');
    setProcessingId(credentialId);

    try {
      const response = await api.post<CredentialActionResponse>(
        `/credentials/${credentialId}/register-chain`,
      );

      const updatedCredential = normalizeCredential(response.data);

      if (updatedCredential) {
        setCredentials((currentCredentials) =>
          currentCredentials.map((credential) =>
            credential.id === updatedCredential.id
              ? { ...credential, ...updatedCredential }
              : credential,
          ),
        );
        setSelectedCredential((current) =>
          current?.id === updatedCredential.id ? { ...current, ...updatedCredential } : current,
        );
      } else {
        const items = await fetchIssuerCredentials();
        setCredentials(items);
      }

      setActionMessage('ยืนยันเอกสารสำเร็จ');
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
              🗂️ รายการใบรับรองที่ถูกออก
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              แสดงรายการเอกสารวุฒิการศึกษาดิจิทัลที่มหาวิทยาลัยเป็นผู้ออก
              พร้อมสถานะการยืนยันเอกสาร และชื่อเจ้าหน้าที่ที่ออกเอกสาร
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleRefresh}
            isLoading={isLoading}
          >
            รีเฟรชข้อมูล
          </Button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px]">
          <Input
            label="ค้นหาเอกสาร"
            placeholder="ค้นหาชื่อเอกสาร ชื่อนักศึกษา รหัสนักศึกษา คณะ สาขา หรือชื่อเจ้าหน้าที่"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">สถานะเอกสาร</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'ALL' | CredentialStatus)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PENDING">รอการยืนยัน</option>
              <option value="VERIFIED">ยืนยันแล้ว</option>
              <option value="INVALID">ถูกเพิกถอน</option>
            </select>
          </label>
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
            ยังไม่มีรายการเอกสารที่ถูกออก
          </div>
        ) : null}

        {!isLoading && credentials.length > 0 && filteredCredentials.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            ไม่พบเอกสารตามเงื่อนไขที่ค้นหา
          </div>
        ) : null}

        {!isLoading && filteredCredentials.length > 0 ? (
          <div className="mt-8 grid gap-4">
            {filteredCredentials.map((credential) => {
              const txHash = getTransactionHash(credential);
              const issuedBySubText = getIssuedBySubText(credential);
              const isProcessing = processingId === credential.id;

              return (
                <article
                  key={credential.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedCredential(credential)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800">{credential.documentTitle}</h3>
                        <span className={[
                          'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                          getStatusClass(credential.status),
                        ].join(' ')}>
                          {getStatusText(credential.status)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <div className="text-xs font-semibold text-slate-400">ผู้รับเอกสาร</div>
                          <div className="mt-1 font-medium text-slate-700">{credential.studentName}</div>
                          <div className="text-xs text-slate-400">{credential.studentId}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-400">คณะ / สาขา</div>
                          <div className="mt-1 font-medium text-slate-700">{compactValue(credential.faculty) || '-'}</div>
                          <div className="text-xs text-slate-400">{credential.major || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-400">ออกโดย</div>
                          <div className="mt-1 font-medium text-slate-700">{getIssuedByText(credential)}</div>
                          <div className="text-xs text-slate-400">{issuedBySubText || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-400">วันที่ออก</div>
                          <div className="mt-1 font-medium text-slate-700">{formatDate(credential.issuedAt)}</div>
                          <div className="truncate text-xs text-slate-400">{getDisplayFileName(credential.fileName)}</div>
                        </div>
                      </div>
                    </button>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => setSelectedCredential(credential)}>
                        ดูรายละเอียด
                      </Button>
                      {credential.status === 'PENDING' ? (
                        <Button
                          type="button"
                          onClick={() => handleRegisterChain(credential.id)}
                          isLoading={isProcessing}
                          disabled={Boolean(processingId)}
                        >
                          ยืนยันเอกสาร
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {txHash ? (
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                      เลขอ้างอิงการยืนยัน: <span className="font-mono">{txHash}</span>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </div>

      {selectedCredential ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="max-h-full w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedCredential.documentTitle}</h3>
                <p className="mt-1 text-sm text-slate-500">รายละเอียดเอกสารฉบับเต็ม</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCredential(null)}
                className="rounded-full px-3 py-1 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="ปิดหน้าต่าง"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="ชื่อเอกสาร" value={selectedCredential.documentTitle} />
              <DetailItem label="สถานะ" value={getStatusText(selectedCredential.status)} />
              <DetailItem label="วันที่ออก" value={formatDate(selectedCredential.issuedAt)} />
              <DetailItem label="ผู้รับเอกสาร" value={selectedCredential.studentName} />
              <DetailItem label="อีเมลผู้รับเอกสาร" value={selectedCredential.holderEmail} />
              <DetailItem label="รหัสนักศึกษา" value={selectedCredential.studentId} />
              <DetailItem label="คณะ" value={selectedCredential.faculty} />
              <DetailItem label="สาขา" value={selectedCredential.major} />
              <DetailItem label="ออกโดย" value={getIssuedByText(selectedCredential)} />
              <DetailItem label="ตำแหน่ง / หน่วยงาน" value={getIssuedBySubText(selectedCredential)} />
              <DetailItem label="ชื่อไฟล์" value={getDisplayFileName(selectedCredential.fileName)} />
              <DetailItem label="รหัสเอกสาร" value={selectedCredential.credentialId ?? selectedCredential.id} />
              <DetailItem label="เลขอ้างอิงการยืนยัน" value={getTransactionHash(selectedCredential)} />
              <DetailItem label="วันที่สร้างรายการ" value={formatDate(selectedCredential.createdAt)} />
              <DetailItem label="วันที่แก้ไขล่าสุด" value={formatDate(selectedCredential.updatedAt)} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              {selectedCredential.status === 'PENDING' ? (
                <Button
                  type="button"
                  onClick={() => handleRegisterChain(selectedCredential.id)}
                  isLoading={processingId === selectedCredential.id}
                  disabled={Boolean(processingId)}
                >
                  ยืนยันเอกสาร
                </Button>
              ) : null}
              <Button type="button" variant="secondary" onClick={() => setSelectedCredential(null)}>
                ปิดรายละเอียด
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
