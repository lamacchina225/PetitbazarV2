import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get('transaction_id') || '';
  const status = url.searchParams.get('status') || '';
  return NextResponse.redirect(new URL(`/checkout?tx=${transactionId}&status=${status}`, request.url));
}
