'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import type { Phase3Dashboard } from '@/types/api';

export default function Phase3OverviewPage() {
  const [data, setData] = useState<Phase3Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Phase3Dashboard>('/phase3/dashboard')
      .then((response) => setData(response.data))
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  if (error) return <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>;
  if (!data) return <div className="rounded-xl bg-white p-6 shadow-sm">กำลังโหลด Dashboard...</div>;

  const cards = [
    ['นักศึกษาทั้งหมด', data.students.total],
    ['Claim สำเร็จ', data.students.claimed],
    ['รอ Claim', data.students.unclaimed],
    ['ต้องตรวจสอบ', data.students.reviewRequired],
    ['เอกสารฉบับร่าง', data.workflow.draft],
    ['รอตรวจสอบ', data.workflow.pendingReview],
    ['รออนุมัติ', data.workflow.pendingApproval],
    ['ส่งกลับแก้ไข', data.workflow.changesRequested],
    ['อนุมัติแล้ว', data.workflow.approved],
    ['ออกสำเร็จ', data.workflow.issued],
  ] as const;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Phase 3</h2>
        <p className="mt-1 text-sm text-slate-500">ภาพรวมข้อมูลนักศึกษา การ Claim และ Workflow เอกสาร</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">{value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">กิจกรรมล่าสุด</h3>
        <div className="mt-4 divide-y divide-slate-100">
          {data.recentAudit.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div>
                <div className="font-semibold text-slate-700">{item.action}</div>
                <div className="text-slate-400">{item.actor?.name || item.actor?.email || 'ระบบ'} · {item.entityType}</div>
              </div>
              <div className="shrink-0 text-slate-400">{new Date(item.createdAt).toLocaleString('th-TH')}</div>
            </div>
          ))}
          {data.recentAudit.length === 0 ? <div className="py-8 text-center text-sm text-slate-400">ยังไม่มีกิจกรรม</div> : null}
        </div>
      </section>
    </div>
  );
}
