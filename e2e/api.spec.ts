import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";

let token: string;
let headers = { "x-access-token": "" };

test("Login API - 401", async ({ request }) => {
  const response = await request.post("/v1/api/login", {
    data: {
      username: "AHB100",
      password: "WrongPassword",
      deviceId: "123456788",
    },
  });

  expect(response.status()).toBe(401);
});

test("Login API - 200", async ({ request }) => {
  const response = await request.post("v1/api/login", {
    data: {
      username: "AHB100",
      password: "Teacher100",
      deviceId: "123456788",
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  token = body.token;
  headers["x-access-token"] = token;
  expect(token).toBeTruthy();
});

test("Add Student - 201", async ({ request }) => {
  const studentName = faker.internet.username();

  const response = await request.post("v1/api/admin/students", {
    headers,
    data: {
      name: studentName,
      level: 0,
    },
  });

  expect(response.status()).toBe(201);
  const body = await response.json();

  const student = body.student;

  expect(body.success).toBe(true);
  expect(body.message).toBe("Student added successfully");

  expect(student.name).toBe(studentName);
  expect(student.level).toBe(0);
  expect(student.vertical).toBe(false);
  expect(student.isDeleted).toBe(false);
  expect(student.profilePicPath).toBe("");
  expect(student.deletedDate).toBe(null);
  expect(student.deviceIds.length).toBe(0);
  expect(student.fcmTokens.length).toBe(0);

  expect(student.studentId).toBeTruthy();
  expect(student.password).toBeTruthy();
  expect(student.createdBy).toBeTruthy();
  expect(student.orgId).toBeTruthy();
  expect(student._id).toBeTruthy();

  expect(student).toHaveProperty("createdAt");
  expect(student).toHaveProperty("updatedAt");
  expect(student).toHaveProperty("updatedAt");
});
