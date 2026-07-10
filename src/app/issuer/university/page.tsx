'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { FacultyOption } from '@/types/api';

export default function UniversitySettingsPage() {
  const [items, setItems] = useState<FacultyOption[]>([]);
  const [faculty, setFaculty] = useState('');
  const [facultyEn, setFacultyEn] = useState('');
  const [major, setMajor] = useState('');
  const [majorEn, setMajorEn] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const response = await api.get<FacultyOption[]>('/universities/issuer/mine/faculties');
      setItems(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function addFaculty() {
    setError('');
    setMessage('');
    try {
      await api.post('/universities/issuer/faculties', {
        nameTh: faculty,
        nameEn: facultyEn || undefined,
      });
      setFaculty('');
      setFacultyEn('');
      setMessage('เพิ่มคณะเรียบร้อยแล้ว');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function addMajor() {
    setError('');
    setMessage('');
    try {
      await api.post('/universities/issuer/majors', {
        facultyId,
        nameTh: major,
        nameEn: majorEn || undefined,
      });
      setMajor('');
      setMajorEn('');
      setMessage('เพิ่มสาขาวิชาเรียบร้อยแล้ว');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function toggle(kind: 'faculties' | 'majors', id: string, isActive: boolean) {
    setError('');
    setMessage('');
    try {
      await api.patch(`/universities/issuer/${kind}/${id}/active`, { isActive });
      setMessage(isActive ? 'เปิดใช้งานเรียบร้อยแล้ว' : 'ปิดใช้งานเรียบร้อยแล้ว');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function removeFaculty(id: string, name: string) {
    const confirmed = window.confirm(
      `ยืนยันการลบคณะ “${name}” หรือไม่?

สาขาวิชาภายในคณะนี้จะถูกลบด้วย และไม่สามารถย้อนกลับได้`,
    );
    if (!confirmed) return;

    setError('');
    setMessage('');
    try {
      await api.delete(`/universities/issuer/faculties/${id}`);
      setMessage('ลบคณะเรียบร้อยแล้ว');
      if (facultyId === id) setFacultyId('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function removeMajor(id: string, name: string) {
    const confirmed = window.confirm(
      `ยืนยันการลบสาขาวิชา “${name}” หรือไม่?

การลบนี้ไม่สามารถย้อนกลับได้`,
    );
    if (!confirmed) return;

    setError('');
    setMessage('');
    try {
      await api.delete(`/universities/issuer/majors/${id}`);
      setMessage('ลบสาขาวิชาเรียบร้อยแล้ว');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">จัดการคณะและสาขาวิชา</h2>
        <p className="mt-2 text-sm text-slate-500">
          เพิ่ม ปิดใช้งาน หรือลบคณะและสาขาวิชาที่นักศึกษาจะเลือกใช้ในระบบ
        </p>
      </div>

      {message ? <div className="rounded-lg bg-green-50 p-3 text-green-700">{message}</div> : null}
      {error ? <div className="rounded-lg bg-red-50 p-3 text-red-700">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="font-bold">เพิ่มคณะ</h3>
          <div className="mt-4 space-y-3">
            <Input label="ชื่อคณะ (ภาษาไทย)" value={faculty} onChange={(event) => setFaculty(event.target.value)} required />
            <Input label="ชื่อคณะ (ภาษาอังกฤษ)" value={facultyEn} onChange={(event) => setFacultyEn(event.target.value)} />
            <Button onClick={addFaculty}>เพิ่มคณะ</Button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="font-bold">เพิ่มสาขาวิชา</h3>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium">
              คณะ <span className="text-red-500">*</span>
              <select
                className="mt-1 h-10 w-full rounded-lg border px-3"
                value={facultyId}
                onChange={(event) => setFacultyId(event.target.value)}
                required
              >
                <option value="">เลือกคณะ</option>
                {items.filter((item) => item.isActive).map((item) => (
                  <option key={item.id} value={item.id}>{item.nameTh}</option>
                ))}
              </select>
            </label>
            <Input label="ชื่อสาขา (ภาษาไทย)" value={major} onChange={(event) => setMajor(event.target.value)} required />
            <Input label="ชื่อสาขา (ภาษาอังกฤษ)" value={majorEn} onChange={(event) => setMajorEn(event.target.value)} />
            <Button onClick={addMajor}>เพิ่มสาขา</Button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="font-bold">รายการคณะและสาขาวิชา</h3>
        <div className="mt-4 space-y-4">
          {items.map((facultyItem) => (
            <div key={facultyItem.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-800">{facultyItem.nameTh}</div>
                  {facultyItem.nameEn ? <div className="text-sm text-slate-400">{facultyItem.nameEn}</div> : null}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600"
                    onClick={() => toggle('faculties', facultyItem.id, !facultyItem.isActive)}
                  >
                    {facultyItem.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  </button>
                  <button
                    type="button"
                    className="text-sm font-medium text-red-600"
                    onClick={() => removeFaculty(facultyItem.id, facultyItem.nameTh)}
                  >
                    ลบคณะ
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {facultyItem.majors.map((majorItem) => (
                  <div key={majorItem.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <div>
                      <span className="text-slate-700">{majorItem.nameTh}</span>
                      {majorItem.nameEn ? <span className="ml-2 text-slate-400">({majorItem.nameEn})</span> : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="font-medium text-blue-600"
                        onClick={() => toggle('majors', majorItem.id, !majorItem.isActive)}
                      >
                        {majorItem.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      </button>
                      <button
                        type="button"
                        className="font-medium text-red-600"
                        onClick={() => removeMajor(majorItem.id, majorItem.nameTh)}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
                {facultyItem.majors.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">ยังไม่มีสาขาวิชา</div>
                ) : null}
              </div>
            </div>
          ))}
          {items.length === 0 ? <div className="py-8 text-center text-sm text-slate-400">ยังไม่มีข้อมูลคณะและสาขาวิชา</div> : null}
        </div>
      </section>
    </div>
  );
}
