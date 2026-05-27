const http = require('http');
const {
  processPendingNotifications,
  sendNotificationById,
} = require('./notifications');

const PORT = Number(process.env.PORT || 3001);
const API_KEY = process.env.API_KEY;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

function isAuthorized(req) {
  return !API_KEY || req.headers['x-api-key'] === API_KEY;
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return;
  }

  if (req.method === 'POST' && req.url === '/notifications/send-pending') {
    const results = await processPendingNotifications();
    sendJson(res, 200, { ok: true, results });
    return;
  }

  const sendMatch = req.url.match(/^\/notifications\/([^/]+)\/send$/);

  if (req.method === 'POST' && sendMatch) {
    const notificationId = decodeURIComponent(sendMatch[1]);
    const result = await sendNotificationById(notificationId);
    sendJson(res, 200, { ok: result.status !== 'failed', result });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(error => {
    console.error(error);
    sendJson(res, 500, {
      ok: false,
      error: error?.message ?? String(error),
    });
  });
});

server.listen(PORT, () => {
  console.log(`Notifications API listening on port ${PORT}`);
});
