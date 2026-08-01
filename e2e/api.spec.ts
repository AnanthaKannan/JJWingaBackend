import {
  test,
  expect,
  APIResponse,
  APIRequestContext,
  request as playwrightRequest,
} from "@playwright/test";
import { faker } from "@faker-js/faker";
import ApiClient, { expectStatus } from "./apiClient";

test.describe.configure({ mode: "serial" });

const adminCredentials = {
  username: process.env.E2E_ADMIN_USERNAME || "AHB100",
  password: process.env.E2E_ADMIN_PASSWORD || "Teacher100",
  deviceId: process.env.E2E_DEVICE_ID || "playwright-device",
};

const apiKey = process.env.E2E_API_KEY || process.env.API_KEY || "";
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const objectId = "507f1f77bcf86cd799439011";
const runId = `${Date.now()}-${faker.string.alphanumeric(6)}`;

let admin: ApiClient;
let student: ApiClient;
let apiRequest: APIRequestContext;
let createdStudent: {
  _id: string;
  studentId: string;
  password: string;
  name: string;
};
let homeworkQuestionId = "";
let practiceQuestionId = "";
let assignedHomeworkId = "";
let registrationId = "";
let commentId = "";
let createdTeacherId = "";

async function json(response: APIResponse) {
  return response.json();
}

async function createQuestion(type: "homework" | "practice" | "exam") {
  const questionId = `PW-${type}-${runId}`;

  await expectStatus(
    await admin.post("/v1/api/admin/questions", {
      data: {
        questionId,
        level: 1,
        type,
        questions: ["1+1", "2+2"],
        marks: [2, 4],
        oral: false,
      },
    }),
    201,
  );

  const listResponse = await admin.get("/v1/api/admin/questions", {
    params: { search: questionId, type, limit: 5, page: 1 },
  });
  await expectStatus(listResponse, 200);
  const body = await json(listResponse);
  const question = body.questions.find(
    (item: { questionId: string }) => item.questionId === questionId,
  );
  expect(question, `Question ${questionId} should be listed`).toBeTruthy();
  return question._id as string;
}

test.beforeAll(async () => {
  apiRequest = await playwrightRequest.newContext({ baseURL });
  admin = new ApiClient(apiRequest, adminCredentials);
  await admin.login();

  const studentResponse = await admin.post("/v1/api/admin/students", {
    data: {
      name: `Playwright ${faker.person.firstName()} ${runId}`,
      level: 1,
    },
  });
  await expectStatus(studentResponse, 201);
  createdStudent = (await json(studentResponse)).student;

  student = new ApiClient(apiRequest, {
    username: createdStudent.studentId,
    password: createdStudent.password,
    deviceId: adminCredentials.deviceId,
  });
  await student.login();

  homeworkQuestionId = await createQuestion("homework");
  practiceQuestionId = await createQuestion("practice");

  const assignResponse = await admin.post("/v1/api/admin/questions/assign", {
    data: {
      studentId: createdStudent._id,
      questionIds: [homeworkQuestionId],
    },
  });
  await expectStatus(assignResponse, 201);

  const homeworkResponse = await admin.get(
    `/v1/api/homework/${createdStudent._id}/NEW`,
    { params: { type: "homework", limit: 10, page: 1 } },
  );
  await expectStatus(homeworkResponse, 200);
  const homeworkBody = await json(homeworkResponse);
  const homework = homeworkBody.homeworks.find(
    (item: { questionId: { _id: string } }) =>
      item.questionId?._id === homeworkQuestionId,
  );
  expect(homework, "Assigned homework should be listed").toBeTruthy();
  assignedHomeworkId = homework._id;
});

test.afterAll(async () => {
  if (practiceQuestionId) {
    await admin.delete(`/v1/api/admin/questions/${practiceQuestionId}`);
  }

  if (homeworkQuestionId) {
    await admin.delete(`/v1/api/admin/questions/${homeworkQuestionId}`);
  }

  await apiRequest?.dispose();
});

