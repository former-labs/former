import { PATH_YERVE_ELECTRON_APP } from '@/lib/paths';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Forward the request to the main auth callback route
  console.log("ELECTRONCALLBACK ROUTE", JSON.stringify(request, null, 2));
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Check if this is an electron authentication request
  return NextResponse.redirect(`${PATH_YERVE_ELECTRON_APP}?code=${code}&next=${next}`)
}
