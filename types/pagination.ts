/**
 * Pagination response types for API responses
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Helper function to create a paginated response from an array
 * Useful for backward compatibility with non-paginated endpoints
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number = 1,
  limit: number = 10
): PaginatedResponse<T> {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

/**
 * Helper function to extract data from paginated or array response
 */
export function extractDataFromResponse<T>(
  response: T[] | PaginatedResponse<T>
): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  return response.data;
}

/**
 * Helper function to extract pagination metadata from response
 */
export function extractMetaFromResponse<T>(
  response: T[] | PaginatedResponse<T>,
  defaultPage: number = 1,
  defaultLimit: number = 10
): PaginationMeta {
  if (Array.isArray(response)) {
    const total = response.length;
    const totalPages = Math.ceil(total / defaultLimit);
    return {
      page: defaultPage,
      limit: defaultLimit,
      total,
      totalPages,
      hasNext: defaultPage < totalPages,
      hasPrevious: defaultPage > 1,
    };
  }
  return response.meta;
}
