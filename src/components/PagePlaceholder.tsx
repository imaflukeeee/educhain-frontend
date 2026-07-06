interface PagePlaceholderProps {
  title: string;
  description: string;
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-blue-600">{title}</h2>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        {description}
      </p>

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-700">
        ฟังก์ชันนี้อยู่ในพื้นที่จัดการของระบบ EduChain และจะใช้สำหรับดำเนินงานตามสิทธิ์ของผู้ใช้งาน
      </div>
    </div>
  );
}