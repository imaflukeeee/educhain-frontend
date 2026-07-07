import Link from 'next/link';

export function TopNav() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/educhain-logo.png"
            alt="EduChain"
            className="h-10 w-10 object-contain"
          />

          <span className="text-xl font-bold text-slate-900">EduChain</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-500 md:flex">
          <Link href="/" className="hover:text-blue-600">
            หน้าแรก
          </Link>

          <Link href="/verify" className="hover:text-blue-600">
            ตรวจสอบเอกสาร
          </Link>

          <Link href="/login/issuer" className="hover:text-blue-600">
            มหาวิทยาลัย
          </Link>

          <Link href="/login/holder" className="hover:text-blue-600">
            นักศึกษา
          </Link>
        </nav>
      </div>
    </header>
  );
}