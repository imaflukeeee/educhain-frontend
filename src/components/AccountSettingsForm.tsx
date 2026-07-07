'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './Button';
import { Input } from './Input';
import type {
  ChangePasswordResponse,
  ProfilePayload,
  UpdateProfileResponse,
  UpdateWalletResponse,
  UserRole,
} from '@/types/api';

interface AccountSettingsFormProps {
  role: UserRole;
  title: string;
  description: string;
}

function cleanPayload(payload: ProfilePayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

function displayValue(value?: string | null) {
  return value?.trim() || '-';
}

function formatBirthDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function calculateAge(value?: string | null) {
  if (!value) {
    return '-';
  }

  const today = new Date();
  const dateOfBirth = new Date(value);

  if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth > today) {
    return '-';
  }

  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }

  return `${age} ปี`;
}

function ReadonlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <Input
      label={label}
      value={displayValue(value)}
      disabled
      readOnly
      className="cursor-not-allowed bg-slate-100 text-slate-500"
    />
  );
}

export function AccountSettingsForm({
  role,
  title,
  description,
}: AccountSettingsFormProps) {
  const { user, refreshMe } = useAuth();
  const isIssuer = role === 'ISSUER';
  const isStaff = user?.issuerAccountType === 'REGISTRAR_STAFF';
  const isUniversityAdmin = isIssuer && !isStaff;
  const isHolder = role === 'HOLDER';
  const universityNameForStaff =
    user?.universityOwner?.universityNameTh ||
    user?.universityNameTh ||
    user?.universityOwner?.name ||
    user?.name;

  const [firstNameTh, setFirstNameTh] = useState('');
  const [lastNameTh, setLastNameTh] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [universityNameTh, setUniversityNameTh] = useState('');
  const [universityNameEn, setUniversityNameEn] = useState('');
  const [contactFirstNameTh, setContactFirstNameTh] = useState('');
  const [contactLastNameTh, setContactLastNameTh] = useState('');
  const [contactFirstNameEn, setContactFirstNameEn] = useState('');
  const [contactLastNameEn, setContactLastNameEn] = useState('');
  const [staffPosition, setStaffPosition] = useState('');
  const [staffDepartment, setStaffDepartment] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingWallet, setIsSavingWallet] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setFirstNameTh(user?.firstNameTh ?? '');
    setLastNameTh(user?.lastNameTh ?? '');
    setFirstNameEn(user?.firstNameEn ?? '');
    setLastNameEn(user?.lastNameEn ?? '');
    setPhone(user?.phone ?? '');
    setBirthDate(user?.birthDate ?? '');
    setStudentId(user?.studentId ?? '');
    setFaculty(user?.faculty ?? '');
    setMajor(user?.major ?? '');
    setUniversityNameTh(user?.universityNameTh ?? user?.universityOwner?.universityNameTh ?? '');
    setUniversityNameEn(user?.universityNameEn ?? user?.universityOwner?.universityNameEn ?? '');
    setContactFirstNameTh(user?.contactFirstNameTh ?? '');
    setContactLastNameTh(user?.contactLastNameTh ?? '');
    setContactFirstNameEn(user?.contactFirstNameEn ?? '');
    setContactLastNameEn(user?.contactLastNameEn ?? '');
    setStaffPosition(user?.staffPosition ?? '');
    setStaffDepartment(user?.staffDepartment ?? '');
    setWebsite(user?.website ?? '');
    setAddress(user?.address ?? '');
    setWalletAddress(user?.walletAddress ?? '');
  }, [user]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const name = isUniversityAdmin
      ? user?.name
      : [firstNameTh.trim(), lastNameTh.trim()].filter(Boolean).join(' ') ||
        [firstNameEn.trim(), lastNameEn.trim()].filter(Boolean).join(' ') ||
        user?.name;

    if (!name) {
      setProfileError('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    let payload: ProfilePayload;

    if (isStaff) {
      payload = { phone };
    } else if (isHolder) {
      payload = {
        name,
        firstNameTh,
        lastNameTh,
        firstNameEn,
        lastNameEn,
        phone,
      };
    } else {
      payload = {
        phone,
        website,
        address,
      };
    }

    setIsSavingProfile(true);

    try {
      const response = await api.patch<UpdateProfileResponse>(
        '/auth/me/profile',
        cleanPayload(payload),
      );

      setProfileSuccess(response.data.message ?? 'บันทึกข้อมูลบัญชีสำเร็จ');
      await refreshMe();
    } catch (err) {
      setProfileError(getApiErrorMessage(err));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSaveWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWalletError('');
    setWalletSuccess('');

    if (!walletAddress.trim()) {
      setWalletError('กรุณากรอกบัญชีดิจิทัลสำหรับยืนยันเอกสาร');
      return;
    }

    setIsSavingWallet(true);

    try {
      const response = await api.patch<UpdateWalletResponse>('/auth/me/wallet', {
        walletAddress: walletAddress.trim(),
      });

      setWalletSuccess(response.data.message ?? 'บันทึกบัญชีดิจิทัลสำเร็จ');
      await refreshMe();
    } catch (err) {
      setWalletError(getApiErrorMessage(err));
    } finally {
      setIsSavingWallet(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await api.patch<ChangePasswordResponse>('/auth/me/password', {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(response.data.message ?? 'เปลี่ยนรหัสผ่านสำเร็จ');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(getApiErrorMessage(err));
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-blue-600">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">ชื่อบัญชี</div>
            <div className="mt-2 text-sm font-semibold text-slate-800">{user?.name ?? '-'}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">อีเมล</div>
            <div className="mt-2 break-all text-sm font-semibold text-slate-800">{user?.email ?? '-'}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">ประเภทบัญชี</div>
            <div className="mt-2 text-sm font-semibold text-slate-800">
              {isIssuer ? (isStaff ? 'เจ้าหน้าที่' : 'บัญชีหลักมหาวิทยาลัย') : 'นักศึกษา'}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">
          {isUniversityAdmin ? 'ข้อมูลมหาวิทยาลัย' : isStaff ? 'ข้อมูลเจ้าหน้าที่' : 'ข้อมูลนักศึกษา'}
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          {isStaff
            ? 'ข้อมูลประจำตัวเจ้าหน้าที่ถูกกำหนดโดยบัญชีหลักของมหาวิทยาลัย เจ้าหน้าที่สามารถแก้ไขได้เฉพาะเบอร์โทรศัพท์ของตนเอง'
            : isHolder
              ? 'ข้อมูลการศึกษาแสดงตามที่ลงทะเบียนไว้และไม่สามารถแก้ไขได้จากหน้านี้'
              : 'ข้อมูลหลักของมหาวิทยาลัยและผู้ดูแลบัญชีแสดงตามที่สมัครไว้ แก้ไขได้เฉพาะข้อมูลติดต่อที่จำเป็น'}
        </p>

        {isUniversityAdmin ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ReadonlyField label="ชื่อมหาวิทยาลัย (ภาษาไทย)" value={universityNameTh} />
              <ReadonlyField label="ชื่อมหาวิทยาลัย (ภาษาอังกฤษ)" value={universityNameEn} />
              <ReadonlyField label="ชื่อผู้ดูแลบัญชีหลัก" value={contactFirstNameTh} />
              <ReadonlyField label="นามสกุลผู้ดูแลบัญชีหลัก" value={contactLastNameTh} />
              <ReadonlyField label="ชื่อ (ภาษาอังกฤษ)" value={contactFirstNameEn} />
              <ReadonlyField label="นามสกุล (ภาษาอังกฤษ)" value={contactLastNameEn} />
              <ReadonlyField label="ตำแหน่ง" value={staffPosition} />
              <ReadonlyField label="หน่วยงาน" value={staffDepartment} />
              <Input label="เบอร์โทรศัพท์" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <Input label="เว็บไซต์" type="url" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">ที่อยู่มหาวิทยาลัย / หน่วยงาน</span>
              <textarea className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" value={address} onChange={(event) => setAddress(event.target.value)} />
            </label>
          </>
        ) : isStaff ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ReadonlyField label="ชื่อ (ภาษาไทย)" value={firstNameTh} />
            <ReadonlyField label="นามสกุล (ภาษาไทย)" value={lastNameTh} />
            <ReadonlyField label="ชื่อ (ภาษาอังกฤษ)" value={firstNameEn} />
            <ReadonlyField label="นามสกุล (ภาษาอังกฤษ)" value={lastNameEn} />
            <ReadonlyField label="ตำแหน่ง" value={staffPosition} />
            <ReadonlyField label="หน่วยงาน" value={staffDepartment} />
            <ReadonlyField label="มหาวิทยาลัย" value={universityNameForStaff} />
            <Input label="เบอร์โทรศัพท์" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Input label="ชื่อ (ภาษาไทย)" value={firstNameTh} onChange={(event) => setFirstNameTh(event.target.value)} required />
            <Input label="นามสกุล (ภาษาไทย)" value={lastNameTh} onChange={(event) => setLastNameTh(event.target.value)} required />
            <Input label="ชื่อ (ภาษาอังกฤษ)" value={firstNameEn} onChange={(event) => setFirstNameEn(event.target.value)} />
            <Input label="นามสกุล (ภาษาอังกฤษ)" value={lastNameEn} onChange={(event) => setLastNameEn(event.target.value)} />
            <Input label="เบอร์โทรศัพท์" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <ReadonlyField label="วันเดือนปีเกิด" value={formatBirthDate(birthDate)} />
            <ReadonlyField label="อายุ" value={calculateAge(birthDate)} />
            <ReadonlyField label="รหัสนักศึกษา" value={studentId} />
            <ReadonlyField label="คณะ" value={faculty} />
            <ReadonlyField label="สาขา" value={major} />
            <ReadonlyField label="ชื่อมหาวิทยาลัย (ภาษาไทย)" value={universityNameTh} />
            <ReadonlyField label="ชื่อมหาวิทยาลัย (ภาษาอังกฤษ)" value={universityNameEn} />
          </div>
        )}

        {profileError ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{profileError}</div> : null}
        {profileSuccess ? <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{profileSuccess}</div> : null}
        <Button type="submit" className="mt-5" isLoading={isSavingProfile}>บันทึกข้อมูลบัญชี</Button>
      </form>

      {!isStaff ? (
        <form onSubmit={handleSaveWallet} className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">บัญชีดิจิทัลสำหรับยืนยันเอกสาร</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">ใช้สำหรับผูกกับเอกสารและช่วยยืนยันว่าเอกสารเป็นของบัญชีนี้จริง ผู้ใช้งานกรอกเฉพาะที่อยู่บัญชีเท่านั้น ไม่ต้องกรอกข้อมูลลับใด ๆ</p>
          <div className="mt-6 max-w-2xl">
            <Input label="ที่อยู่บัญชีดิจิทัล" placeholder="0x..." value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} />
          </div>
          {walletError ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{walletError}</div> : null}
          {walletSuccess ? <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{walletSuccess}</div> : null}
          <Button type="submit" className="mt-5" isLoading={isSavingWallet}>บันทึกบัญชีดิจิทัล</Button>
        </form>
      ) : null}

      <form onSubmit={handleChangePassword} className="rounded-2xl bg-white p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h3>
        <p className="mt-2 text-sm text-slate-500">เพื่อความปลอดภัย กรุณาใช้รหัสผ่านใหม่ที่เดาได้ยากและมีอย่างน้อย 8 ตัวอักษร</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Input label="รหัสผ่านปัจจุบัน" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          <Input label="รหัสผ่านใหม่" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          <Input label="ยืนยันรหัสผ่านใหม่" type="password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
        </div>
        {passwordError ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{passwordError}</div> : null}
        {passwordSuccess ? <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{passwordSuccess}</div> : null}
        <Button type="submit" className="mt-5" isLoading={isChangingPassword}>เปลี่ยนรหัสผ่าน</Button>
      </form>
    </div>
  );
}
