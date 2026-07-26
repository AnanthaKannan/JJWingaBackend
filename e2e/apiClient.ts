import { APIRequestContext } from "@playwright/test";

type LoginData = {
  userName: string;
  password: string;
  deviceId: string;
};

export default class ApiClient {
  private token: string = "";
  constructor(
    private request: APIRequestContext,
    private loginData: LoginData,
  ) {}

  async login() {
    if (this.token) return this.token;
    else {
      const response = await this.request.post(
        "http://localhost:3000/v1/api/login",
        {
          data: this.loginData,
        },
      );
      const body = await response.json();
      return body.token;
    }
  }

  async get(url: string) {
    return this.request.get(url, {
      headers: {
        Authorization: await this.login(),
      },
    });
  }

  async post(url: string, data: any) {
    return this.request.post(url, {
      headers: {
        Authorization: await this.login(),
      },
      data,
    });
  }
}
