/**
 * Vercel serverless proxy for Google Apps Script.
 * Forwards POST requests to avoid CORS when the app is deployed.
 */
export async function POST(request) {
  const scriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL;
  if (!scriptUrl) {
    return Response.json(
      { error: true, message: 'GOOGLE_SHEETS_SCRIPT_URL is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return Response.json(
      { error: true, message: err.message || 'Proxy request failed' },
      { status: 502 }
    );
  }
}
