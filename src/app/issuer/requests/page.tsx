'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import type { DocumentRequest, DocumentRequestStatus } from '@/types/api';

const statusOptions: Array<{ value: DocumentRequestStatus; label: string }> = [
  { value: 'SUBMITTED', label: 'คำร้องใหม่' },
  { value: 'RECEIVED', label: 'รับเรื่องแล้ว' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
  { value: 'NEED_MORE_INFORMATION', label: 'ขอข้อมูลเพิ่มเติม' },
  { value: 'REJECTED', label: 'ไม่อนุมัติ' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น' },
  { value: 'CANCELLED', label: 'ยกเลิกแล้ว' },
];

const typeLabels: Record<string, string> = {
  STUDENT_STATUS_CERTIFICATE: 'ใบรับรองนักศึกษา',
  TRANSCRIPT: 'ใบแสดงผลการเรียน',
  DEGREE_CERTIFICATE: 'ปริญญาบัตร',
  GRADUATION_CERTIFICATE: 'หนังสือรับรองจบการศึกษา',
  STUDENT_CARD: 'บัตรนักศึกษา',
  OTHER: 'เอกสารอื่น ๆ',
};

export default function IssuerRequestsPage() {
  const [items, setItems] = useState<DocumentRequest[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const response = await api.get<DocumentRequest[]>('/document-lifecycle/requests');
      setItems(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  useEffect(() => { void load(); }, []);

  async function update(item: DocumentRequest, status: DocumentRequestStatus) {
    let rejectionReason: string | undefined;
    if (status === 'REJECTED') {
      rejectionReason = window.prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติคำร้อง') || undefined;
      if (!rejectionReason) return;
    }
    try {
      await api.patch(`/document-lifecycle/requests/${item.id}`, {
        status,
        rejectionReason,
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">คำร้องเอกสารจากนักศึกษา</h2>
        <p className="mt-2 text-sm text-slate-500">
          รับเรื่อง มอบหมาย และติดตามการดำเนินการคำร้องของนักศึกษา
        </p>
      </div>

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

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
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800">{item.holder?.name}</p>
                    <p className="text-xs text-slate-500">{item.holder?.studentId || '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    {item.type === 'OTHER' ? item.customTypeName : typeLabels[item.type]}
                  </td>
                  <td className="px-4 py-4">
                    {new Date(item.submittedAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={item.status}
                      onChange={(event) =>
                        update(item, event.target.value as DocumentRequestStatus)
                      }
                      disabled={item.status === 'CANCELLED'}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 ? <p className="p-6 text-sm text-slate-500">ยังไม่มีคำร้องเอกสาร</p> : null}
      </div>
    </div>
  );
}
