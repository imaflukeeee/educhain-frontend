"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { THAI_PROVINCES } from "@/lib/thai-address";
import type { FacultyOption, NamePrefix, RegisteredUniversity, UniversityMaster, UserRole } from "@/types/api";

function getRole(v: string|string[]|undefined): UserRole { const x=Array.isArray(v)?v[0]:v; return x==='holder'?'HOLDER':'ISSUER'; }
export default function RegisterPage(){
 const params=useParams(); const router=useRouter(); const {register}=useAuth(); const role=getRole(params.role); const isIssuer=role==='ISSUER';
 const [masters,setMasters]=useState<UniversityMaster[]>([]); const [registered,setRegistered]=useState<RegisteredUniversity[]>([]); const [faculties,setFaculties]=useState<FacultyOption[]>([]);
 const [universityMasterId,setUniversityMasterId]=useState(''); const [universityId,setUniversityId]=useState(''); const [facultyId,setFacultyId]=useState(''); const [majorId,setMajorId]=useState('');
 const [namePrefix,setNamePrefix]=useState<NamePrefix|''>(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [confirmPassword,setConfirmPassword]=useState('');
 const [firstNameTh,setFirstNameTh]=useState(''); const [lastNameTh,setLastNameTh]=useState(''); const [firstNameEn,setFirstNameEn]=useState(''); const [lastNameEn,setLastNameEn]=useState(''); const [phone,setPhone]=useState(''); const [birthDate,setBirthDate]=useState(''); const [studentId,setStudentId]=useState(''); const [nationalId,setNationalId]=useState('');
 const [contactFirstNameTh,setContactFirstNameTh]=useState(''); const [contactLastNameTh,setContactLastNameTh]=useState(''); const [contactFirstNameEn,setContactFirstNameEn]=useState(''); const [contactLastNameEn,setContactLastNameEn]=useState(''); const [staffPosition,setStaffPosition]=useState(''); const [staffDepartment,setStaffDepartment]=useState(''); const [website,setWebsite]=useState('');
 const [addressDetail,setAddressDetail]=useState(''); const [province,setProvince]=useState(''); const [district,setDistrict]=useState(''); const [subDistrict,setSubDistrict]=useState(''); const [postalCode,setPostalCode]=useState('');
 const [error,setError]=useState(''); const [loading,setLoading]=useState(false); const [success,setSuccess]=useState(false); const [registeredEmail,setRegisteredEmail]=useState('');
 useEffect(() => {
  let cancelled = false;

  async function loadUniversities() {
    if (isIssuer) {
      const response = await api.get<UniversityMaster[]>('/universities/master');
      if (!cancelled) {
        setMasters(response.data);
      }
      return;
    }

    const response = await api.get<RegisteredUniversity[]>('/universities/registered');
    if (!cancelled) {
      setRegistered(response.data);
    }
  }

  void loadUniversities().catch(() => {
    if (!cancelled) {
      setError('ไม่สามารถโหลดรายชื่อมหาวิทยาลัยได้');
    }
  });

  return () => {
    cancelled = true;
  };
 }, [isIssuer]);
 useEffect(()=>{ if(!universityId){setFaculties([]);return;} void api.get<FacultyOption[]>(`/universities/${universityId}/faculties`).then(r=>setFaculties(r.data)).catch(()=>setFaculties([])); },[universityId]);
 const selectedMaster=masters.find(x=>x.id===universityMasterId); const selectedUniversity=registered.find(x=>x.id===universityId); const selectedFaculty=faculties.find(x=>x.id===facultyId); const selectedMajor=selectedFaculty?.majors.find(x=>x.id===majorId);
 const name=useMemo(()=>isIssuer?(selectedMaster?.nameTh||''):[firstNameTh,lastNameTh].filter(Boolean).join(' '),[isIssuer,selectedMaster,firstNameTh,lastNameTh]);
 async function submit(e:FormEvent){ e.preventDefault(); setError(''); if(!namePrefix)return setError('กรุณาเลือกคำนำหน้าชื่อ'); if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password))return setError('รหัสผ่านต้องมีพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข อย่างน้อย 8 ตัว'); if(password!==confirmPassword)return setError('รหัสผ่านไม่ตรงกัน'); if(isIssuer&&!selectedMaster)return setError('กรุณาเลือกมหาวิทยาลัย'); if(!isIssuer&&(!selectedUniversity||!selectedFaculty||!selectedMajor))return setError('กรุณาเลือกมหาวิทยาลัย คณะ และสาขา'); if(!addressDetail||!province||!district||!subDistrict||!postalCode)return setError('กรุณากรอกที่อยู่ให้ครบ');
 setLoading(true); try{ const r=await register(isIssuer?{role,name,namePrefix,email,password,phone,universityMasterId,universityNameTh:selectedMaster!.nameTh,universityNameEn:selectedMaster!.nameEn,contactFirstNameTh,contactLastNameTh,contactFirstNameEn,contactLastNameEn,staffPosition,staffDepartment,website,addressDetail,province,district,subDistrict,postalCode}:{role,name,namePrefix,email,password,phone,birthDate,studentId,nationalId,firstNameTh,lastNameTh,firstNameEn,lastNameEn,universityId,universityNameTh:selectedUniversity!.master.nameTh,universityNameEn:selectedUniversity!.master.nameEn,faculty:selectedFaculty!.nameTh,major:selectedMajor!.nameTh,addressDetail,province,district,subDistrict,postalCode}); setRegisteredEmail(r.email);setSuccess(true);}catch(x){setError(x instanceof Error?x.message:'ลงทะเบียนไม่สำเร็จ');}finally{setLoading(false)} }
 const Req=()=> <span className="ml-1 text-red-500">*</span>;
 return <main className="min-h-screen bg-[#f5f7fb] px-4 py-10"><div className="mx-auto max-w-5xl"><div className="mb-8 text-center"><Link href="/" className="text-sm font-semibold text-blue-600">← กลับหน้าแรก</Link><h1 className="mt-4 text-3xl font-bold text-blue-600">{isIssuer?'ลงทะเบียนมหาวิทยาลัย':'ลงทะเบียนบัญชีนักศึกษา'}</h1></div><form onSubmit={submit} className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
 <section><h2 className="text-lg font-bold text-slate-800">{isIssuer?'ข้อมูลมหาวิทยาลัย':'ข้อมูลนักศึกษา'}</h2><div className="mt-5 grid gap-4 md:grid-cols-3">
 <label className="block"><span className="mb-1 block text-sm font-medium">คำนำหน้าชื่อ<Req/></span><select className="h-10 w-full rounded-lg border px-3" value={namePrefix} onChange={e=>setNamePrefix(e.target.value as NamePrefix|"")} required><option value="">เลือกคำนำหน้า</option><option value="MR">นาย</option><option value="MISS">นางสาว</option><option value="MRS">นาง</option></select></label>
 {isIssuer?<><Input label="ชื่อ (ภาษาไทย)" value={contactFirstNameTh} onChange={e=>setContactFirstNameTh(e.target.value)} required/><Input label="นามสกุล (ภาษาไทย)" value={contactLastNameTh} onChange={e=>setContactLastNameTh(e.target.value)} required/><label className="block md:col-span-2"><span className="mb-1 block text-sm font-medium">มหาวิทยาลัย<Req/></span><select className="h-10 w-full rounded-lg border px-3" value={universityMasterId} onChange={e=>setUniversityMasterId(e.target.value)} required><option value="">เลือกมหาวิทยาลัย</option>{masters.map(x=><option key={x.id} value={x.id}>{x.nameTh}</option>)}</select></label><Input label="ชื่อมหาวิทยาลัย (ภาษาอังกฤษ)" value={selectedMaster?.nameEn||''} disabled readOnly/><Input label="ชื่อ (ภาษาอังกฤษ)" value={contactFirstNameEn} onChange={e=>setContactFirstNameEn(e.target.value)}/><Input label="นามสกุล (ภาษาอังกฤษ)" value={contactLastNameEn} onChange={e=>setContactLastNameEn(e.target.value)}/><Input label="เบอร์โทรศัพท์" value={phone} onChange={e=>setPhone(e.target.value)} required/><Input label="ตำแหน่ง" placeholder="เช่น หัวหน้างานทะเบียน" value={staffPosition} onChange={e=>setStaffPosition(e.target.value)} required/><Input label="หน่วยงาน" placeholder="เช่น สำนักทะเบียน" value={staffDepartment} onChange={e=>setStaffDepartment(e.target.value)} required/><Input label="เว็บไซต์" type="url" value={website} onChange={e=>setWebsite(e.target.value)}/></>:<><Input label="ชื่อ (ภาษาไทย)" value={firstNameTh} onChange={e=>setFirstNameTh(e.target.value)} required/><Input label="นามสกุล (ภาษาไทย)" value={lastNameTh} onChange={e=>setLastNameTh(e.target.value)} required/><Input label="ชื่อ (ภาษาอังกฤษ)" value={firstNameEn} onChange={e=>setFirstNameEn(e.target.value)}/><Input label="นามสกุล (ภาษาอังกฤษ)" value={lastNameEn} onChange={e=>setLastNameEn(e.target.value)}/><Input label="รหัสนักศึกษา" value={studentId} onChange={e=>setStudentId(e.target.value)} required/><Input label="เลขบัตรประชาชน" value={nationalId} onChange={e=>setNationalId(e.target.value.replace(/\D/g,'').slice(0,13))} required/><Input label="เบอร์โทรศัพท์" value={phone} onChange={e=>setPhone(e.target.value)} required/><Input label="วันเดือนปีเกิด" type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required/><label className="block"><span className="mb-1 block text-sm font-medium">มหาวิทยาลัย<Req/></span><select className="h-10 w-full rounded-lg border px-3" value={universityId} onChange={e=>{setUniversityId(e.target.value);setFacultyId('');setMajorId('')}} required><option value="">เลือกมหาวิทยาลัย</option>{registered.map(x=><option key={x.id} value={x.id}>{x.master.nameTh}</option>)}</select></label><label className="block"><span className="mb-1 block text-sm font-medium">คณะ<Req/></span><select className="h-10 w-full rounded-lg border px-3" value={facultyId} onChange={e=>{setFacultyId(e.target.value);setMajorId('')}} required><option value="">เลือกคณะ</option>{faculties.filter(x=>x.isActive).map(x=><option key={x.id} value={x.id}>{x.nameTh}</option>)}</select></label><label className="block"><span className="mb-1 block text-sm font-medium">สาขาวิชา<Req/></span><select className="h-10 w-full rounded-lg border px-3" value={majorId} onChange={e=>setMajorId(e.target.value)} required><option value="">เลือกสาขา</option>{selectedFaculty?.majors.filter(x=>x.isActive).map(x=><option key={x.id} value={x.id}>{x.nameTh}</option>)}</select></label></>}
 </div></section>
 <section><h2 className="text-lg font-bold text-slate-800">ที่อยู่</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Input label="รายละเอียดที่อยู่" value={addressDetail} onChange={e=>setAddressDetail(e.target.value)} required/><label><span className="mb-1 block text-sm font-medium">จังหวัด<Req/></span><select className="h-10 w-full rounded-lg border px-3" value={province} onChange={e=>setProvince(e.target.value)} required><option value="">เลือกจังหวัด</option>{THAI_PROVINCES.map(x=><option key={x}>{x}</option>)}</select></label><Input label="เขต / อำเภอ" value={district} onChange={e=>setDistrict(e.target.value)} required/><Input label="แขวง / ตำบล" value={subDistrict} onChange={e=>setSubDistrict(e.target.value)} required/><Input label="รหัสไปรษณีย์" value={postalCode} onChange={e=>setPostalCode(e.target.value.replace(/\D/g,'').slice(0,5))} required/></div></section>
 <section><h2 className="text-lg font-bold text-slate-800">ข้อมูลเข้าสู่ระบบ</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><Input label="อีเมล" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/><Input label="รหัสผ่าน" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/><Input label="ยืนยันรหัสผ่าน" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required/></div></section>{error&&<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end"><Button type="submit" isLoading={loading}>ลงทะเบียน</Button></div></form></div>{success&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50"><div className="w-full max-w-md rounded-2xl bg-white p-7 text-center"><h2 className="text-xl font-bold">ลงทะเบียนสำเร็จ</h2><p className="mt-3 text-sm">ส่งลิงก์ยืนยันไปที่ {registeredEmail}</p><Button fullWidth className="mt-6" onClick={()=>router.push(`/login/${isIssuer?'issuer':'holder'}`)}>ไปหน้าเข้าสู่ระบบ</Button></div></div>}</main>
}
