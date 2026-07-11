type JsonRecord = Record<string, unknown>;

export function extractProgramId(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const record = body as JsonRecord;
  const data = record.data;

  if (data && typeof data === "object") {
    const nested = data as JsonRecord;
    if (typeof nested.id === "string") {
      return nested.id;
    }
    if (typeof nested.uuid === "string") {
      return nested.uuid;
    }
  }

  if (typeof record.id === "string") {
    return record.id;
  }

  if (typeof record.uuid === "string") {
    return record.uuid;
  }

  return undefined;
}

let cachedToken: string | null = null;

async function tokenWorks(baseUrl: string, token: string): Promise<boolean> {
  const res = await fetch(`${baseUrl}/api/programs?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

export async function getCleanupApiToken(): Promise<string | null> {
  const baseUrl = process.env.DIDAXIS_URL ?? "https://test.didaxis.studio";

  if (cachedToken && (await tokenWorks(baseUrl, cachedToken))) {
    return cachedToken;
  }

  const envToken = process.env.DIDAXIS_API_TOKEN;
  if (envToken && (await tokenWorks(baseUrl, envToken))) {
    cachedToken = envToken;
    return envToken;
  }

  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    return null;
  }

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    return null;
  }

  const loginBody = (await loginRes.json()) as JsonRecord;
  const data = loginBody.data;
  const token =
    data && typeof data === "object"
      ? ((data as JsonRecord).access_token as string | undefined)
      : undefined;

  if (token && (await tokenWorks(baseUrl, token))) {
    cachedToken = token;
    return token;
  }

  return null;
}
