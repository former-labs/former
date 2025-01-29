import { env } from '@/env';
import { PATH_ELECTRON_AUTH_COMPLETE, PATH_ELECTRON_AUTH_ERROR, PATH_FORMER_ELECTRON_APP } from '@/lib/paths';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${PATH_ELECTRON_AUTH_ERROR}?message=No+code+provided`);
  }
  
  // Parse the dashboard URI to get any existing search params
  const completionUrl = new URL(PATH_ELECTRON_AUTH_COMPLETE, env.DASHBOARD_URI);

  // Set our additional params
  completionUrl.searchParams.set('code', code);
  completionUrl.searchParams.set('next', next);
  completionUrl.searchParams.set('target', PATH_FORMER_ELECTRON_APP);

  console.log("COMPLETION URL", completionUrl.toString());
  return NextResponse.redirect(completionUrl.toString());
}
