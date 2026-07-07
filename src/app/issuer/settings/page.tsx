import { AccountSettingsForm } from '@/components/AccountSettingsForm';

export default function IssuerSettingsPage() {
  return (
    <AccountSettingsForm
      role="ISSUER"
      title="⚙️ ตั้งค่าบัญชีมหาวิทยาลัย"
      description="จัดการข้อมูลบัญชี ข้อมูลมหาวิทยาลัย ข้อมูลเจ้าหน้าที่ และเปลี่ยนรหัสผ่าน"
    />
  );
}
