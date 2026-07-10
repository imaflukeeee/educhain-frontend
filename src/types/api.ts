export type UserRole = 'ISSUER' | 'HOLDER';

export type NamePrefix = 'MR' | 'MISS' | 'MRS';

export type IssuerAccountType = 'UNIVERSITY_ADMIN' | 'REGISTRAR_STAFF';

export type StaffPermission =
  | 'CREATE_CREDENTIAL'
  | 'REGISTER_CREDENTIAL'
  | 'VIEW_ALL_CREDENTIALS'
  | 'INVALIDATE_CREDENTIAL';

export type CredentialStatus = 'PENDING' | 'VERIFIED' | 'INVALID';

export type ShareLinkStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface UniversityOwnerSummary {
  id: string;
  email: string;
  name: string;
  universityNameTh?: string | null;
  universityNameEn?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  walletAddress: string | null;
  namePrefix?: NamePrefix | null;
  firstNameTh?: string | null;
  lastNameTh?: string | null;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  studentId?: string | null;
  faculty?: string | null;
  major?: string | null;
  universityNameTh?: string | null;
  universityNameEn?: string | null;
  contactFirstNameTh?: string | null;
  contactLastNameTh?: string | null;
  contactFirstNameEn?: string | null;
  contactLastNameEn?: string | null;
  staffPosition?: string | null;
  staffDepartment?: string | null;
  website?: string | null;
  address?: string | null;
  issuerAccountType?: IssuerAccountType | null;
  universityOwnerId?: string | null;
  universityOwner?: UniversityOwnerSummary | null;
  permissions?: string[];
  isActive?: boolean;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfilePayload {
  namePrefix?: NamePrefix;
  name?: string;
  firstNameTh?: string;
  lastNameTh?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  phone?: string;
  birthDate?: string;
  studentId?: string;
  faculty?: string;
  major?: string;
  universityNameTh?: string;
  universityNameEn?: string;
  contactFirstNameTh?: string;
  contactLastNameTh?: string;
  contactFirstNameEn?: string;
  contactLastNameEn?: string;
  staffPosition?: string;
  staffDepartment?: string;
  website?: string;
  address?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: AuthUser;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  accessToken: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  requiresEmailVerification: boolean;
  verificationUrl?: string;
}

export interface UpdateWalletResponse {
  message: string;
  user: AuthUser;
}

export interface StaffMember extends AuthUser {
  issuerAccountType: 'REGISTRAR_STAFF';
  universityOwnerId: string;
}

export interface StaffListResponse {
  message: string;
  staffMembers: StaffMember[];
}

export interface CreateStaffResponse {
  message: string;
  staff: StaffMember;
}

export interface UpdateStaffResponse {
  message: string;
  staff: StaffMember;
}

export interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export interface Credential {
  id: string;
  credentialId?: string;

  holderEmail?: string;
  studentName: string;
  studentId: string;
  faculty?: string | null;
  major?: string | null;
  documentTitle: string;
  issuedAt: string;

  status: CredentialStatus;

  fileName?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  storagePath?: string | null;
  fileHash?: string | null;
  documentHash?: string | null;

  network?: string | null;
  blockNumber?: number | null;

  txHash?: string | null;
  blockchainTxHash?: string | null;
  transactionHash?: string | null;
  blockchainTransactionHash?: string | null;
  tx_hash?: string | null;
  transaction_hash?: string | null;
  blockchain_tx_hash?: string | null;

  contractAddress?: string | null;

  issuerId?: string;
  holderId?: string | null;
  issuerStaffId?: string | null;

  issuedByName?: string | null;
  issuedByEmail?: string | null;
  issuedByPosition?: string | null;
  issuedByDepartment?: string | null;

  issuer?: AuthUser;
  holder?: AuthUser | null;
  issuerStaff?: Partial<AuthUser> | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface DownloadUrlResponse {
  message: string;
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface ShareLink {
  token: string;
  verifyUrl: string;
  status?: ShareLinkStatus;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateShareLinkResponse {
  message: string;
  shareLink: ShareLink;
}

export interface ListShareLinksResponse {
  message: string;
  credential: Pick<Credential, 'id' | 'credentialId' | 'documentTitle' | 'studentName' | 'status'>;
  total: number;
  shareLinks: ShareLink[];
}

export interface RevokeShareLinkResponse {
  message: string;
  shareLink: Pick<ShareLink, 'token' | 'revokedAt' | 'expiresAt'>;
  credential: Pick<Credential, 'credentialId' | 'documentTitle' | 'studentName' | 'status'>;
}

export interface BlockchainStatusResponse {
  message: string;
  network: string;
  chainId: number;
  walletAddress: string;
  walletBalance: string;
  contractAddress: string;
  isContractDeployed: boolean;
}

export interface VerificationChecks {
  uploadedFileMatched?: boolean;
  documentHashMatched?: boolean;
  holderAddressMatched?: boolean;
  databaseStatusVerified?: boolean;
  hasTransaction?: boolean;
}

export interface IssuedBySummary {
  name?: string | null;
  email?: string | null;
  position?: string | null;
  department?: string | null;
}

export interface PublicVerificationResult {
  message: string;
  isValid: boolean;
  verifiedAt: string;
  checks?: VerificationChecks;
  credential?: {
    credentialId: string;
    documentTitle: string;
    studentName: string;
    studentId: string;
    faculty?: string | null;
    major?: string | null;
    issuedAt: string;
    status: CredentialStatus;
    issuedByName?: string | null;
    issuedByPosition?: string | null;
    issuedByDepartment?: string | null;
  };
  issuer?: {
    name: string;
    walletAddress?: string | null;
  };
  issuedBy?: IssuedBySummary;
  holder?: {
    name: string;
    walletAddress?: string | null;
  };
  uploadedFile?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    sha256Hash: string;
  };
  shareLink?: {
    expiresAt: string;
  };
  blockchain?: {
    network?: string | null;
    transactionHash?: string | null;
    blockNumber?: number | null;
    credentialId?: string;
    documentHash?: string;
    issuerAddress?: string;
    holderAddress?: string;
    timestamp?: number;
  };
}

export interface VerifyChainResponse {
  message: string;
  isValid: boolean;
  checks: VerificationChecks;
  database?: {
    id: string;
    credentialId: string;
    documentHash: string;
    status: CredentialStatus;
    transactionHash?: string | null;
    blockNumber?: number | null;
    network?: string | null;
    holderWalletAddress?: string | null;
    issuedByName?: string | null;
    issuedByPosition?: string | null;
    issuedByDepartment?: string | null;
  };
  blockchain?: {
    credentialId: string;
    documentHash: string;
    issuerAddress: string;
    holderAddress: string;
    issuerSignature?: string;
    timestamp: number;
  };
}
