import "server-only";

import type { NextRequest } from "next/server";

const ORIGIN_ONLY_URL = /^[A-Za-z][A-Za-z\d+.-]*:\/\/[^/?#]+$/;

export function isTrustedMutationOrigin(
  incomingOrigin: string | null,
  trustedSiteUrl: string,
): boolean {
  if (!incomingOrigin || !ORIGIN_ONLY_URL.test(incomingOrigin)) return false;

  try {
    const incoming = new URL(incomingOrigin);
    const trusted = new URL(trustedSiteUrl);

    if (incoming.username || incoming.password) return false;

    return incoming.origin === trusted.origin;
  } catch {
    return false;
  }
}

export function hasTrustedMutationOrigin(
  request: Pick<NextRequest, "headers">,
  trustedSiteUrl: string,
): boolean {
  return isTrustedMutationOrigin(
    request.headers.get("origin"),
    trustedSiteUrl,
  );
}
