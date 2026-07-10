const TOTP_PERIOD_SECONDS = 30;
const STEAM_GUARD_CHARS = '23456789BCDFGHJKMNPQRTVWXY';

export function secondsUntilNextTotpWindow(nowMs = Date.now()): number {
  const nowSeconds = Math.floor(nowMs / 1000);
  const elapsed = nowSeconds % TOTP_PERIOD_SECONDS;
  const remaining = TOTP_PERIOD_SECONDS - elapsed;
  return remaining > 0 ? remaining : TOTP_PERIOD_SECONDS;
}

function decodeSharedSecret(sharedSecret: string): Uint8Array {
  if (/^[0-9a-f]{40}$/i.test(sharedSecret)) {
    const bytes = new Uint8Array(sharedSecret.length / 2);
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Number.parseInt(sharedSecret.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes;
  }

  const normalized = sharedSecret.replace(/[^A-Za-z0-9+/=]/g, '');
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function generateSteamGuardCode(
  sharedSecret: string,
  timeSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const keyBytes = decodeSharedSecret(sharedSecret);
  const keyMaterial = Uint8Array.from(keyBytes);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, 0, false);
  view.setUint32(4, Math.floor(timeSeconds / TOTP_PERIOD_SECONDS), false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const hash = new Uint8Array(
    await crypto.subtle.sign('HMAC', cryptoKey, buffer),
  );

  const start = hash[19]! & 0x0f;
  let fullcode =
    ((hash[start]! & 0x7f) << 24) |
    (hash[start + 1]! << 16) |
    (hash[start + 2]! << 8) |
    hash[start + 3]!;

  let code = '';
  for (let index = 0; index < 5; index += 1) {
    code += STEAM_GUARD_CHARS.charAt(fullcode % STEAM_GUARD_CHARS.length);
    fullcode /= STEAM_GUARD_CHARS.length;
  }

  return code;
}
