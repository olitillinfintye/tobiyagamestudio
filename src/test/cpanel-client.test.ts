import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe("cPanel client", () => {
  it("sends bounded query intent with cookies and CSRF, without a Supabase token", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { csrf: "test-csrf", session: null } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "project", title: "Demo" }] })));
    vi.stubGlobal("fetch", fetchMock);
    const { cms } = await import("../integrations/cpanel/client");
    const result = await cms.from("projects").select("id,title").eq("featured", true).order("display_order").limit(3);
    expect(result.error).toBeNull();
    expect(result.data?.[0].title).toBe("Demo");
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/index.php?action=query");
    expect(options.credentials).toBe("same-origin");
    expect(options.headers["X-CSRF-Token"]).toBe("test-csrf");
    expect(options.headers.Authorization).toBeUndefined();
    expect(JSON.parse(options.body)).toMatchObject({ table: "projects", operation: "select", limit: 3,
      filters: [{ column: "featured", operator: "eq", value: true }] });
  });

  it("returns a visible error when the API serves HTML or is offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Not the API</html>")));
    const { cms } = await import("../integrations/cpanel/client");
    const result = await cms.from("projects").select();
    expect(result.data).toBeNull();
    expect(result.error?.message).toContain("Unable to reach");
  });

  it("does not retry a failed mutation automatically", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { csrf: "test-csrf", session: null } })))
      .mockRejectedValueOnce(new Error("Lost connection"));
    vi.stubGlobal("fetch", fetchMock);
    const { cms } = await import("../integrations/cpanel/client");
    const query = cms.from("awards").insert({ title: "Award" });
    expect((await query).error).not.toBeNull();
    expect((await query).error).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses the recovery token and rotates CSRF after a password reset", async () => {
    window.history.replaceState(null, "", "/admin#recovery_token=single-use-test-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { csrf: "before", session: null } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { csrf: "after", session: { user: { id: "admin", email: "admin@example.com" } } } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] })));
    vi.stubGlobal("fetch", fetchMock);
    const { cms } = await import("../integrations/cpanel/client");
    expect((await cms.auth.updateUser({ password: "test-only-password" })).error).toBeNull();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ password: "test-only-password", token: "single-use-test-token" });
    await cms.from("projects").select();
    expect(fetchMock.mock.calls[2][1].headers["X-CSRF-Token"]).toBe("after");
    window.history.replaceState(null, "", "/");
  });

  it("notifies subscribers when the server revokes a session", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { csrf: "test", session: { user: { id: "admin" } } } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "Please sign in." } }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const { cms } = await import("../integrations/cpanel/client");
    const listener = vi.fn();
    const { data } = cms.auth.onAuthStateChange(listener);
    await cms.from("admin_users").select();
    expect(listener).toHaveBeenCalledWith("SIGNED_OUT", null);
    expect(data.subscription.unsubscribe()).toBeUndefined();
  });
});