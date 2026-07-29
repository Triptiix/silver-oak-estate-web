import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ACTOR_COOKIE_NAME = "soe_actor";

const COOKIE_SIGNATURE_DOMAIN = "soe-actor-cookie-signature:v1:";
const DATABASE_IDENTITY_DOMAIN = "soe-actor-database-identity:v1:";

export type ActorIdentity = {
  cookieValue: string;
  actorIdentityHash: string;
  isNew: boolean;
};

export function getOrCreateActorIdentity(
  existingCookieValue: string | undefined,
  secret: string,
): ActorIdentity {
  if (existingCookieValue) {
    const verified = verifyActorCookieValue(existingCookieValue, secret);
    if (verified) {
      return {
        cookieValue: existingCookieValue,
        actorIdentityHash: deriveActorDatabaseHash(verified.rawToken, secret),
        isNew: false,
      };
    }
  }

  const rawToken = randomBytes(32).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${COOKIE_SIGNATURE_DOMAIN}${rawToken}`)
    .digest("base64url");

  const cookieValue = `${rawToken}.${signature}`;
  const actorIdentityHash = deriveActorDatabaseHash(rawToken, secret);

  return {
    cookieValue,
    actorIdentityHash,
    isNew: true,
  };
}

function verifyActorCookieValue(
  cookieValue: string,
  secret: string,
): { rawToken: string } | null {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [rawToken, signature] = parts;
  if (!rawToken || !signature) return null;
  if (!/^[A-Za-z0-9_-]{43}$/.test(rawToken)) return null;
  if (!/^[A-Za-z0-9_-]{43}$/.test(signature)) return null;

  const decodedRawToken = Buffer.from(rawToken, "base64url");
  if (decodedRawToken.length !== 32) return null;

  const expectedSignature = createHmac("sha256", secret)
    .update(`${COOKIE_SIGNATURE_DOMAIN}${rawToken}`)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  return { rawToken };
}

function deriveActorDatabaseHash(rawToken: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${DATABASE_IDENTITY_DOMAIN}${rawToken}`)
    .digest("hex");
}
