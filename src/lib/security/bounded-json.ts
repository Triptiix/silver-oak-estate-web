import "server-only";

export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | {
      ok: false;
      reason: "too_large" | "invalid_json" | "unsupported_media_type";
    };

function isJsonMediaType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return mediaType === "application/json"
    || /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+\+json$/.test(mediaType);
}

function declaredBodyIsTooLarge(contentLength: string | null, limit: number): boolean {
  if (!contentLength || !/^(0|[1-9][0-9]*)$/.test(contentLength)) return false;
  const declaredLength = Number(contentLength);
  return !Number.isFinite(declaredLength) || declaredLength > limit;
}

export async function readBoundedJson(
  request: Request,
  limit: number,
): Promise<BoundedJsonResult> {
  if (!isJsonMediaType(request.headers.get("content-type"))) {
    return { ok: false, reason: "unsupported_media_type" };
  }
  if (declaredBodyIsTooLarge(request.headers.get("content-length"), limit)) {
    return { ok: false, reason: "too_large" };
  }
  if (!request.body) return { ok: false, reason: "invalid_json" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > limit) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "invalid_json" };
  } finally {
    reader.releaseLock();
  }

  try {
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