test.describe("public and auth APIs", () => {
  test("GET /health returns basic and detailed health responses", async ({
    request,
  }) => {
    const basic = await request.get("/v1/api/health");
    await expectStatus(basic, 200);
    expect(await json(basic)).toMatchObject({
      success: true,
      message: "Server is running",
    });

    const detailed = await request.get("/v1/api/health", {
      params: { status: true },
    });
    await expectStatus(detailed, 200);
    expect(await json(detailed)).toHaveProperty("status", "OK");
  });

  test("POST /login validates failures and returns a token for seeded admin", async ({
    request,
  }) => {
    await expectStatus(await request.post("/v1/api/login", { data: {} }), 400);

    await expectStatus(
      await request.post("/v1/api/login", {
        data: {
          username: adminCredentials.username,
          password: "WrongPassword",
          deviceId: adminCredentials.deviceId,
        },
      }),
      401,
    );

    const response = await request.post("/v1/api/login", {
      data: adminCredentials,
    });
    await expectStatus(response, 200);
    const body = await json(response);
    expect(body.success).toBe(true);
    expect(body.token).toBeTruthy();
  });

  test("organization public APIs expose validation contracts", async ({
    request,
  }) => {
    await expectStatus(
      await request.post("/v1/api/send-otp", {
        data: { email: "not-an-email" },
      }),
      400,
    );
    await expectStatus(
      await request.post("/v1/api/verify-otp", {
        data: { email: "not-an-email", otp: "123" },
      }),
      400,
    );
    await expectStatus(
      await request.post("/v1/api/verify-prefix", {
        data: { prefix: "", type: "admin" },
      }),
      400,
    );
    await expectStatus(
      await request.post("/v1/api/org", {
        data: { name: "", email: "not-an-email" },
      }),
      400,
    );
  });
});

test.describe("student administration APIs", () => {
  test("GET /admin/students lists students", async () => {
    const response = await admin.get("/v1/api/admin/students", {
      params: { search: createdStudent.name, level: 1, limit: 10, page: 1 },
    });
    await expectStatus(response, 200);
    const body = await json(response);
    expect(body.success).toBe(true);
    expect(body.students).toEqual(expect.any(Array));
  });

  test("PATCH /admin/students/:id updates a student", async () => {
    const response = await admin.patch(
      `/v1/api/admin/students/${createdStudent._id}`,
      { data: { vertical: true, level: 2 } },
    );
    await expectStatus(response, 200);
    expect(await json(response)).toMatchObject({
      success: true,
      message: "Student updated successfully",
    });
  });

  test("POST /admin/students/:id/reset-password resets a student password", async () => {
    const response = await admin.post(
      `/v1/api/admin/students/${createdStudent._id}/reset-password`,
    );
    await expectStatus(response, 200);
    const body = await json(response);
    expect(body.success).toBe(true);
    expect(body.data.password).toBeTruthy();

    student = new ApiClient(apiRequest, {
      username: createdStudent.studentId,
      password: body.data.password,
      deviceId: adminCredentials.deviceId,
    });
  });

  test("POST /login/:studentId uses student device authorization rules", async () => {
    const sameDeviceResponse = await student.post(
      `/v1/api/login/${createdStudent._id}`,
    );
    await expectStatus(sameDeviceResponse, 200);

    const unknownStudentResponse = await student.post(
      `/v1/api/login/${objectId}`,
    );
    await expectStatus(unknownStudentResponse, 401);
  });

  test("student-only profile APIs reject admin tokens", async () => {
    await expectStatus(
      await admin.patch("/v1/api/student", { data: { vertical: false } }),
      403,
    );
    await expectStatus(
      await admin.delete("/v1/api/student/device-id", {
        data: { studentId: createdStudent._id, deviceId: "playwright-device" },
      }),
      403,
    );
  });

  test("PATCH /change-password validates the current password", async () => {
    const response = await admin.patch("/v1/api/change-password", {
      data: {
        oldPassword: "not-the-current-password",
        newPassword: `New-${runId}`,
        confirmNewPassword: `New-${runId}`,
      },
    });
    await expectStatus(response, 400);
  });
});

