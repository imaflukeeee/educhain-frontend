import Link from 'next/link';
import { TopNav } from '@/components/TopNav';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <TopNav />

      <section className="bg-blue-600 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-extrabold md:text-4xl">
          ระบบออกเอกสารและตรวจสอบใบปริญญาดิจิทัล
        </h1>

        <p className="mx-auto mt-3 max-w-3xl text-sm text-blue-100">
          ปลอดภัย ตรวจสอบได้ โปร่งใส ด้วยเทคโนโลยี Blockchain และมาตรฐาน Verifiable Credential
        </p>

        <div className="mt-6">
          <Link
            href="/verify"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            เริ่มตรวจสอบเอกสาร
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-center text-2xl font-bold text-slate-700">
          ฟีเจอร์เด่นของระบบ
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            {
              title: '🔐 ปลอดภัยสูงสุด',
              text: 'คำนวณ SHA-256 Hash จากไฟล์ PDF และใช้ Blockchain ตรวจสอบความถูกต้อง',
            },
            {
              title: '🧾 ตรวจสอบได้จริง',
              text: 'ตรวจสอบเอกสารได้ผ่าน Credential ID, Share Link หรือการอัปโหลด PDF',
            },
            {
              title: '🌍 โปร่งใสและตรวจสอบย้อนหลังได้',
              text: 'บันทึกข้อมูลสำคัญบน Polygon Amoy Testnet เพื่อป้องกันการแก้ไขย้อนหลัง',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 text-center shadow-sm"
            >
              <h3 className="font-bold text-blue-600">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 px-6 py-10">
        <h2 className="text-center text-2xl font-bold text-slate-700">
          เลือกบทบาทของคุณ
        </h2>

        <div className="mx-auto mt-6 grid max-w-5xl gap-5 md:grid-cols-3">
          <RoleCard
            title="🏫 มหาวิทยาลัย"
            description="ออกเอกสารรับรองและบันทึก Hash ลง Blockchain"
            loginHref="/login/issuer"
            registerHref="/register/issuer"
          />

          <RoleCard
            title="👨‍🎓 นักศึกษา / ศิษย์เก่า"
            description="ดูเอกสารของตนเอง ดาวน์โหลด และสร้าง Share Link"
            loginHref="/login/holder"
            registerHref="/register/holder"
          />

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <h3 className="font-bold text-blue-600">🏢 ผู้ตรวจสอบ</h3>

            <p className="mt-3 text-sm text-slate-500">
              ตรวจสอบเอกสารผ่าน Credential ID หรือ Share Link
            </p>

            <Link
              href="/verify"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ตรวจเอกสาร
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-xs text-slate-500">
        © 2025 EduChain. All Rights Reserved — Powered By Warakon
      </footer>
    </div>
  );
}

function RoleCard({
  title,
  description,
  loginHref,
  registerHref,
}: {
  title: string;
  description: string;
  loginHref: string;
  registerHref: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
      <h3 className="font-bold text-blue-600">{title}</h3>

      <p className="mt-3 text-sm text-slate-500">{description}</p>

      <Link
        href={loginHref}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        เข้าสู่ระบบ
      </Link>

      <div className="mt-3">
        <Link
          href={registerHref}
          className="text-sm font-semibold text-blue-600"
        >
          ลงทะเบียนใช้งาน
        </Link>
      </div>
    </div>
  );
}