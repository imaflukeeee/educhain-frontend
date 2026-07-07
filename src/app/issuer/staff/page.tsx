'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import type {
  CreateStaffResponse,
  StaffListResponse,
  StaffMember,
  StaffPermission,
  UpdateStaffResponse,
} from '@/types/api';

const permissionOptions: Array<{ value: StaffPermission; label: string; description: string }> = [
  {
    value: 'CREATE_CREDENTIAL',
    label: 'ออกเอกสาร',
    description: 'สร้างเอกสารรับรองให้กับนักศึกษา',
  },
  {
    value: 'REGISTER_CREDENTIAL',
    label: 'ยืนยันเอกสาร',
    description: 'กดยืนยันเอกสารหลังตรวจสอบข้อมูลครบถ้วน',
  },
  {
    value: 'VIEW_ALL_CREDENTIALS',
    label: 'ดูเอกสารทั้งหมดของมหาวิทยาลัย',
    description: 'เห็นเอกสารที่เจ้าหน้าที่คนอื่นออกด้วย',
  },
  {
    value: 'INVALIDATE_CREDENTIAL',
    label: 'เพิกถอนเอกสาร',
    description: 'ยกเลิกเอกสารที่ไม่ควรใช้งานต่อ',
  },
];

const defaultPermissions: StaffPermission[] = ['CREATE_CREDENTIAL', 'REGISTER_CREDENTIAL'];

function fullName(user: Pick<StaffMember, 'name' | 'firstNameTh' | 'lastNameTh' | 'firstNameEn' | 'lastNameEn'>) {
  return (
    [user.firstNameTh, user.lastNameTh].filter(Boolean).join(' ') ||
    [user.firstNameEn, user.lastNameEn].filter(Boolean).join(' ') ||
    user.name
  );
}

function hasPermission(user: StaffMember, permission: StaffPermission) {
  return (user.permissions ?? []).includes(permission);
}

