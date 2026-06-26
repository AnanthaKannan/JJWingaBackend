const https = require("http");

const BASE_URL = "http://localhost:3000/v1/api/admin/questions";
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTZkNDEwODM0OWU0NDljODdjNzgwNiIsIm5hbWUiOiJIb25leSBCZWUiLCJvcmdJZCI6IjZhM2FiMDljMWQzMzk1NDQ0YTkyYmUzNCIsInJvbGUiOiJhZG1pbiIsImFkbWluSWQiOiJBSEIxMDAiLCJyb2xlcyI6WyJzdXBlcmFkbWluIl0sImlhdCI6MTc4MjQ4ODc1OCwiZXhwIjoxNzgyNTc1MTU4fQ.8cRDf4ARjLtTzgZjXX8_MNGLEjX4fswQJ2Dxj6vHfmo";

const TOTAL = 100;
const START_INDEX = 4; // 5A-04 is the first entry

/**
 * Formats questionId like 5A-04, 5A-05 ... 5A-103
 * Pads to 2 digits for values < 10, no padding beyond that
 */
function formatQuestionId(index) {
  const num = String(index).padStart(2, "0");
  return `6A-${num}`;
}

/**
 * POST a single question entry
 */
async function postQuestion(questionId) {
  const body = JSON.stringify({
    questionId,
    type: "practice",
    level: 1,
    questions: ["1+20+10", "10+10+10", "10+10+10", "10+10+10", "10+10+10"],
  });

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "x-access-token": TOKEN,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await response.json();
  return { status: response.status, data };
}

/**
 * Run all 100 requests sequentially to avoid overwhelming the server
 */
async function seedQuestions() {
  console.log(
    `🚀 Starting seed: ${TOTAL} questions from ${formatQuestionId(START_INDEX)}\n`,
  );

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TOTAL; i++) {
    const index = START_INDEX + i; // 4, 5, 6 ... 103
    const questionId = formatQuestionId(index);

    try {
      const { status, data } = await postQuestion(questionId);

      if (status === 200 || status === 201) {
        successCount++;
        console.log(`✅ [${i + 1}/${TOTAL}] ${questionId} → ${status}`);
      } else {
        failCount++;
        console.warn(
          `⚠️  [${i + 1}/${TOTAL}] ${questionId} → ${status}`,
          JSON.stringify(data),
        );
      }
    } catch (err) {
      failCount++;
      console.error(
        `❌ [${i + 1}/${TOTAL}] ${questionId} → ERROR:`,
        err.message,
      );
    }
  }

  console.log(`\n✅ Done! Success: ${successCount} | Failed: ${failCount}`);
}

seedQuestions();
