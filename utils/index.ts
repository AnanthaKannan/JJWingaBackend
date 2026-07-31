export const LEVELS = [
  "Pluto", // 0
  "Mercury", // 1
  "Venus", // 2
  "Mars", // 3
  "Earth", // 4
  "Jupiter", // 5
  "Saturn", // 6
  "Uranus", // 7
  "Neptune", // 8
  "Sun", // 9
  "Galaxy", // 10
];

export function getFormattedUptime() {
  const uptime = process.uptime(); // seconds (float)

  const totalMilliseconds = Math.floor(uptime * 1000);

  const hours = Math.floor(totalMilliseconds / 3600000);
  const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return (
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}:` +
    `${String(milliseconds).padStart(3, "0")}`
  );
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

export default {
  getFormattedUptime,
  generateOtp,
  LEVELS,
};
