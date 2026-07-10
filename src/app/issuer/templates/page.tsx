'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { api, getApiErrorMessage } from '@/lib/api';
import type { DocumentRequestType, DocumentTemplate } from '@/types/api';

const types: Array<{ value: DocumentRequestType; label: string }> = [
  { value: 'STUDENT_STATUS_CERTIFICATE', label: 'ใบรับรองนักศึกษา' },
  { value: 'TRANSCRIPT', label: 'ใบแสดงผลการเรียน' },
  { value: 'DEGREE_CERTIFICATE', label: 'ปริญญาบัตร' },
  { value: 'GRADUATION_CERTIFICATE', label: 'หนังสือรับรองจบการศึกษา' },
  { value: 'STUDENT_CARD', label: 'บัตรนักศึกษา' },
  { value: 'OTHER', label: 'เอกสารอื่น ๆ' },
];

export default function TemplatesPage() {
  const [items, setItems] = useState<DocumentTemplate[]>([]);
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentRequestType>('STUDENT_STATUS_CERTIFICATE');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const response = await api.get<DocumentTemplate[]>('/document-lifecycle/templates');
      setItems(response.data);
    } catch (err) { setError(getApiErrorMessage(err)); }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post('/document-lifecycle/templates', { name, documentType, content });
      setName('');
      setContent('');
      await load();
    } catch (err) { setError(getApiErrorMessage(err)); }
  }

  async function remove(id: string) {
    if (!window.confirm('ยืนยันการลบแม่แบบนี้หรือไม่')) return;
    try {
      await api.delete(`/document-lifecycle/templates/${id}`);
      await load();
    } catch (err) { setError(getApiErrorMessage(err)); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">แม่แบบเอกสาร</h2>
        <p className="mt-2 text-sm text-slate-500">
          เตรียมรูปแบบข้อความสำหรับใช้สร้างเอกสารรายบุคคลหรือเอกสารจำนวนมาก
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium">ชื่อแม่แบบ *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-10 w-full rounded-lg border px-3" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">ประเภทเอกสาร *</span>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentRequestType)} className="h-10 w-full rounded-lg border px-3">
              {types.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">เนื้อหาแม่แบบ *</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder={'ตัวอย่าง: ขอรับรองว่า {{studentName}} รหัสนักศึกษา {{studentId}}'}
            className="min-h-40 w-full rounded-lg border p-3 text-sm"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">
          ตัวแปรแนะนำ: {'{{studentName}}'}, {'{{studentId}}'}, {'{{faculty}}'}, {'{{major}}'}, {'{{issueDate}}'}
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="mt-4">บันทึกแม่แบบ</Button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-800">{item.name}</h3>
            <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">{item.content}</p>
            <button onClick={() => remove(item.id)} className="mt-4 text-sm font-semibold text-red-600">ลบแม่แบบ</button>
          </div>
        ))}
      </div>
    </div>
  );
}
