// Callpro SMS API — https://callpro.mn
// Required env vars:
//   CALLPRO_API_URL    — API endpoint (e.g. https://api.callpro.mn/sms/send)
//   CALLPRO_USER       — Callpro username
//   CALLPRO_PASSWORD   — Callpro password
//   CALLPRO_SENDER     — Sender ID shown on recipient's phone (e.g. "GEGEEN")

export async function sendSms(
  phone: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.CALLPRO_API_URL;
  if (!url) return { ok: false, error: 'CALLPRO_API_URL тохируулаагүй' };

  // Normalize to +976XXXXXXXX if bare 8-digit number given
  const normalized = phone.startsWith('+') ? phone : `+976${phone.replace(/\D/g, '')}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.CALLPRO_USER,
        password: process.env.CALLPRO_PASSWORD,
        sender:   process.env.CALLPRO_SENDER ?? 'GEGEEN',
        to:       normalized,
        message,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
