import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return new Response(
    JSON.stringify({
      message: 'Test endpoint working',
      timestamp: new Date().toISOString(),
      url: req.url,
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  );
}
