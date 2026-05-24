import { describe, it, expect } from "vitest";
import { createSearchSession, verifySearchSession } from "./session";

describe("createSearchSession", () => {
  it("uuid.hex形式のcookie値を返す", () => {
    const { cookieValue, sessionId } = createSearchSession();
    const [id, sig] = cookieValue.split(".");
    expect(id).toBe(sessionId);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("呼び出しごとに異なるsessionIdを生成する", () => {
    const a = createSearchSession();
    const b = createSearchSession();
    expect(a.sessionId).not.toBe(b.sessionId);
  });
});

describe("verifySearchSession", () => {
  it("正当なcookie値からsessionIdを返す", () => {
    const { cookieValue, sessionId } = createSearchSession();
    expect(verifySearchSession(cookieValue)).toBe(sessionId);
  });

  it("改ざんされたsignatureはnullを返す", () => {
    const { cookieValue } = createSearchSession();
    const [id] = cookieValue.split(".");
    expect(verifySearchSession(`${id}.${"0".repeat(64)}`)).toBeNull();
  });

  it("セパレーターがない場合はnullを返す", () => {
    expect(verifySearchSession("invalidsessioncookie")).toBeNull();
  });

  it("異なるsessionIdで署名されたcookieはnullを返す", () => {
    const { cookieValue } = createSearchSession();
    const [, sig] = cookieValue.split(".");
    const otherId = "00000000-0000-0000-0000-000000000000";
    expect(verifySearchSession(`${otherId}.${sig}`)).toBeNull();
  });
});
