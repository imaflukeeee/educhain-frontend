'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import type { Phase3Dashboard } from '@/types/api';

const cardStyles = [
  'border-blue-100 bg-blue-50 text-blue-700',
  'border-emerald-100 bg-emerald-50 text-emerald-700',
  'border-amber-100 bg-amber-50 text-amber-700',
  'border-rose-100 bg-rose-50 text-rose-700',
  'border-slate-200 bg-slate-50 text-slate-700',
  'border-cyan-100 bg-cyan-50 text-cyan-700',
  'border-violet-100 bg-violet-50 text-violet-700',
  'border-orange-100 bg-orange-50 text-orange-700',
  'border-indigo-100 bg-indigo-50 text-indigo-700',
  'border-green-100 bg-green-50 text-green-700',
] as const;

export default function OperationsOverviewPage() {
  const [data, setData] = useState<Phase3Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Phase3Dashboard>('/operations/dashboard')
      .then((response) => setData(response.data))
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  if (error) return <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>;
  if (!data) return <div className="rounded-xl bg-white p-6 shadow-sm">กำลังโหลดภาพรวมระบบ...</div>;

  const cards = [
    ['นักศึกษาทั้งหมด', data.students.total],
    ['เชื่อมบัญชีสำเร็จ', data.students.claimed],
    ['รอเชื่อมบัญชี', data.students.unclaimed],
    ['ข้อมูลต้องตรวจสอบ', data.students.reviewRequired],
    ['เอกสารฉบับร่าง', data.workflow.draft],
    ['รอตรวจสอบ', data.workflow.pendingReview],
    ['รออนุมัติ', data.workflow.pendingApproval],
    ['ส่งกลับแก้ไข', data.workflow.changesRequested],
    ['อนุมัติแล้ว', data.workflow.approved],
    ['ออกเอกสารสำเร็จ', data.workflow.issued],
  ] as const;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-800">ภาพรวมระบบ</h2>
        <p className="mt-1 text-sm text-slate-500">
          สรุปข้อมูลนักศึกษา การเชื่อมบัญชี และสถานะการดำเนินการเอกสารของมหาวิทยาลัย
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value], index) => (
          <div key={label} className={`rounded-2xl border p-5 shadow-sm ${cardStyles[index]}`}>
            <div className="text-sm font-medium opacity-80">{label}</div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
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
