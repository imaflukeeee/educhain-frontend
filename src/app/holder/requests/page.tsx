'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { api, getApiErrorMessage } from '@/lib/api';
import type {
  DocumentRequest,
  DocumentRequestStatus,
  DocumentRequestType,
} from '@/types/api';

const requestTypes: Array<{ value: DocumentRequestType; label: string }> = [
  { value: 'STUDENT_STATUS_CERTIFICATE', label: 'ใบรับรองนักศึกษา' },
  { value: 'TRANSCRIPT', label: 'ใบแสดงผลการเรียน' },
  { value: 'DEGREE_CERTIFICATE', label: 'ปริญญาบัตร' },
  { value: 'GRADUATION_CERTIFICATE', label: 'หนังสือรับรองจบการศึกษา' },
  { value: 'STUDENT_CARD', label: 'บัตรนักศึกษา' },
  { value: 'OTHER', label: 'เอกสารอื่น ๆ' },
];

const statusText: Record<DocumentRequestStatus, string> = {
  SUBMITTED: 'ส่งคำร้องแล้ว',
  RECEIVED: 'มหาวิทยาลัยรับเรื่องแล้ว',
  IN_PROGRESS: 'กำลังดำเนินการ',
  NEED_MORE_INFORMATION: 'รอข้อมูลเพิ่มเติม',
  REJECTED: 'ไม่อนุมัติคำร้อง',
  COMPLETED: 'ดำเนินการเสร็จแล้ว',
  CANCELLED: 'ยกเลิกแล้ว',
};

export default function HolderRequestsPage() {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [type, setType] = useState<DocumentRequestType>('STUDENT_STATUS_CERTIFICATE');
  const [customTypeName, setCustomTypeName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const response = await api.get<DocumentRequest[]>('/document-lifecycle/requests/my');
      setRequests(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/document-lifecycle/requests', {
        type,
        customTypeName: type === 'OTHER' ? customTypeName : undefined,
        purpose,
        details,
      });
      setMessage('ส่งคำร้องเอกสารเรียบร้อยแล้ว');
      setPurpose('');
      setDetails('');
      setCustomTypeName('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id: string) {
    if (!window.confirm('ยืนยันการยกเลิกคำร้องนี้หรือไม่')) return;
    try {
      await api.patch(`/document-lifecycle/requests/${id}/cancel`);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">คำร้องเอกสารของฉัน</h2>
        <p className="mt-2 text-sm text-slate-500">
          ส่งคำร้องและติดตามความคืบหน้าจากมหาวิทยาลัยได้ในหน้าเดียว
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">ส่งคำร้องใหม่</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              ประเภทเอกสาร <span className="text-red-500">*</span>
            </span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as DocumentRequestType)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              {requestTypes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          {type === 'OTHER' ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                ระบุชื่อเอกสาร <span className="text-red-500">*</span>
              </span>
              <input
                value={customTypeName}
                onChange={(event) => setCustomTypeName(event.target.value)}
                required
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </label>
          ) : null}
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">วัตถุประสงค์</span>
          <input
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="เช่น ใช้สมัครงาน หรือใช้ยื่นสมัครศึกษาต่อ"
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">รายละเอียดเพิ่มเติม</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm"
          />
        </label>

        {message ? <p className="mt-4 text-sm text-green-600">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <Button type="submit" isLoading={loading} className="mt-5">
          ส่งคำร้อง
        </Button>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">ประวัติคำร้อง</h3>
        <div className="mt-4 space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มีคำร้องเอกสาร</p>
          ) : requests.map((item) => {
            const typeLabel =
              item.type === 'OTHER'
                ? item.customTypeName || 'เอกสารอื่น ๆ'
                : requestTypes.find((entry) => entry.value === item.type)?.label;
            return (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{typeLabel}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(item.submittedAt).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {statusText[item.status]}
                  </span>
                </div>
                {item.staffNote ? <p className="mt-3 text-sm text-slate-600">{item.staffNote}</p> : null}
                {item.rejectionReason ? (
                  <p className="mt-3 text-sm text-red-600">เหตุผล: {item.rejectionReason}</p>
                ) : null}
                {['SUBMITTED', 'NEED_MORE_INFORMATION'].includes(item.status) ? (
                  <button
                    type="button"
                    onClick={() => cancel(item.id)}
                    className="mt-3 text-sm font-semibold text-red-600"
                  >
                    ยกเลิกคำร้อง
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
