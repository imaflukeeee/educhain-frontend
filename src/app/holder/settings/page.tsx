import { AccountSettingsForm } from '@/components/AccountSettingsForm';

export default function HolderSettingsPage() {
  return (
    <AccountSettingsForm
      role="HOLDER"
      title="⚙️ ตั้งค่าบัญชีนักศึกษา"
      description="จัดการข้อมูลส่วนตัว ดูข้อมูลการศึกษาที่ลงทะเบียนไว้ และเปลี่ยนรหัสผ่าน"
    />
  );
}
