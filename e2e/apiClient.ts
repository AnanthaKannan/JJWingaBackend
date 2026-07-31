import { APIRequestContext, APIResponse, expect } from "@playwright/test";

export type LoginData = {
  username: string;
  password: string;
  deviceId?: string;
};

export default class ApiClient {
  private token = "";

  constructor(
    private request: APIRequestContext,
    private loginData: LoginData,
  ) {}

  async login() {
    if (this.token) return this.token;

    const response = await this.request.post("/v1/api/login", {
      data: {
        deviceId: "playwright-device",
        ...this.loginData,
      },
    });

    expect(response.status(), await describeResponse(response)).toBe(200);
    const body = await response.json();
    expect(body.token).toBeTruthy();
    this.token = body.token;
    return this.token;
  }

  async authHeaders(extraHeaders: Record<string, string> = {}) {
    return {
      "x-access-token": await this.login(),
      ...extraHeaders,
    };
  }

  async get(url: string, options: RequestOptions = {}) {
    return this.request.get(url, {
      ...options,
      headers: await this.authHeaders(options.headers),
    });
  }

  async post(url: string, options: RequestOptions = {}) {
    return this.request.post(url, {
      ...options,
      headers: await this.authHeaders(options.headers),
    });
  }

  async patch(url: string, options: RequestOptions = {}) {
    return this.request.patch(url, {
      ...options,
      headers: await this.authHeaders(options.headers),
    });
  }

  async delete(url: string, options: RequestOptions = {}) {
    return this.request.delete(url, {
      ...options,
      headers: await this.authHeaders(options.headers),
    });
  }
}

type RequestOptions = NonNullable<Parameters<APIRequestContext["post"]>[1]>;

export async function describeResponse(response: APIResponse) {
  const contentType = response.headers()["content-type"] || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return `${response.status()} ${response.url()} ${JSON.stringify(body)}`;
}

export async function expectStatus(
  response: APIResponse,
  expectedStatus: number | number[],
) {
  const allowed = Array.isArray(expectedStatus)
    ? expectedStatus
    : [expectedStatus];
  expect(allowed, await describeResponse(response)).toContain(
    response.status(),
  );
}
