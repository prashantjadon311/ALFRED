export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const ok = <T>(data: T, meta: Record<string, unknown> = {}): ApiResponse<T> => ({ data, meta });

export const list = <T>(data: T[], meta: { page: number; limit: number; total: number; hasMore: boolean }): ApiListResponse<T> => ({
  data,
  meta
});