test.describe("question, ranking, score, and homework APIs", () => {
  test("GET question listing endpoints", async () => {
    await expectStatus(
      await admin.get("/v1/api/admin/questions", {
        params: { search: "PW-", type: "homework", limit: 10, page: 1 },
      }),
      200,
    );
    // TODO: fix this issue
    // await expectStatus(
    //   await admin.get("/v1/api/questions/practice", {
    //     params: { limit: 10, page: 1 },
    //   }),
    //   200,
    // );
    await expectStatus(
      await student.get("/v1/api/student/questions/practice", {
        params: { limit: 10, page: 1 },
      }),
      200,
    );
  });

  test("PATCH /admin/questions/:id updates a question", async () => {
    const response = await admin.patch(
      `/v1/api/admin/questions/${homeworkQuestionId}`,
      { data: { oral: true, marks: [1, 1] } },
    );
    await expectStatus(response, 200);
  });

  test("GET /admin/questions/available/:studentId returns available questions", async () => {
    await expectStatus(
      await admin.get(
        `/v1/api/admin/questions/available/${createdStudent._id}`,
        {
          params: { limit: 10, page: 1 },
        },
      ),
      200,
    );
  });

  test("homework endpoints list, read, and update assigned homework", async () => {
    await expectStatus(
      await admin.get(`/v1/api/homework/${createdStudent._id}/NEW`, {
        params: { sortBy: "createdAt", sortOrder: "desc", limit: 10, page: 1 },
      }),
      200,
    );

    await expectStatus(
      await admin.get(`/v1/api/homework/${assignedHomeworkId}`),
      200,
    );

    const update = await admin.patch(`/v1/api/homework/${assignedHomeworkId}`, {
      data: {
        state: "PROGRESS",
        timer: 30,
        answers: [2, 4],
        results: [true, true],
      },
    });
    await expectStatus(update, 200);
  });

  test("score and ranking endpoints return student progress data", async () => {
    await expectStatus(
      await admin.get(`/v1/api/scores/${createdStudent._id}`),
      200,
    );
    await expectStatus(await admin.get("/v1/api/ranking"), 200);
    await expectStatus(await admin.get("/v1/api/ranking?level=1"), 200);
  });

  test("question assignment APIs validate required payloads", async () => {
    await expectStatus(
      await admin.post("/v1/api/admin/questions/assign", {
        data: { studentId: createdStudent._id, questionIds: [] },
      }),
      400,
    );
    await expectStatus(
      await admin.delete("/v1/api/admin/questions/assign", {
        data: { studentId: createdStudent._id, questionIds: [] },
      }),
      400,
    );
  });

  test("student practice assignment APIs require student role", async () => {
    await expectStatus(
      await admin.post("/v1/api/student/questions/practice/assign", {
        data: { questionIds: [practiceQuestionId] },
      }),
      403,
    );
    await expectStatus(
      await admin.delete("/v1/api/student/questions/practice/assign", {
        data: { questionIds: [practiceQuestionId] },
      }),
      403,
    );
  });
});

