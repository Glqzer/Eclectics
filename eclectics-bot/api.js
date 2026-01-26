require("dotenv").config();

async function fetchSchedule() {
  const headers = { Accept: "application/json" };

  if (process.env.API_KEY) {
    headers.Authorization = `Bearer ${process.env.API_KEY}`;
  }

  const res = await fetch(process.env.SCHEDULE_API_URL, { headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json(); // returns array of events
}

module.exports = { fetchSchedule };
