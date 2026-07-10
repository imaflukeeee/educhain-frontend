"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import type { NamePrefix, UserRole } from "@/types/api";

function getRoleFromParam(roleParam: string | string[] | undefined): UserRole {
  const value = Array.isArray(roleParam) ? roleParam[0] : roleParam;
  return value === "holder" ? "HOLDER" : "ISSUER";
}

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const { register } = useAuth();
  const role = getRoleFromParam(params.role);
  const isIssuer = role === "ISSUER";

  const title = isIssuer ? "ลงทะเบียนมหาวิทยาลัย" : "ลงทะเบียนบัญชีนักศึกษา";
  const subtitle = isIssuer
    ? "สำหรับมหาวิทยาลัยหรือหน่วยงานที่ต้องการออกเอกสารรับรองให้นักศึกษา"
    : "สำหรับนักศึกษาที่ต้องการรับและแชร์เอกสารรับรองของตนเอง";

  const [namePrefix, setNamePrefix] = useState<NamePrefix | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [firstNameTh, setFirstNameTh] = useState("");
  const [lastNameTh, setLastNameTh] = useState("");
  const [firstNameEn, setFirstNameEn] = useState("");
  const [lastNameEn, setLastNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [studentId, setStudentId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [major, setMajor] = useState("");
  const [universityNameTh, setUniversityNameTh] = useState("");
  const [universityNameEn, setUniversityNameEn] = useState("");
  const [contactFirstNameTh, setContactFirstNameTh] = useState("");
  const [contactLastNameTh, setContactLastNameTh] = useState("");
  const [contactFirstNameEn, setContactFirstNameEn] = useState("");
  const [contactLastNameEn, setContactLastNameEn] = useState("");
  const [staffPosition, setStaffPosition] = useState("");
  const [staffDepartment, setStaffDepartment] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const name = useMemo(() => {
    if (isIssuer) {
      return universityNameTh.trim() || universityNameEn.trim();
    }

    return [firstNameTh.trim(), lastNameTh.trim()].filter(Boolean).join(" ");
  }, [firstNameTh, isIssuer, lastNameTh, universityNameEn, universityNameTh]);

  const calculatedAge = useMemo(() => {
    if (!birthDate) {
      return "";
    }

    const today = new Date();
    const dateOfBirth = new Date(`${birthDate}T00:00:00`);

    if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth > today) {
      return "";
    }

    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age -= 1;
    }

    return String(age);
  }, [birthDate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError(
        "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข อย่างน้อย 8 ตัวอักษร"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!name) {
      setError(
        isIssuer ? "กรุณากรอกชื่อมหาวิทยาลัย" : "กรุณากรอกชื่อและนามสกุล"
      );
      return;
    }

    const requiredCommon = [
      namePrefix,
      email,
      phone,
      universityNameTh,
      universityNameEn,
    ];
    const requiredByRole = isIssuer
      ? [
          contactFirstNameTh,
          contactLastNameTh,
          staffPosition,
          staffDepartment,
          address,
        ]
      : [firstNameTh, lastNameTh, birthDate, studentId, faculty, major];

    if ([...requiredCommon, ...requiredByRole].some((value) => !value.trim())) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    const selectedNamePrefix = namePrefix;

    if (!selectedNamePrefix) {
      setError("กรุณาเลือกคำนำหน้าชื่อ");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register(
        isIssuer
          ? {
              role,
              name,
              namePrefix: selectedNamePrefix,
              email,
              password,
              phone,
              universityNameTh,
              universityNameEn,
              contactFirstNameTh,
              contactLastNameTh,
              contactFirstNameEn,
              contactLastNameEn,
              staffPosition,
              staffDepartment,
              website,
              address,
            }
          : {
              role,
              name,
              namePrefix: selectedNamePrefix,
              email,
              password,
              firstNameTh,
              lastNameTh,
              firstNameEn,
              lastNameEn,
              phone,
              birthDate,
              studentId,
              faculty,
              major,
              universityNameTh,
              universityNameEn,
            }
      );

      setRegisteredEmail(response.email);
      setShowSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            ← กลับหน้าแรก
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-blue-600">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-8 shadow-sm"
        >
          {isIssuer ? (
            <>
              <section>
                <h2 className="text-lg font-bold text-slate-800">
                  ข้อมูลมหาวิทยาลัย
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Input
                    label="ชื่อมหาวิทยาลัย (ภาษาไทย)"
                    placeholder="เช่น มหาวิทยาลัยหอการค้าไทย"
                    value={universityNameTh}
                    onChange={(event) =>
                      setUniversityNameTh(event.target.value)
                    }
                    required
                  />
                  <Input
                    label="ชื่อมหาวิทยาลัย (ภาษาอังกฤษ)"
                    placeholder="เช่น University of the Thai Chamber of Commerce"
                    value={universityNameEn}
                    onChange={(event) =>
                      setUniversityNameEn(event.target.value)
                    }
                  />
                  <Input
                    label="เบอร์โทรศัพท์มหาวิทยาลัย"
                    type="tel"
                    placeholder="เช่น 026976000"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                  <Input
                    label="เว็บไซต์"
                    type="url"
                    placeholder="https://www.utcc.ac.th"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </div>
                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    ที่อยู่มหาวิทยาลัย
                  </span>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="กรอกที่อยู่สำหรับติดต่อ"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                  />
                </label>
              </section>

              <section>
                <h2 className="text-lg font-bold text-slate-800">
                  ข้อมูลผู้ดูแลบัญชีหลัก
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  บัญชีนี้จะใช้เพิ่มและจัดการบัญชีเจ้าหน้าที่ทะเบียนของมหาวิทยาลัย
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      คำนำหน้าชื่อ
                    </span>
                    <select
                      value={namePrefix}
                      onChange={(event) =>
                        setNamePrefix(event.target.value as NamePrefix | "")
                      }
                      required
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">เลือกคำนำหน้าชื่อ</option>
                      <option value="MR">นาย</option>
                      <option value="MISS">นางสาว</option>
                      <option value="MRS">นาง</option>
                    </select>
                  </label>
                  <Input
                    label="ชื่อ (ภาษาไทย)"
                    placeholder="เช่น สมชาย"
                    value={contactFirstNameTh}
                    onChange={(event) =>
                      setContactFirstNameTh(event.target.value)
                    }
                  />
                  <Input
                    label="นามสกุล (ภาษาไทย)"
                    placeholder="เช่น ใจดี"
                    value={contactLastNameTh}
                    onChange={(event) =>
                      setContactLastNameTh(event.target.value)
                    }
                  />
                  <Input
                    label="ชื่อ (ภาษาอังกฤษ)"
                    placeholder="เช่น Somchai"
                    value={contactFirstNameEn}
                    onChange={(event) =>
                      setContactFirstNameEn(event.target.value)
                    }
                  />
                  <Input
                    label="นามสกุล (ภาษาอังกฤษ)"
                    placeholder="เช่น Jaidee"
                    value={contactLastNameEn}
                    onChange={(event) =>
                      setContactLastNameEn(event.target.value)
                    }
                  />
                  <Input
                    label="ตำแหน่ง"
                    placeholder="เช่น หัวหน้างานทะเบียน"
                    value={staffPosition}
                    onChange={(event) => setStaffPosition(event.target.value)}
                  />
                  <Input
                    label="หน่วยงาน"
                    placeholder="เช่น สำนักทะเบียนและประมวลผล"
                    value={staffDepartment}
                    onChange={(event) => setStaffDepartment(event.target.value)}
                  />
                </div>
              </section>
            </>
          ) : (
            <section>
              <h2 className="text-lg font-bold text-slate-800">
                ข้อมูลนักศึกษา
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    คำนำหน้าชื่อ
                  </span>
                  <select
                    value={namePrefix}
                    onChange={(event) =>
                      setNamePrefix(event.target.value as NamePrefix | "")
                    }
                    required
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">เลือกคำนำหน้าชื่อ</option>
                    <option value="MR">นาย</option>
                    <option value="MISS">นางสาว</option>
                    <option value="MRS">นาง</option>
                  </select>
                </label>
                <Input
                  label="ชื่อ (ภาษาไทย)"
                  placeholder="เช่น ธนกฤต"
                  value={firstNameTh}
                  onChange={(event) => setFirstNameTh(event.target.value)}
                  required
                />
                <Input
                  label="นามสกุล (ภาษาไทย)"
                  placeholder="เช่น ใจดี"
                  value={lastNameTh}
                  onChange={(event) => setLastNameTh(event.target.value)}
                  required
                />
                <Input
                  label="ชื่อ (ภาษาอังกฤษ)"
                  placeholder="เช่น Thanakrit"
                  value={firstNameEn}
                  onChange={(event) => setFirstNameEn(event.target.value)}
                />
                <Input
                  label="นามสกุล (ภาษาอังกฤษ)"
                  placeholder="เช่น Jaidee"
                  value={lastNameEn}
                  onChange={(event) => setLastNameEn(event.target.value)}
                />
                <Input
                  label="รหัสนักศึกษา"
                  placeholder="เช่น 2410717302050"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                />
                <Input
                  label="เบอร์โทรศัพท์"
                  type="tel"
                  placeholder="เช่น 0812345678"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <Input
                  label="วันเดือนปีเกิด"
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                />
                <Input
                  label="อายุ"
                  value={
                    calculatedAge
                      ? `${calculatedAge} ปี`
                      : "ระบบจะคำนวณให้อัตโนมัติ"
                  }
                  disabled
                  readOnly
                  className="cursor-not-allowed bg-slate-100 text-slate-500"
                />
                <Input
                  label="คณะ"
                  placeholder="เช่น วิศวกรรมศาสตร์"
                  value={faculty}
                  onChange={(event) => setFaculty(event.target.value)}
                />
                <Input
                  label="สาขา"
                  placeholder="เช่น วิศวกรรมคอมพิวเตอร์"
                  value={major}
                  onChange={(event) => setMajor(event.target.value)}
                />
                <Input
                  label="ชื่อมหาวิทยาลัย (ภาษาไทย)"
                  placeholder="เช่น มหาวิทยาลัยหอการค้าไทย"
                  value={universityNameTh}
                  onChange={(event) => setUniversityNameTh(event.target.value)}
                />
                <Input
                  label="ชื่อมหาวิทยาลัย (ภาษาอังกฤษ)"
                  placeholder="เช่น University of the Thai Chamber of Commerce"
                  value={universityNameEn}
                  onChange={(event) => setUniversityNameEn(event.target.value)}
                />
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-bold text-slate-800">
              ข้อมูลเข้าสู่ระบบ
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Input
                label="อีเมล"
                type="email"
                placeholder={
                  isIssuer ? "example@educhain.ac.th" : "student@example.com"
                }
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                label="รหัสผ่าน"
                type="password"
                placeholder="พิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข อย่างน้อย 8 ตัว"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Input
                label="ยืนยันรหัสผ่าน"
                type="password"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
          </section>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/login/${isIssuer ? "issuer" : "holder"}`}
              className="text-sm font-semibold text-blue-600"
            >
              มีบัญชีแล้ว? เข้าสู่ระบบ
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              ลงทะเบียน
            </Button>
          </div>
        </form>
      </div>

      {showSuccess ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-800">
              ลงทะเบียนสำเร็จ
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              ระบบส่งลิงก์ยืนยันไปที่{" "}
              <span className="font-semibold text-slate-800">
                {registeredEmail}
              </span>{" "}
              แล้ว กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ
            </p>
            <Button
              type="button"
              fullWidth
              className="mt-6"
              onClick={() =>
                router.push(`/login/${isIssuer ? "issuer" : "holder"}`)
              }
            >
              ไปหน้าเข้าสู่ระบบ
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
