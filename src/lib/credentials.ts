import type { Credential, CredentialStatus } from '@/types/api';

export type CredentialsResponse =
  | Credential[]
  | {
      credentials?: Credential[];
      data?: Credential[];
      items?: Credential[];
    };

export type CredentialActionResponse =
  | Credential
  | {
      message?: string;
      credential?: Credential;
      data?: Credential;
    };

export function normalizeCredentials(data: CredentialsResponse): Credential[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.credentials ?? data.data ?? data.items ?? [];
}

export function normalizeCredential(data: CredentialActionResponse) {
  if ('id' in data) {
    return data;
  }

  return data.credential ?? data.data ?? null;
}

export function getCredentialDisplayId(credential: Credential) {
  return credential.credentialId ?? credential.id;
}

export function getStatusText(status: CredentialStatus) {
  switch (status) {
    case 'PENDING':
      return 'รอการยืนยัน';
    case 'VERIFIED':
      return 'ยืนยันแล้ว';
    case 'INVALID':
      return 'ถูกยกเลิก';
    default:
      return status;
  }
}

export function getStatusClass(status: CredentialStatus) {
  switch (status) {
    case 'PENDING':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    case 'VERIFIED':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'INVALID':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

export function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getTransactionHash(credential: Credential) {
  return (
    credential.blockchainTxHash ??
    credential.txHash ??
    credential.transactionHash ??
    credential.blockchainTransactionHash ??
    credential.tx_hash ??
    credential.transaction_hash ??
    credential.blockchain_tx_hash ??
    null
  );
}

export function getAmoyTransactionUrl(transactionHash?: string | null) {
  if (!transactionHash) {
    return null;
  }

  return `https://amoy.polygonscan.com/tx/${transactionHash}`;
}

export function getAmoyAddressUrl(address?: string | null) {
  if (!address) {
    return null;
  }

  return `https://amoy.polygonscan.com/address/${address}`;
}

export function middleEllipsis(value?: string | null, head = 10, tail = 8) {
  if (!value) {
    return '-';
  }

  if (value.length <= head + tail + 3) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function tryDecodeUrlEncodedFileName(fileName: string) {
  if (!fileName.includes('%')) {
    return fileName;
  }

  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function tryFixThaiMojibake(fileName: string) {
  const looksBrokenThai = /(?:à¸|à¹|àº|Ã|Â)/.test(fileName);

  if (!looksBrokenThai || typeof TextDecoder === 'undefined') {
    return fileName;
  }

  try {
    const bytes = Uint8Array.from(fileName, (char) => char.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    return /[ก-๙]/.test(decoded) ? decoded : fileName;
  } catch {
    return fileName;
  }
}

export function getDisplayFileName(fileName?: string | null) {
  if (!fileName) {
    return '-';
  }

  return tryFixThaiMojibake(tryDecodeUrlEncodedFileName(fileName));
}
