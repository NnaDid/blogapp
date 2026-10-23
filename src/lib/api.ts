export type User = {
  id: number | string;
  username: string;
  email: string;
  created_at: string;
};

export type Post = {
  id: number | string;
  user_id: number | string;
  username: string;
  content: string | null;
  is_reshare: boolean | number | string;
  original_post_id: number | string | null;
  created_at: string;
  original_content: string | null;
  original_created_at: string | null;
  original_user_id: number | string | null;
  original_username: string | null;
  likes_count: number | string;
  comments_count: number | string;
  liked_by_me: boolean | number | string;
};

export type Comment = {
  id: number | string;
  post_id: number | string;
  user_id: number | string;
  username: string;
  content: string;
  created_at: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const apiBaseUrl = (configuredUrl || 'http://localhost/blog/backend/public').replace(/\/+$/, '');

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      `Could not reach the blog server at ${apiBaseUrl}. Check EXPO_PUBLIC_API_URL and your network connection.`,
      0
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'object' &&
      payload.error !== null &&
      'message' in payload.error &&
      typeof payload.error.message === 'string'
        ? payload.error.message
        : `The request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export function isEnabled(value: boolean | number | string | null | undefined): boolean {
  return value === true || value === 1 || value === '1';
}

export function formatDate(value: string): string {
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
