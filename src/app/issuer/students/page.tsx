'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { api, getApiErrorMessage } from '@/lib/api';
import type { FacultyOption, NamePrefix, StudentClaimStatus, StudentRecord } from '@/types/api';

const statusLabels: Record<StudentClaimStatus, string> = {
  UNCLAIMED: 'รอนักศึกษารับข้อมูล',
  CLAIMED: 'Claim สำเร็จ',
  REVIEW_REQUIRED: 'ต้องตรวจสอบ',
  REJECTED: 'ปฏิเสธ',
};

interface NewStudentForm {
  studentId: string;
  namePrefix: NamePrefix | '';
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  birthDate: string;
  nationalId: string;
  email: string;
  facultyId: string;
  majorId: string;
}

const emptyForm: NewStudentForm = {
  studentId: '',
  namePrefix: '',
  firstNameTh: '',
  lastNameTh: '',
  firstNameEn: '',
  lastNameEn: '',
  birthDate: '',
  nationalId: '',
  email: '',
  facultyId: '',
  majorId: '',
};

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default function StudentsPage() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState<NewStudentForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const majors = useMemo(
    () => faculties.find((faculty) => faculty.id === form.facultyId)?.majors ?? [],
    [faculties, form.facultyId],
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [studentsResponse, facultyResponse] = await Promise.all([
        api.get<StudentRecord[]>(`/students${status ? `?claimStatus=${status}` : ''}`),
        api.get<FacultyOption[]>('/universities/issuer/mine/faculties'),
      ]);
      setRecords(studentsResponse.data);
      setFaculties(facultyResponse.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  function update<K extends keyof NewStudentForm>(key: K, value: NewStudentForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!form.namePrefix) {
      setError('กรุณาเลือกคำนำหน้าชื่อ');
      return;
    }

    try {
      await api.post('/students', form);
      setForm(emptyForm);
      setShowForm(false);
      setMessage('เพิ่มข้อมูลนักศึกษาเรียบร้อยแล้ว');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setMessage('');
    try {
      const text = await file.text();
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error('ไฟล์ CSV ไม่มีข้อมูล');

      const headers = splitCsvLine(lines[0]);
      const rows = lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        const data = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
        return {
          studentId: data.studentId,
          namePrefix: data.namePrefix || undefined,
          firstNameTh: data.firstNameTh,
          lastNameTh: data.lastNameTh,
          firstNameEn: data.firstNameEn || undefined,
          lastNameEn: data.lastNameEn || undefined,
          birthDate: data.birthDate,
          nationalId: data.nationalId || undefined,
          email: data.email || undefined,
          facultyId: data.facultyId || undefined,
          majorId: data.majorId || undefined,
        };
      });

      const response = await api.post<{ total: number; success: number; failed: number }>('/students/import', { rows });
      setMessage(`นำเข้า ${response.data.success}/${response.data.total} รายการ ไม่สำเร็จ ${response.data.failed} รายการ`);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  function downloadTemplate() {
    const content = [
      'studentId,namePrefix,firstNameTh,lastNameTh,firstNameEn,lastNameEn,birthDate,nationalId,email,facultyId,majorId',
      '2410717302050,MR,สมชาย,ใจดี,Somchai,Jaidee,2004-01-31,1234567890123,student@example.com,,',
    ].join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'educhain-student-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">นักศึกษาทั้งหมด</h2>
            <p className="mt-1 text-sm text-slate-500">เพิ่ม นำเข้า และตรวจสอบสถานะ Claim ของนักศึกษา</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadTemplate} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600">
              ดาวน์โหลด CSV Template
            </button>
            <label className="cursor-pointer rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600">
              นำเข้า CSV
              <input type="file" accept=".csv,text/csv" onChange={importCsv} className="hidden" />
            </label>
            <Button type="button" onClick={() => setShowForm((value) => !value)}>
              {showForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มนักศึกษา'}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ['', 'ทั้งหมด'],
            ['UNCLAIMED', 'รอ Claim'],
            ['CLAIMED', 'Claim สำเร็จ'],
            ['REVIEW_REQUIRED', 'ต้องตรวจสอบ'],
            ['REJECTED', 'ปฏิเสธ'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${status === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {showForm ? (
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">เพิ่มข้อมูลนักศึกษา</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Input label="รหัสนักศึกษา" value={form.studentId} onChange={(e) => update('studentId', e.target.value)} required />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">คำนำหน้าชื่อ <span className="text-red-500">*</span></span>
              <select value={form.namePrefix} onChange={(e) => update('namePrefix', e.target.value as NamePrefix | '')} required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="">เลือกคำนำหน้า</option><option value="MR">นาย</option><option value="MISS">นางสาว</option><option value="MRS">นาง</option>
              </select>
            </label>
            <Input label="ชื่อ (ภาษาไทย)" value={form.firstNameTh} onChange={(e) => update('firstNameTh', e.target.value)} required />
            <Input label="นามสกุล (ภาษาไทย)" value={form.lastNameTh} onChange={(e) => update('lastNameTh', e.target.value)} required />
            <Input label="ชื่อ (ภาษาอังกฤษ)" value={form.firstNameEn} onChange={(e) => update('firstNameEn', e.target.value)} />
            <Input label="นามสกุล (ภาษาอังกฤษ)" value={form.lastNameEn} onChange={(e) => update('lastNameEn', e.target.value)} />
            <Input label="วันเกิด" type="date" value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} required />
            <Input label="เลขบัตรประชาชน" value={form.nationalId} onChange={(e) => update('nationalId', e.target.value.replace(/\D/g, '').slice(0, 13))} />
            <Input label="อีเมล" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">คณะ</span>
              <select value={form.facultyId} onChange={(e) => { update('facultyId', e.target.value); update('majorId', ''); }} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="">ไม่ระบุ</option>
                {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.nameTh}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">สาขา</span>
              <select value={form.majorId} onChange={(e) => update('majorId', e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                <option value="">ไม่ระบุ</option>
                {majors.map((major) => <option key={major.id} value={major.id}>{major.nameTh}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-5"><Button type="submit">บันทึกนักศึกษา</Button></div>
        </form>
      ) : null}

      {message ? <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">รหัสนักศึกษา</th><th className="px-5 py-3">ชื่อ–นามสกุล</th><th className="px-5 py-3">คณะ/สาขา</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">วันที่นำเข้า</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4 font-semibold text-slate-700">{record.studentId}</td>
                  <td className="px-5 py-4">{record.firstNameTh} {record.lastNameTh}<div className="text-xs text-slate-400">{record.email || '-'}</div></td>
                  <td className="px-5 py-4">{record.faculty?.nameTh || '-'}<div className="text-xs text-slate-400">{record.major?.nameTh || '-'}</div></td>
                  <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{statusLabels[record.claimStatus]}</span></td>
                  <td className="px-5 py-4 text-slate-500">{new Date(record.createdAt).toLocaleDateString('th-TH')}</td>
                </tr>
              ))}
              {!loading && records.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">ยังไม่มีข้อมูลนักศึกษา</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
