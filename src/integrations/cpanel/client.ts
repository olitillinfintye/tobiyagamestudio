import type { Database } from "./types";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;
export type ApiError = { message: string; code?: string };
type Result<Value> = { data: Value | null; error: ApiError | null };
type User = { id: string; email: string };
type Session = { user: User };
type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "PASSWORD_RECOVERY" | "USER_UPDATED";
type Listener = (event: AuthEvent, session: Session | null) => void;
const listeners = new Set<Listener>();
let csrf = "";
let session: Session | null = null;
let sessionRequest: Promise<void> | null = null;

async function hydrate() {
  sessionRequest ??= (async () => {
    const response = await fetch("/api/index.php?action=session", { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.data?.csrf) throw new Error("The CMS API is unavailable.");
    csrf = payload.data.csrf;
    session = payload.data.session;
  })().catch((error) => { sessionRequest = null; throw error; });
  await sessionRequest;
}

export async function request<Value>(action: string, body: unknown = {}): Promise<Result<Value>> {
  try {
    await hydrate();
    const form = body instanceof FormData;
    const response = await fetch(`/api/index.php?action=${encodeURIComponent(action)}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": csrf, ...(!form ? { "Content-Type": "application/json" } : {}) },
      body: form ? body : JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
      if (response.status === 401) {
        session = null;
        listeners.forEach((listener) => listener("SIGNED_OUT", null));
      }
      if (response.status === 403 && payload.error?.code === "csrf") sessionRequest = null;
      return { data: null, error: payload.error ?? { message: "Request failed." } };
    }
    return { data: payload.data, error: null };
  } catch {
    return { data: null, error: { message: "Unable to reach the CMS. Please try again." } };
  }
}

class Query<Name extends TableName, Value = Tables[Name]["Row"][]> implements PromiseLike<Result<Value>> {
  private operation = "select";
  private columns = "*";
  private values: unknown;
  private filters: { column: string; operator: "eq" | "in"; value: unknown }[] = [];
  private ordering: { column: string; ascending: boolean }[] = [];
  private maximum?: number;
  private cardinality = "many";
  private conflict?: string;
  private execution?: Promise<Result<Value>>;

  constructor(private table: Name) {}
  select(columns = "*") { this.columns = columns; return this; }
  insert(values: Tables[Name]["Insert"] | Tables[Name]["Insert"][]) { this.operation = "insert"; this.values = values; return this; }
  update(values: Tables[Name]["Update"]) { this.operation = "update"; this.values = values; return this; }
  delete() { this.operation = "delete"; return this; }
  upsert(values: Tables[Name]["Insert"] | Tables[Name]["Insert"][], options?: { onConflict?: string }) {
    this.operation = "upsert"; this.values = values; this.conflict = options?.onConflict; return this;
  }
  eq(column: keyof Tables[Name]["Row"] & string, value: unknown) { this.filters.push({ column, operator: "eq", value }); return this; }
  in(column: keyof Tables[Name]["Row"] & string, value: unknown[]) { this.filters.push({ column, operator: "in", value }); return this; }
  order(column: keyof Tables[Name]["Row"] & string, options?: { ascending?: boolean }) { this.ordering.push({ column, ascending: options?.ascending ?? true }); return this; }
  limit(value: number) { this.maximum = value; return this; }
  single() { this.cardinality = "one"; return this as unknown as Query<Name, Tables[Name]["Row"]>; }
  maybeSingle() { this.cardinality = "optional"; return this as unknown as Query<Name, Tables[Name]["Row"]>; }
  then<Resolved = Result<Value>, Rejected = never>(
    onfulfilled?: ((value: Result<Value>) => Resolved | PromiseLike<Resolved>) | null,
    onrejected?: ((reason: unknown) => Rejected | PromiseLike<Rejected>) | null,
  ): Promise<Resolved | Rejected> {
    this.execution ??= request<Value>("query", { table: this.table, operation: this.operation, columns: this.columns,
      values: this.values, filters: this.filters, ordering: this.ordering, limit: this.maximum,
      cardinality: this.cardinality, conflict: this.conflict });
    return this.execution.then(onfulfilled, onrejected);
  }
}

async function setSession(action: string, body: unknown, event: AuthEvent) {
  const result = await request<{ session: Session | null; csrf: string }>(action, body);
  if (!result.error && result.data) {
    session = result.data.session;
    csrf = result.data.csrf;
    listeners.forEach((listener) => listener(event, session));
  }
  return { data: { session, user: session?.user ?? null }, error: result.error };
}

export const cms = {
  from: <Name extends TableName>(table: Name) => new Query(table),
  auth: {
    async getSession() {
      try { await hydrate(); return { data: { session }, error: null }; }
      catch { return { data: { session: null }, error: { message: "The CMS API is unavailable." } }; }
    },
    async getUser() { const result = await this.getSession(); return { data: { user: result.data.session?.user ?? null }, error: result.error }; },
    onAuthStateChange(listener: Listener) { listeners.add(listener); return { data: { subscription: { unsubscribe: () => { listeners.delete(listener); } } } }; },
    signInWithPassword: (credentials: { email: string; password: string }) => setSession("login", credentials, "SIGNED_IN"),
    signOut: () => setSession("logout", {}, "SIGNED_OUT"),
    resetPasswordForEmail: (email: string) => request("request-reset", { email }),
    updateUser: ({ password }: { password: string }) => {
      const token = new URLSearchParams(location.hash.slice(1)).get("recovery_token");
      return setSession("reset-password", { password, token }, "USER_UPDATED");
    },
  },
  storage: {
    from: (bucket: string) => ({
      async upload(path: string, file: File) {
        const form = new FormData();
        form.append("bucket", bucket); form.append("path", path); form.append("file", file);
        return request<{ path: string }>("upload", form);
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: `/uploads/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}` } }),
    }),
  },
};