export default function StaffManagementPage() {
  const { user } = useAuth();
  const isUniversityAdmin = Boolean(user && user.issuerAccountType !== 'REGISTRAR_STAFF');

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstNameTh, setFirstNameTh] = useState('');
  const [lastNameTh, setLastNameTh] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [staffPosition, setStaffPosition] = useState('เจ้าหน้าที่ทะเบียน');
  const [staffDepartment, setStaffDepartment] = useState('งานทะเบียนและวัดผล');
  const [permissions, setPermissions] = useState<StaffPermission[]>(defaultPermissions);
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedStaff = useMemo(
    () => staffMembers.find((staff) => staff.id === selectedStaffId) ?? null,
    [selectedStaffId, staffMembers],
  );

  async function loadStaffMembers() {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get<StaffListResponse>('/auth/issuer/staff');
      setStaffMembers(response.data.staffMembers ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isUniversityAdmin) {
      setIsLoading(false);
      return;
    }

    void loadStaffMembers();
  }, [isUniversityAdmin]);

  function resetForm() {
    setSelectedStaffId(null);
    setFirstNameTh('');
    setLastNameTh('');
    setFirstNameEn('');
    setLastNameEn('');
    setEmail('');
    setPassword('');
    setPhone('');
    setStaffPosition('เจ้าหน้าที่ทะเบียน');
    setStaffDepartment('งานทะเบียนและวัดผล');
    setPermissions(defaultPermissions);
    setIsActive(true);
    setNewPassword('');
  }

  function openCreateStaffModal() {
    resetForm();
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
    setError('');
  }

  function editStaff(staff: StaffMember) {
    setSelectedStaffId(staff.id);
    setFirstNameTh(staff.firstNameTh ?? '');
    setLastNameTh(staff.lastNameTh ?? '');
    setFirstNameEn(staff.firstNameEn ?? '');
    setLastNameEn(staff.lastNameEn ?? '');
    setEmail(staff.email);
    setPassword('');
    setPhone(staff.phone ?? '');
    setStaffPosition(staff.staffPosition ?? 'เจ้าหน้าที่ทะเบียน');
    setStaffDepartment(staff.staffDepartment ?? 'งานทะเบียนและวัดผล');
    setPermissions((staff.permissions ?? defaultPermissions) as StaffPermission[]);
    setIsActive(staff.isActive !== false);
    setNewPassword('');
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  }

  function togglePermission(permission: StaffPermission) {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!firstNameTh.trim() || !lastNameTh.trim()) {
      setError('กรุณากรอกชื่อและนามสกุลเจ้าหน้าที่');
      return;
    }

    if (!selectedStaff && password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (selectedStaff && newPassword && newPassword.length < 8) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedStaff) {
        const response = await api.patch<UpdateStaffResponse>(
          `/auth/issuer/staff/${selectedStaff.id}`,
          {
            firstNameTh,
            lastNameTh,
            firstNameEn,
            lastNameEn,
            phone,
            staffPosition,
            staffDepartment,
            permissions,
            isActive,
            newPassword: newPassword || undefined,
          },
        );

        setSuccess(response.data.message ?? 'บันทึกข้อมูลเจ้าหน้าที่สำเร็จ');
      } else {
        const response = await api.post<CreateStaffResponse>('/auth/issuer/staff', {
          email,
          password,
          firstNameTh,
          lastNameTh,
          firstNameEn,
          lastNameEn,
          phone,
          staffPosition,
          staffDepartment,
          permissions,
        });

        setSuccess(response.data.message ?? 'เพิ่มบัญชีเจ้าหน้าที่สำเร็จ');
      }

      await loadStaffMembers();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isUniversityAdmin) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-blue-600">จัดการเจ้าหน้าที่</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          เมนูนี้สำหรับบัญชีหลักของมหาวิทยาลัยเท่านั้น หากต้องการเพิ่มหรือแก้ไขสิทธิ์เจ้าหน้าที่ กรุณาติดต่อผู้ดูแลบัญชีหลักของมหาวิทยาลัย
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-blue-600">👥 จัดการเจ้าหน้าที่ทะเบียน</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          เพิ่มบัญชีเจ้าหน้าที่ของมหาวิทยาลัยและกำหนดสิทธิ์การใช้งาน แต่ละคนจะเข้าสู่ระบบด้วยอีเมลของตนเอง และเอกสารที่ออกจะแสดงชื่อเจ้าหน้าที่คนนั้น
        </p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">รายชื่อเจ้าหน้าที่</h3>
            <p className="mt-1 text-sm text-slate-500">ดูรายชื่อเจ้าหน้าที่ทั้งหมด และกดเพิ่มเจ้าหน้าที่เพื่อเปิดแบบฟอร์ม</p>
          </div>
          <Button type="button" variant="secondary" onClick={openCreateStaffModal}>เพิ่มเจ้าหน้าที่</Button>
        </div>

        {success ? <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div> : null}
        {isLoading ? <div className="mt-6 text-sm text-slate-500">กำลังโหลดข้อมูล...</div> : null}
        {error && !isModalOpen ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        {!isLoading && staffMembers.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            ยังไม่มีเจ้าหน้าที่ในระบบ เริ่มจากเพิ่มบัญชีเจ้าหน้าที่คนแรก
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {staffMembers.map((staff) => (
            <div key={staff.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{fullName(staff)}</div>
                  <div className="mt-1 text-sm text-slate-500">{staff.staffPosition ?? 'เจ้าหน้าที่'} · {staff.staffDepartment ?? 'งานทะเบียน'}</div>
                  <div className="mt-1 break-all text-sm text-slate-500">{staff.email}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={['rounded-full px-3 py-1 text-xs font-semibold', staff.isActive === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'].join(' ')}>
                      {staff.isActive === false ? 'ปิดใช้งาน' : 'ใช้งานอยู่'}
                    </span>
                    {permissionOptions.filter((option) => hasPermission(staff, option.value)).map((option) => (
                      <span key={option.value} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {option.label}
                      </span>
                    ))}
                  </div>
                </div>
                <Button type="button" variant="secondary" onClick={() => editStaff(staff)}>แก้ไข</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedStaff ? 'แก้ไขข้อมูลเจ้าหน้าที่' : 'เพิ่มเจ้าหน้าที่'}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedStaff ? 'ปรับข้อมูลและสิทธิ์การใช้งานของเจ้าหน้าที่คนนี้' : 'สร้างบัญชีใหม่ให้เจ้าหน้าที่เข้าสู่ระบบด้วยอีเมลของตนเอง'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-3 py-1 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="ปิดหน้าต่าง"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="ชื่อ (ภาษาไทย)" placeholder="เช่น สมชาย" value={firstNameTh} onChange={(event) => setFirstNameTh(event.target.value)} required />
                <Input label="นามสกุล (ภาษาไทย)" placeholder="เช่น ใจดี" value={lastNameTh} onChange={(event) => setLastNameTh(event.target.value)} required />
                <Input label="ชื่อ (ภาษาอังกฤษ)" placeholder="เช่น Somchai" value={firstNameEn} onChange={(event) => setFirstNameEn(event.target.value)} />
                <Input label="นามสกุล (ภาษาอังกฤษ)" placeholder="เช่น Jaidee" value={lastNameEn} onChange={(event) => setLastNameEn(event.target.value)} />
              </div>

              <Input label="อีเมลสำหรับเข้าสู่ระบบ" type="email" placeholder="registrar@utcc.ac.th" value={email} onChange={(event) => setEmail(event.target.value)} disabled={Boolean(selectedStaff)} required />
              {!selectedStaff ? (
                <Input label="รหัสผ่านเริ่มต้น" type="password" placeholder="อย่างน้อย 8 ตัวอักษร" value={password} onChange={(event) => setPassword(event.target.value)} required />
              ) : (
                <Input label="ตั้งรหัสผ่านใหม่ (ไม่บังคับ)" type="password" placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              )}
              <Input label="เบอร์โทรศัพท์" type="tel" placeholder="เช่น 0812345678" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <Input label="ตำแหน่ง" placeholder="เช่น เจ้าหน้าที่ทะเบียน" value={staffPosition} onChange={(event) => setStaffPosition(event.target.value)} />
              <Input label="หน่วยงาน" placeholder="เช่น สำนักทะเบียน" value={staffDepartment} onChange={(event) => setStaffDepartment(event.target.value)} />

              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">สิทธิ์การใช้งาน</div>
                <div className="space-y-2">
                  {permissionOptions.map((option) => (
                    <label key={option.value} className="flex cursor-pointer gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={permissions.includes(option.value)}
                        onChange={() => togglePermission(option.value)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-700">{option.label}</span>
                        <span className="block text-xs leading-5 text-slate-500">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedStaff ? (
                <label className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4" />
                  เปิดใช้งานบัญชีนี้
                </label>
              ) : null}

              {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

              <div className="flex gap-3">
                <Button type="submit" isLoading={isSubmitting}>{selectedStaff ? 'บันทึกข้อมูล' : 'เพิ่มเจ้าหน้าที่'}</Button>
                <Button type="button" variant="secondary" onClick={closeModal}>ยกเลิก</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
