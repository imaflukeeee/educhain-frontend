'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import type { CredentialWorkflowStatus, WorkflowCredential } from '@/types/api';

const labels: Record<CredentialWorkflowStatus, string> = {
  DRAFT: 'ฉบับร่าง',
  PENDING_REVIEW: 'รอตรวจสอบ',
  CHANGES_REQUESTED: 'ส่งกลับแก้ไข',
  PENDING_APPROVAL: 'รออนุมัติ',
  REJECTED: 'ปฏิเสธ',
  APPROVED: 'อนุมัติแล้ว',
  ISSUED: 'ออกสำเร็จ',
};

export default function DocumentApprovalPage() {
  const [items, setItems] = useState<WorkflowCredential[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setError('');
    try {
      const response = await api.get<WorkflowCredential[]>(`/workflow${status ? `?status=${status}` : ''}`);
      setItems(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  async function action(id: string, actionName: string) {
    const note = ['request-changes', 'reject'].includes(actionName)
      ? window.prompt('ระบุเหตุผลหรือหมายเหตุ') ?? ''
      : '';
    if (['request-changes', 'reject'].includes(actionName) && !note.trim()) return;

    setError('');
    setMessage('');
    try {
      await api.post(`/workflow/${id}/${actionName}`, { note });
      setMessage('อัปเดตสถานะเอกสารเรียบร้อยแล้ว');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">ตรวจสอบและอนุมัติเอกสาร</h2>
        <p className="mt-1 text-sm text-slate-500">ติดตามเอกสารตั้งแต่จัดเตรียม ตรวจสอบ อนุมัติ จนถึงออกเอกสารสำเร็จ</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[['', 'ทั้งหมด'], ...Object.entries(labels)].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setStatus(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${status === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {message ? <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <section className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800">{item.documentTitle}</h3>
                <div className="mt-1 text-sm text-slate-500">{item.studentName} · {item.studentId}</div>
                {item.workflowNote ? <div className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-700">หมายเหตุ: {item.workflowNote}</div> : null}
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{labels[item.workflowStatus]}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['DRAFT', 'CHANGES_REQUESTED'].includes(item.workflowStatus) ? (
                <button type="button" onClick={() => action(item.id, 'submit-review')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">ส่งตรวจ</button>
              ) : null}
              {item.workflowStatus === 'PENDING_REVIEW' ? (
                <>
                  <button type="button" onClick={() => action(item.id, 'pass-review')} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">ผ่านการตรวจ</button>
                  <button type="button" onClick={() => action(item.id, 'request-changes')} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">ส่งกลับแก้ไข</button>
                </>
              ) : null}
              {item.workflowStatus === 'PENDING_APPROVAL' ? (
                <>
                  <button type="button" onClick={() => action(item.id, 'approve')} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">อนุมัติ</button>
                  <button type="button" onClick={() => action(item.id, 'request-changes')} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">ส่งกลับแก้ไข</button>
                  <button type="button" onClick={() => action(item.id, 'reject')} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">ปฏิเสธ</button>
                </>
              ) : null}
            </div>
          </article>
        ))}
        {items.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-slate-400 shadow-sm">ยังไม่มีเอกสารในขั้นตอนการตรวจสอบและอนุมัติ</div> : null}
      </section>
    </div>
  );
}
