export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get('page') || 1), 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 20), 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