test.describe("notification, message, file, and comment APIs", () => {
  test("FCM token endpoints validate payloads", async () => {
    await expectStatus(
      await admin.patch("/v1/api/student/fcm-token", { data: {} }),
      400,
    );
    await expectStatus(
      await admin.patch("/v1/api/fcm-token", {
        data: { fcmToken: `fcm-${runId}` },
      }),
      200,
    );
  });

  test("file upload APIs cover validation, list, profile delete, and admin file mutations", async () => {
    await expectStatus(
      await admin.get("/v1/api/file-uploads", { params: { type: "practice" } }),
      200,
    );

    await expectStatus(
      await admin.get("/v1/api/file-uploads", { params: { type: "bad" } }),
      400,
    );
    await expectStatus(
      await admin.post("/v1/api/uploads", {
        multipart: { path: "practice", name: `Practice ${runId}` },
      }),
      400,
    );
    await expectStatus(await admin.delete("/v1/api/profile-pic"), [200, 400]);
    await expectStatus(
      await admin.patch(`/v1/api/admin/file-uploads/${objectId}`, {
        data: { name: `Updated ${runId}` },
      }),
      [400, 403],
    );
    await expectStatus(
      await admin.delete(`/v1/api/admin/file-uploads/${objectId}`),
      [400, 403],
    );
  });

  test("notification APIs list and validate notification payloads", async () => {
    await expectStatus(
      await admin.get(`/v1/api/notifications/${createdStudent._id}`),
      200,
    );
    await expectStatus(await admin.get("/v1/api/admin/notifications"), 200);
    await expectStatus(
      await admin.post("/v1/api/admin/notifications", {
        data: { studentIds: [], messageHeader: "Hi", messageBody: "Body" },
      }),
      400,
    );
  });

  test("message APIs list, create, unread count, and mark read", async () => {
    await expectStatus(await admin.get("/v1/api/admin/messages/students"), 200);
    await expectStatus(await admin.get("/v1/api/messages/unread-count"), 200);
    await expectStatus(await admin.get("/v1/api/messages"), 200);

    const create = await admin.post("/v1/api/messages", {
      data: {
        message: `Hello from Playwright ${runId}`,
        receivedTo: createdStudent._id,
      },
    });
    await expectStatus(create, 201);

    await expectStatus(
      await admin.patch("/v1/api/messages/read", {
        data: { userId: createdStudent._id, messageIds: [] },
      }),
      200,
    );
  });

  test("comment APIs add parent/child comments and read threads", async () => {
    const parent = await admin.post("/v1/api/comment", {
      data: {
        imageId: objectId,
        content: `Parent comment ${runId}`,
      },
    });
    await expectStatus(parent, 201);
    commentId = (await json(parent)).data.id;

    await expectStatus(
      await admin.post("/v1/api/comment", {
        data: {
          imageId: objectId,
          parentId: commentId,
          content: `Child comment ${runId}`,
        },
      }),
      201,
    );
    await expectStatus(
      await admin.get(`/v1/api/comment/parent/${objectId}`),
      200,
    );
    await expectStatus(
      await admin.get(`/v1/api/comment/child/${commentId}`),
      200,
    );
  });

  test("comment like route requires authentication", async ({ request }) => {
    await expectStatus(
      await request.put("/v1/api/comment/like", {
        data: { imageId: objectId },
      }),
      401,
    );
  });
});

test.describe("superadmin and cron APIs", () => {
  test("teacher and organization admin APIs are covered by success or role guard", async () => {
    const list = await admin.get("/v1/api/admin/teacher");
    await expectStatus(list, [200, 403]);

    const create = await admin.post("/v1/api/admin/teacher", {
      data: { name: `Teacher ${runId}`, profilePicPath: "" },
    });
    await expectStatus(create, [201, 403]);
    if (create.status() === 201) {
      createdTeacherId = (await json(create)).data._id;
      await expectStatus(
        await admin.patch(`/v1/api/admin/teacher/${createdTeacherId}`, {
          data: { name: `Teacher Updated ${runId}` },
        }),
        200,
      );
    } else {
      await expectStatus(
        await admin.patch(`/v1/api/admin/teacher/${objectId}`, {
          data: { name: `Teacher Updated ${runId}` },
        }),
        403,
      );
    }

    await expectStatus(await admin.get("/v1/api/admin/org"), [200, 403]);
  });

  test("cron appreciation route checks API key", async ({ request }) => {
    await expectStatus(
      await request.post("/v1/api/crone/notifications/appreciations", {
        headers: { "x-api-key": "wrong-key" },
      }),
      401,
    );

    await expectStatus(
      await request.post("/v1/api/crone/notifications/appreciations", {
        headers: { "x-api-key": apiKey },
      }),
      201,
    );

    await expectStatus(
      await request.post("/v1/api/crone/notifications/homework-reminder", {
        headers: { "x-api-key": apiKey },
      }),
      200,
    );
  });
});

test.describe("auth guards for protected APIs", () => {
  const protectedRoutes: Array<{
    method: "get" | "post" | "patch" | "delete" | "put";
    url: string;
  }> = [
    { method: "get", url: "/v1/api/admin/students" },
    { method: "get", url: "/v1/api/ranking" },
    { method: "patch", url: "/v1/api/student" },
    { method: "delete", url: "/v1/api/student/device-id" },
    { method: "get", url: "/v1/api/file-uploads" },
    { method: "get", url: `/v1/api/scores/${objectId}` },
    { method: "get", url: "/v1/api/messages" },
    { method: "post", url: "/v1/api/comment" },
  ];

  for (const route of protectedRoutes) {
    test(`${route.method.toUpperCase()} ${route.url} rejects missing token`, async ({
      request,
    }) => {
      await expectStatus(await request[route.method](route.url), 401);
    });
  }
});
