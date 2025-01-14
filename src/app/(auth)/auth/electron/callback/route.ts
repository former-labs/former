import { env } from '@/env';
import { PATH_YERVE_ELECTRON_APP } from '@/lib/paths';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect('/auth/error?message=No+code+provided');
  }
  
  const completionUrl = new URL('/auth/complete', env.DASHBOARD_URI);
  completionUrl.searchParams.set('code', code);
  completionUrl.searchParams.set('next', next);
  completionUrl.searchParams.set('target', PATH_YERVE_ELECTRON_APP);

  console.log("COMPLETION URL", completionUrl.toString());
  return NextResponse.redirect(completionUrl.toString());
}
