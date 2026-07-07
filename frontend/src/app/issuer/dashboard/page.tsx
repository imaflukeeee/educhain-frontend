'use client';

import { FormEvent, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { api, getApiErrorMessage } from '@/lib/api';
import type { AuthUser, Credential } from '@/types/api';

type StudentLookupResponse = {
  message: string;
  student: AuthUser;
};

type CreateCredentialResponse =
  | Credential
  | {
      message?: string;
      credential?: Credential;
      data?: Credential;
    };

function normalizeCredential(data: CreateCredentialResponse): Credential | null {
  if ('id' in data) {
    return data;
  }

  return data.credential ?? data.data ?? null;
}

export default function IssueCredentialPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [holderEmail, setHolderEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [documentTitle, setDocumentTitle] = useState('ใบรับรองวุฒิการศึกษา');
  const [issuedAt, setIssuedAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [file, setFile] = useState<File | null>(null);
  const [foundStudent, setFoundStudent] = useState<AuthUser | null>(null);
  const [studentLookupMessage, setStudentLookupMessage] = useState('');
  const [isLookingUpStudent, setIsLookingUpStudent] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createdCredential, setCreatedCredential] = useState<Credential | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setHolderEmail('');
    setStudentName('');
    setStudentId('');
    setFaculty('');
    setMajor('');
    setDocumentTitle('ใบรับรองวุฒิการศึกษา');
    setIssuedAt(new Date().toISOString().slice(0, 10));
    setFile(null);
    setFoundStudent(null);
    setStudentLookupMessage('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function clearStudentInfo(nextStudentId = studentId) {
    setFoundStudent(null);
    setStudentLookupMessage('');
    setStudentId(nextStudentId);
    setHolderEmail('');
    setStudentName('');
    setFaculty('');
    setMajor('');
  }

  async function handleLookupStudent() {
    const normalizedStudentId = studentId.trim();

    setError('');
    setSuccessMessage('');
    setStudentLookupMessage('');
    setFoundStudent(null);

    if (!normalizedStudentId) {
      setError('กรุณากรอกรหัสนักศึกษาก่อนค้นหา');
      return;
    }

    setIsLookingUpStudent(true);

    try {
      const response = await api.get<StudentLookupResponse>(
        `/users/student/${encodeURIComponent(normalizedStudentId)}`,
      );
      const student = response.data.student;
      const fullNameTh = [student.firstNameTh, student.lastNameTh]
        .filter(Boolean)
        .join(' ');
      const fullNameEn = [student.firstNameEn, student.lastNameEn]
        .filter(Boolean)
        .join(' ');

      setFoundStudent(student);
      setHolderEmail(student.email ?? '');
      setStudentName(fullNameTh || fullNameEn || student.name || '');
      setStudentId(student.studentId ?? normalizedStudentId);
      setFaculty(student.faculty ?? '');
      setMajor(student.major ?? '');
      setStudentLookupMessage('พบข้อมูลนักศึกษา ระบบดึงข้อมูลมาให้แล้ว');
    } catch (err) {
      setHolderEmail('');
      setStudentName('');
      setFaculty('');
      setMajor('');
      setStudentLookupMessage('');
      setError(getApiErrorMessage(err));
    } finally {
      setIsLookingUpStudent(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccessMessage('');
    setCreatedCredential(null);

    if (!foundStudent) {
      setError('กรุณาค้นหาและเลือกข้อมูลนักศึกษาก่อนออกเอกสาร');
      return;
    }

    if (!file) {
      setError('กรุณาอัปโหลดไฟล์ PDF');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('รองรับเฉพาะไฟล์ PDF เท่านั้น');
      return;
    }

    const formData = new FormData();
    formData.append('holderEmail', holderEmail);
    formData.append('studentName', studentName);
    formData.append('studentId', studentId);
    formData.append('faculty', faculty);
    formData.append('major', major);
    formData.append('documentTitle', documentTitle);
    formData.append('issuedAt', issuedAt);
    formData.append('file', file);

    setIsSubmitting(true);

    try {
      const response = await api.post<CreateCredentialResponse>(
        '/credentials',
        formData,
      );

      const credential = normalizeCredential(response.data);

      setCreatedCredential(credential);
      setSuccessMessage('ออกเอกสารดิจิทัลสำเร็จ ระบบได้บันทึกข้อมูลเอกสารแล้ว');

      resetForm();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-blue-600">
          📄 ออกเอกสารรับรองใบปริญญาใหม่
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          กรอกข้อมูลผู้รับเอกสารและอัปโหลดไฟล์ PDF เพื่อสร้างเอกสารวุฒิการศึกษาดิจิทัลในระบบ EduChain
          โดยอีเมลผู้รับเอกสารต้องเป็นบัญชีนักศึกษาที่ลงทะเบียนไว้ในระบบแล้ว
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  รหัสนักศึกษา
                </span>

                <div className="flex gap-2">
                  <input
                    value={studentId}
                    onChange={(event) => clearStudentInfo(event.target.value)}
                    placeholder="เช่น 2410717302050"
                    required
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleLookupStudent();
                      }
                    }}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={handleLookupStudent}
                    disabled={isLookingUpStudent || !studentId.trim()}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="ค้นหานักศึกษา"
                    aria-label="ค้นหานักศึกษา"
                  >
                    {isLookingUpStudent ? '…' : '🔍'}
                  </button>
                </div>
              </label>

              {studentLookupMessage ? (
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {studentLookupMessage}
                </div>
              ) : null}
            </div>

            <Input
              label="อีเมลผู้รับเอกสาร"
              type="email"
              placeholder="เช่น student@example.com"
              value={holderEmail}
              onChange={(event) => setHolderEmail(event.target.value)}
              required
            />

            <Input
              label="ชื่อ - นามสกุลนักศึกษา"
              placeholder="ระบบจะดึงจากรหัสนักศึกษา"
              value={studentName}
              readOnly
              className="cursor-not-allowed bg-slate-50 text-slate-500"
              required
            />

            <Input
              label="คณะ"
              placeholder="ระบบจะดึงจากรหัสนักศึกษา"
              value={faculty}
              readOnly
              className="cursor-not-allowed bg-slate-50 text-slate-500"
              required
            />

            <Input
              label="สาขาวิชา"
              placeholder="ระบบจะดึงจากรหัสนักศึกษา"
              value={major}
              readOnly
              className="cursor-not-allowed bg-slate-50 text-slate-500"
              required
            />

            <Input
              label="ชื่อเอกสาร"
              placeholder="ใบรับรองวุฒิการศึกษา"
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              required
            />

            <Input
              label="วันที่ออกเอกสาร"
              type="date"
              value={issuedAt}
              onChange={(event) => setIssuedAt(event.target.value)}
              required
            />

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                ไฟล์เอกสาร PDF
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                }}
                required
                className="block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100"
              />

              <span className="mt-1 block text-xs text-slate-400">
                รองรับเฉพาะไฟล์ PDF เท่านั้น
              </span>
            </label>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
              {createdCredential?.id ? (
                <div className="mt-2 text-xs">
                  รหัสเอกสาร: {createdCredential.id}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!foundStudent || isSubmitting}
            >
              ออกเอกสารดิจิทัล
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}