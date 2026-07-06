# EduChain Frontend

Frontend สำหรับระบบ EduChain ระบบออกและตรวจสอบเอกสารวุฒิการศึกษาดิจิทัลด้วย Blockchain

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Axios
- Noto Sans Thai

## Features

- Landing Page
- Login และ Register
- แยกบทบาทผู้ใช้งาน Issuer และ Holder
- Role Guard ป้องกันการเข้าถึงผิดสิทธิ์
- Issuer Dashboard
- Holder Dashboard
- Public Verify Page
- เชื่อมต่อ Backend API ผ่าน Axios
- จัดเก็บ Access Token ด้วย LocalStorage

## Main Routes

```text
/
หน้าแรกของระบบ

/verify
หน้าตรวจสอบเอกสารแบบ Public

/login/issuer
เข้าสู่ระบบสำหรับมหาวิทยาลัย

/register/issuer
ลงทะเบียนสำหรับมหาวิทยาลัย

/issuer/dashboard
Dashboard สำหรับมหาวิทยาลัย

/issuer/credentials
รายการเอกสารที่มหาวิทยาลัยออก

/issuer/signature
ข้อมูลลายเซ็นดิจิทัลและ Wallet

/issuer/settings
ตั้งค่าบัญชีมหาวิทยาลัย

/login/holder
เข้าสู่ระบบสำหรับนักศึกษา

/register/holder
ลงทะเบียนสำหรับนักศึกษา

/holder/dashboard
Dashboard สำหรับนักศึกษา

/holder/share
จัดการการแชร์เอกสาร

/holder/history
ประวัติการใช้งาน

/holder/settings
ตั้งค่าบัญชีผู้ใช้งาน