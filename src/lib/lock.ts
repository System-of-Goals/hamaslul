// Local app lock: 4-digit PIN (PBKDF2 hash) + optional fingerprint (WebAuthn platform authenticator).
// This protects the app on the phone; the data never leaves the device.
import { storage } from './storage';

type PinRecord = { salt: string; hash: string };
const PIN_KEY = 'lock-pin';
const CRED_KEY = 'lock-credential';

const enc = new TextEncoder();
const b64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function hashPin(pin: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' }, key, 256);
  return b64(bits);
}

export async function hasPin() {
  return !!(await storage.get<PinRecord>(PIN_KEY));
}

export async function setPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  await storage.set<PinRecord>(PIN_KEY, { salt: b64(salt), hash: await hashPin(pin, salt) });
}

export async function checkPin(pin: string) {
  const rec = await storage.get<PinRecord>(PIN_KEY);
  if (!rec) return false;
  return (await hashPin(pin, unb64(rec.salt))) === rec.hash;
}

export async function fingerprintAvailable() {
  try {
    return !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch {
    return false;
  }
}

export async function hasFingerprint() {
  return !!(await storage.get<string>(CRED_KEY));
}

export async function enrollFingerprint() {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'המסלול שלי' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'me', displayName: 'המסלול שלי' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('no credential');
  await storage.set(CRED_KEY, b64(cred.rawId));
}

export async function removeFingerprint() {
  await storage.del(CRED_KEY);
}

export async function unlockWithFingerprint() {
  const id = await storage.get<string>(CRED_KEY);
  if (!id) return false;
  try {
    const res = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: unb64(id) }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    return !!res;
  } catch {
    return false;
  }
}
