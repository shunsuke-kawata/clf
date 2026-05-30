import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { NO_STORE_HEADERS, IMMUTABLE_CACHE_HEADERS, withHeaders } from "./api-headers";

describe("NO_STORE_HEADERS", () => {
  it("Cache-Control: no-store を含む", () => {
    expect(NO_STORE_HEADERS["Cache-Control"]).toBe("no-store");
  });

  it("X-Content-Type-Options: nosniff を含む", () => {
    expect(NO_STORE_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("Referrer-Policy: strict-origin-when-cross-origin を含む", () => {
    expect(NO_STORE_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });
});

describe("IMMUTABLE_CACHE_HEADERS", () => {
  it("Cache-Control: public, max-age=31536000, immutable を含む", () => {
    expect(IMMUTABLE_CACHE_HEADERS["Cache-Control"]).toBe("public, max-age=31536000, immutable");
  });

  it("X-Content-Type-Options: nosniff を含む", () => {
    expect(IMMUTABLE_CACHE_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("Referrer-Policy: strict-origin-when-cross-origin を含む", () => {
    expect(IMMUTABLE_CACHE_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });
});

describe("withHeaders", () => {
  it("指定したヘッダーを NextResponse に付与する", () => {
    const res = withHeaders(NextResponse.json({}), NO_STORE_HEADERS);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("既存ヘッダーを保持しつつ新たなヘッダーを追加する", () => {
    const res = new NextResponse(null, { status: 204 });
    const result = withHeaders(res, NO_STORE_HEADERS);
    expect(result.status).toBe(204);
    expect(result.headers.get("Cache-Control")).toBe("no-store");
  });

  it("IMMUTABLE_CACHE_HEADERS を正しく付与する", () => {
    const res = withHeaders(new NextResponse(null, { status: 200 }), IMMUTABLE_CACHE_HEADERS);
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("元の NextResponse インスタンスを返す", () => {
    const original = NextResponse.json({});
    const result = withHeaders(original, NO_STORE_HEADERS);
    expect(result).toBe(original);
  });
});
