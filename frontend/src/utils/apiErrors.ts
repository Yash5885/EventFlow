import { isAxiosError } from 'axios';

interface ApiErrorBody {
  message?: string;
  errorCode?: string;
  errors?: Record<string, string>;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.message) {
      return body.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
