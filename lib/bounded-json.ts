export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "too_large" | "invalid_json" };

export async function readBoundedJson(
  request: Request,
  maximumBytes: number,
): Promise<BoundedJsonResult> {
  const contentLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    return { ok: false, reason: "too_large" };
  }

  if (!request.body) {
    return { ok: false, reason: "invalid_json" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > maximumBytes) {
        await reader.cancel();
        return { ok: false, reason: "too_large" };
      }

      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      ok: true,
      value: JSON.parse(new TextDecoder().decode(bodyBytes)),
    };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
