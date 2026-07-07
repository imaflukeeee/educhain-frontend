'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { getAmoyAddressUrl, middleEllipsis } from '@/lib/credentials';
import type { BlockchainStatusResponse } from '@/types/api';

export default function IssuerSignaturePage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<BlockchainStatusResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadBlockchainStatus() {
    setError('');
    setIsLoading(true);

    try {
      const response = await api.get<BlockchainStatusResponse>('/blockchain/status');
      setStatus(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBlockchainStatus();
  }, []);

  const systemAccountUrl = getAmoyAddressUrl(status?.walletAddress);
  const registryUrl = getAmoyAddressUrl(status?.contractAddress);
  const issuerAccountUrl = getAmoyAddressUrl(user?.walletAddress);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">
              ✒️ สถานะการยืนยันเอกสาร
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              หน้านี้ใช้ตรวจสอบว่าระบบพร้อมยืนยันเอกสารหรือไม่ โดยแสดงเฉพาะข้อมูลอ้างอิงที่จำเป็น ผู้ใช้งานไม่ต้องกรอกหรือเห็นข้อมูลลับของระบบ
            </p>
          </div>

          <Button type="button" variant="secondary" onClick={loadBlockchainStatus} isLoading={isLoading}>
            รีเฟรชสถานะ
          </Button>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              บัญชีดิจิทัลของมหาวิทยาลัย
            </div>
            {issuerAccountUrl ? (
              <a href={issuerAccountUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm font-semibold text-blue-600 hover:underline">
                {middleEllipsis(user?.walletAddress, 12, 10)}
              </a>
            ) : (
              <div className="mt-2 text-sm text-slate-500">ยังไม่ได้ตั้งค่าบัญชีดิจิทัล</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ระบบทดสอบ
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800">
              {status ? 'พร้อมเชื่อมต่อ' : isLoading ? 'กำลังโหลด...' : '-'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ทะเบียนยืนยันเอกสาร
            </div>
            <div className={['mt-2 text-sm font-semibold', status?.isContractDeployed ? 'text-green-700' : 'text-red-700'].join(' ')}>
              {status ? (status.isContractDeployed ? 'พร้อมใช้งาน' : 'ยังไม่พร้อม') : '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-xl font-bold text-blue-600">บัญชีระบบสำหรับยืนยันเอกสาร</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            บัญชีนี้เป็นบัญชีของระบบ ใช้สำหรับยืนยันเอกสารโดยอัตโนมัติ ผู้ใช้งานไม่ต้องกรอกข้อมูลลับบนหน้าเว็บ
          </p>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-400">เลขอ้างอิงบัญชี</div>
            {systemAccountUrl ? (
              <a href={systemAccountUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm font-semibold text-blue-600 hover:underline">
                {middleEllipsis(status?.walletAddress, 14, 12)}
              </a>
            ) : (
              <div className="mt-2 text-sm text-slate-500">-</div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-400">ยอดคงเหลือสำหรับค่าธรรมเนียม</div>
            <div className="mt-2 text-sm font-semibold text-slate-800">
              {status ? `${status.walletBalance} POL` : '-'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-xl font-bold text-blue-600">ทะเบียนยืนยันเอกสาร</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            ระบบใช้ข้อมูลชุดนี้เพื่อตรวจสอบว่าเอกสารถูกยืนยันไว้จริง และไม่มีการแก้ไขย้อนหลัง
          </p>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-400">เลขอ้างอิงทะเบียน</div>
            {registryUrl ? (
              <a href={registryUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm font-semibold text-blue-600 hover:underline">
                {middleEllipsis(status?.contractAddress, 14, 12)}
              </a>
            ) : (
              <div className="mt-2 text-sm text-slate-500">-</div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-yellow-100 bg-yellow-50 p-4 text-sm leading-7 text-yellow-800">
            เพื่อความปลอดภัย ข้อมูลลับของระบบจะถูกเก็บไว้เฉพาะในพื้นที่ตั้งค่าที่ปลอดภัย และจะไม่ถูกนำมาแสดงหรือให้กรอกบนหน้าเว็บ
          </div>
        </div>
      </div>
    </div>
  );
}
