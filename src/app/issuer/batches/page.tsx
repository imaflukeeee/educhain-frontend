'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { api, getApiErrorMessage } from '@/lib/api';
import type {
  CredentialBatch,
  CredentialBatchStatus,
  DocumentRequestType,
  DocumentTemplate,
} from '@/types/api';

const typeOptions: Array<{ value: DocumentRequestType; label: string }> = [
  { value: 'STUDENT_STATUS_CERTIFICATE', label: 'ใบรับรองนักศึกษา' },
  { value: 'TRANSCRIPT', label: 'ใบแสดงผลการเรียน' },
  { value: 'DEGREE_CERTIFICATE', label: 'ปริญญาบัตร' },
  { value: 'GRADUATION_CERTIFICATE', label: 'หนังสือรับรองจบการศึกษา' },
  { value: 'STUDENT_CARD', label: 'บัตรนักศึกษา' },
  { value: 'OTHER', label: 'เอกสารอื่น ๆ' },
];

const statusLabels: Record<CredentialBatchStatus, string> = {
  DRAFT: 'ฉบับร่าง',
  PREPARING: 'กำลังเตรียมข้อมูล',
  PENDING_REVIEW: 'รอตรวจสอบ',
  PENDING_APPROVAL: 'รออนุมัติ',
  PROCESSING: 'กำลังสร้างเอกสาร',
  COMPLETED: 'เสร็จสมบูรณ์',
  PARTIALLY_COMPLETED: 'สำเร็จบางส่วน',
  FAILED: 'ดำเนินการไม่สำเร็จ',
};

export default function BatchesPage() {
  const [items, setItems] = useState<CredentialBatch[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentRequestType>('DEGREE_CERTIFICATE');
  const [academicYear, setAcademicYear] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const [batchRes, templateRes] = await Promise.all([
        api.get<CredentialBatch[]>('/document-lifecycle/batches'),
        api.get<DocumentTemplate[]>('/document-lifecycle/templates'),
      ]);
      setItems(batchRes.data);
      setTemplates(templateRes.data);
    } catch (err) { setError(getApiErrorMessage(err)); }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post('/document-lifecycle/batches', {
        name,
        documentType,
        academicYear,
        templateId: templateId || undefined,
      });
      setName('');
      setAcademicYear('');
      await load();
    } catch (err) { setError(getApiErrorMessage(err)); }
  }

  async function move(id: string, status: CredentialBatchStatus) {
    try {
      await api.patch(`/document-lifecycle/batches/${id}/status`, { status });
      await load();
    } catch (err) { setError(getApiErrorMessage(err)); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">ออกเอกสารจำนวนมาก</h2>
        <p className="mt-2 text-sm text-slate-500">
          สร้างชุดงานเอกสารสำหรับนักศึกษาหลายคน แล้วส่งตรวจและอนุมัติเป็นลำดับ
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium">ชื่อชุดเอกสาร *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-10 w-full rounded-lg border px-3" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">ประเภทเอกสาร *</span>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentRequestType)} className="h-10 w-full rounded-lg border px-3">
              {typeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">ปีการศึกษา</span>
            <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="เช่น 2569" className="h-10 w-full rounded-lg border px-3" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">แม่แบบเอกสาร</span>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="h-10 w-full rounded-lg border px-3">
              <option value="">ยังไม่เลือกแม่แบบ</option>
              {templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="mt-4">สร้างชุดเอกสาร</Button>
      </form>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  นักศึกษา {item.totalCount.toLocaleString('th-TH')} คน
                  {item.academicYear ? ` • ปีการศึกษา ${item.academicYear}` : ''}
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {statusLabels[item.status]}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.status === 'DRAFT' ? <button onClick={() => move(item.id, 'PREPARING')} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">เริ่มเตรียมข้อมูล</button> : null}
              {item.status === 'PREPARING' ? <button onClick={() => move(item.id, 'PENDING_REVIEW')} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">ส่งตรวจสอบ</button> : null}
              {item.status === 'PENDING_REVIEW' ? <button onClick={() => move(item.id, 'PENDING_APPROVAL')} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">ผ่านการตรวจสอบ</button> : null}
              {item.status === 'PENDING_APPROVAL' ? <button onClick={() => move(item.id, 'PROCESSING')} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white">อนุมัติและเริ่มดำเนินการ</button> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
