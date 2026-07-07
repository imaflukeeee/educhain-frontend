import type { ApiErrorResponse } from '@/types/api';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export class ApiClientError extends Error {
  response?: {
    status: number;
    data?: ApiErrorResponse;
  };

  constructor(message: string, status?: number, data?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiClientError';

    if (status) {
      this.response = { status, data };
    }
  }
}

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('educhain_access_token');
}

function clearStoredSession() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('educhain_access_token');
  localStorage.removeItem('educhain_user');
}

function resolveUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;

  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(resolveUrl(path), {
    ...options,
    headers,
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredSession();
    }

    const data =
      typeof body === 'object' && body !== null
        ? (body as ApiErrorResponse)
        : { message: String(body ?? 'เกิดข้อผิดพลาดจาก API') };

    throw new ApiClientError(
      getMessageFromApiError(data),
      response.status,
      data,
    );
  }

  return {
    data: body as T,
    status: response.status,
  };
}

function toBody(data?: unknown) {
  if (data === undefined || data === null) {
    return undefined;
  }

  if (data instanceof FormData) {
    return data;
  }

  return JSON.stringify(data);
}

function getMessageFromApiError(data?: ApiErrorResponse) {
  const message = data?.message;

  if (Array.isArray(message)) {
    return message.join('\n');
  }

  if (typeof message === 'string') {
    return message;
  }

  return data?.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

export const api = {
  get<T>(path: string, options?: RequestInit) {
    return request<T>(path, {
      ...options,
      method: 'GET',
    });
  },

  post<T>(path: string, data?: unknown, options?: RequestInit) {
    return request<T>(path, {
      ...options,
      method: 'POST',
      body: toBody(data),
    });
  },

  patch<T>(path: string, data?: unknown, options?: RequestInit) {
    return request<T>(path, {
      ...options,
      method: 'PATCH',
      body: toBody(data),
    });
  },

  delete<T>(path: string, options?: RequestInit) {
    return request<T>(path, {
      ...options,
      method: 'DELETE',
    });
  },
};

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return getMessageFromApiError(error.response?.data);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}
