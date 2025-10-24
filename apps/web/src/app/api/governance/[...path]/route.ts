import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const cdnUrl = `${process.env.NEXT_PUBLIC_CDN_BASE}/governance/${path}`;
  
  return NextResponse.redirect(cdnUrl, 302);
}
