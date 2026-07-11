'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { api, getApiErrorMessage } from '@/lib/api';
import type {
  Credential,
  DocumentRequest,
  DocumentRequestStatus,
  DocumentRequestType,
} from '@/types/api';

const statusOptions: Array<{ value: DocumentRequestStatus; label: string }> = [
  { value: 'SUBMITTED', label: 'คำร้องใหม่' },
  { value: 'RECEIVED', label: 'รับเรื่องแล้ว' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
  { value: 'NEED_MORE_INFORMATION', label: 'ขอข้อมูลเพิ่มเติม' },
  { value: 'REJECTED', label: 'ไม่อนุมัติ' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น' },
  { value: 'CANCELLED', label: 'ยกเลิกแล้ว' },
];

const requestTypes: Array<{ value: DocumentRequestType; label: string }> = [
  { value: 'STUDENT_STATUS_CERTIFICATE', label: 'ใบรับรองนักศึกษา' },
  { value: 'TRANSCRIPT', label: 'ใบแสดงผลการเรียน' },
  { value: 'DEGREE_CERTIFICATE', label: 'ปริญญาบัตร' },
  { value: 'GRADUATION_CERTIFICATE', label: 'หนังสือรับรองจบการศึกษา' },
  { value: 'STUDENT_CARD', label: 'บัตรนักศึกษา' },
  { value: 'OTHER', label: 'เอกสารอื่น ๆ' },
];

function typeLabel(item: DocumentRequest) {
  if (item.type === 'OTHER') return item.customTypeName || 'เอกสารอื่น ๆ';
  return requestTypes.find((entry) => entry.value === item.type)?.label || 'เอกสาร';
}

function statusLabel(status: DocumentRequestStatus) {
  return statusOptions.find((entry) => entry.value === status)?.label || status;
}

type CreateCredentialResponse =
  | Credential
  | { message?: string; credential?: Credential; data?: Credential };

export default function IssuerRequestsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<DocumentRequest[]>([]);
  const [selected, setSelected] = useState<DocumentRequest | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);

  const [editType, setEditType] = useState<DocumentRequestType>('DEGREE_CERTIFICATE');
  const [customTypeName, setCustomTypeName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [details, setDetails] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [status, setStatus] = useState<DocumentRequestStatus>('SUBMITTED');
  const [rejectionReason, setRejectionReason] = useState('');

  const [documentTitle, setDocumentTitle] = useState('ปริญญาบัตร');
  const [issuedAt, setIssuedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    try {
      const response = await api.get<DocumentRequest[]>('/document-lifecycle/requests');
      setItems(response.data);
      if (selected) {
        const refreshed = response.data.find((item) => item.id === selected.id) ?? null;
        setSelected(refreshed);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  useEffect(() => { void load(); }, []);

  function openModal(item: DocumentRequest) {
    setSelected(item);
    setEditType(item.type);
    setCustomTypeName(item.customTypeName || '');
    setPurpose(item.purpose || '');
    setDetails(item.details || '');
    setStaffNote(item.staffNote || '');
    setStatus(item.status);
    setRejectionReason(item.rejectionReason || '');
    setDocumentTitle(typeLabel(item));
    setIssuedAt(new Date().toISOString().slice(0, 10));
    setFile(null);
    setShowIssueForm(false);
    setError('');
    setMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function saveRequest(nextStatus = status) {
    if (!selected) return;
    if (nextStatus === 'REJECTED' && !rejectionReason.trim()) {
      setError('กรุณาระบุเหตุผลที่ไม่อนุมัติคำร้อง');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.patch(`/document-lifecycle/requests/${selected.id}`, {
        status: nextStatus,
        type: editType,
        customTypeName: editType === 'OTHER' ? customTypeName : undefined,
        purpose,
        details,
        staffNote,
        rejectionReason: nextStatus === 'REJECTED' ? rejectionReason : undefined,
      });
      setMessage(nextStatus === 'REJECTED' ? 'ปฏิเสธคำร้องเรียบร้อยแล้ว' : 'บันทึกการแก้ไขคำร้องเรียบร้อยแล้ว');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function issueCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected?.holder) return;
    if (!file || file.type !== 'application/pdf') {
      setError('กรุณาเลือกไฟล์ PDF ที่ถูกต้อง');
      return;
    }

    const holder = selected.holder;
    const formData = new FormData();
    formData.append('requestId', selected.id);
    formData.append('holderEmail', holder.email);
    formData.append('studentName', holder.name);
    formData.append('studentId', holder.studentId || '');
    formData.append('faculty', holder.faculty || '');
    formData.append('major', holder.major || '');
    formData.append('documentTitle', documentTitle);
    formData.append('issuedAt', issuedAt);
    formData.append('file', file);

    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post<CreateCredentialResponse>('/credentials', formData);
      setMessage('ออกเอกสารจากคำร้องสำเร็จ เอกสารถูกส่งเข้าสู่ขั้นตอนตรวจสอบแล้ว');
      setShowIssueForm(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const canIssueDegree =
    selected?.type === 'DEGREE_CERTIFICATE' &&
    !['REJECTED', 'CANCELLED', 'COMPLETED'].includes(selected.status) &&
    !selected.credential;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">คำร้องเอกสารจากนักศึกษา</h2>
        <p className="mt-2 text-sm text-slate-500">
          คลิกรายการเพื่อดูรายละเอียด แก้ไข ปฏิเสธ หรือออกเอกสารให้แก่นักศึกษา
        </p>
      </div>

      {error && !selected ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">นักศึกษา</th>
                <th className="px-4 py-3">เอกสาร</th>
                <th className="px-4 py-3">วันที่ส่ง</th>
                <th className="px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => openModal(item)}
                  className="cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/50"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800">{item.holder?.name || '-'}</p>
                    <p className="text-xs text-slate-500">{item.holder?.studentId || '-'}</p>
                  </td>
                  <td className="px-4 py-4">{typeLabel(item)}</td>
                  <td className="px-4 py-4">{new Date(item.submittedAt).toLocaleDateString('th-TH')}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {statusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 ? <p className="p-6 text-sm text-slate-500">ยังไม่มีคำร้องเอกสาร</p> : null}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">รายละเอียดคำร้องเอกสาร</h3>
                <p className="mt-1 text-sm text-slate-500">{typeLabel(selected)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100">×</button>
            </div>

            <section className="mt-6 rounded-xl bg-slate-50 p-4">
              <h4 className="font-bold text-slate-700">ข้อมูลนักศึกษา</h4>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <p><span className="text-slate-500">ชื่อ:</span> {selected.holder?.name || '-'}</p>
                <p><span className="text-slate-500">รหัสนักศึกษา:</span> {selected.holder?.studentId || '-'}</p>
                <p><span className="text-slate-500">คณะ:</span> {selected.holder?.faculty || '-'}</p>
                <p><span className="text-slate-500">สาขาวิชา:</span> {selected.holder?.major || '-'}</p>
                <p><span className="text-slate-500">อีเมล:</span> {selected.holder?.email || '-'}</p>
                <p><span className="text-slate-500">วันที่ส่ง:</span> {new Date(selected.submittedAt).toLocaleString('th-TH')}</p>
              </div>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">ประเภทเอกสาร</span>
                <select value={editType} onChange={(e) => setEditType(e.target.value as DocumentRequestType)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  {requestTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">สถานะคำร้อง</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as DocumentRequestStatus)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  {statusOptions.filter((item) => item.value !== 'CANCELLED').map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              {editType === 'OTHER' ? <Input label="ชื่อเอกสาร" value={customTypeName} onChange={(e) => setCustomTypeName(e.target.value)} required /> : null}
              <Input label="วัตถุประสงค์" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">รายละเอียดคำร้อง</span>
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">หมายเหตุเจ้าหน้าที่</span>
                <textarea value={staffNote} onChange={(e) => setStaffNote(e.target.value)} className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">เหตุผลกรณีไม่อนุมัติ</span>
                <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="min-h-20 w-full rounded-lg border border-red-200 p-3 text-sm" />
              </label>
            </section>

            {selected.credential ? (
              <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                คำร้องนี้เชื่อมกับเอกสาร “{selected.credential.documentTitle}” แล้ว
              </div>
            ) : null}

            {showIssueForm && canIssueDegree ? (
              <form onSubmit={issueCredential} className="mt-6 rounded-xl border border-blue-200 bg-blue-50/40 p-5">
                <h4 className="font-bold text-blue-700">ออกเอกสารปริญญาบัตร</h4>
                <p className="mt-1 text-sm text-slate-600">ข้อมูลนักศึกษาถูกดึงจากคำร้องให้อัตโนมัติ กรุณาระบุรายละเอียดเอกสารและอัปโหลด PDF</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input label="ชื่อเอกสาร" value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} required />
                  <Input label="วันที่ออกเอกสาร" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} required />
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-medium text-slate-700">ไฟล์เอกสาร PDF <span className="text-red-500">*</span></span>
                    <input ref={fileInputRef} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required className="block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm" />
                  </label>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button type="submit" isLoading={saving}>ยืนยันออกเอกสาร</Button>
                  <button type="button" onClick={() => setShowIssueForm(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">ยกเลิก</button>
                </div>
              </form>
            ) : null}

            {message ? <div className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div> : null}
            {error ? <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => void saveRequest('REJECTED')} disabled={saving || ['CANCELLED', 'COMPLETED'].includes(selected.status)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">ปฏิเสธคำร้อง</button>
              {canIssueDegree ? <button type="button" onClick={() => setShowIssueForm(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">ออกเอกสาร</button> : null}
              <Button type="button" onClick={() => void saveRequest()} isLoading={saving}>บันทึกการแก้ไข</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
