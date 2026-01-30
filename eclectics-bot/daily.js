const cron = require("node-cron");
const { fetchSchedule } = require("./api");

// ---------- time/date helpers ----------
function to12Hour(time) {
  if (!time) return null;
  const [hh, mm] = time.split(":").map(Number);
  const period = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${mm.toString().padStart(2, "0")} ${period}`;
}

function prettyTime(e) {
  const start = to12Hour(e.startTime);
  const end = to12Hour(e.endTime);

  if (!start && !end) return "TBA";
  if (start && end) return `${start}–${end}`;
  if (start) return start;
  return `until ${end}`;
}

function toMinutes(t) {
  if (!t) return null;
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function getNYDateString(d = new Date()) {
  // YYYY-MM-DD in America/New_York
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${day}`;
}

function sortForAgenda(events) {
  return events.sort((a, b) => {
    const ta = toMinutes(a.startTime);
    const tb = toMinutes(b.startTime);

    if (ta === null && tb !== null) return 1;
    if (ta !== null && tb === null) return -1;
    if (ta !== null && tb !== null && ta !== tb) return ta - tb;

    return (a.title ?? "").localeCompare(b.title ?? "");
  });
}

function formatTodayMessage(todayEvents) {
  const lines = todayEvents.map((e) => {
    const time = prettyTime(e);
    const title = e.title ?? "Untitled Event";
    const loc = e.location && e.location.trim() ? e.location.trim() : "TBA";

    const timePart = (e.startTime || e.endTime) ? `\`${time}\`` : "`TBA`";
    return `• ${timePart}  **${title}** @ ${loc}`;
  });

  return [
    "Good morning! Here’s what’s happening today 🌤️",
    "",
    "__Today__",
    ...lines,
  ].join("\n");
}

// ---------- core poster (used by cron + /post-today) ----------
async function postTodayNow(client, channelIdOverride = null) {
  const channelId = channelIdOverride || process.env.ANNOUNCE_CHANNEL_ID;
  if (!channelId) throw new Error("ANNOUNCE_CHANNEL_ID not set");

  const today = getNYDateString(new Date());
  const all = await fetchSchedule();
  if (!Array.isArray(all)) throw new Error("Schedule API did not return an array");

  const todayEvents = all.filter((e) => e?.date === today);

  if (!todayEvents.length) {
    return { posted: false, reason: "No events today.", date: today };
  }

  sortForAgenda(todayEvents);

  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    throw new Error("ANNOUNCE_CHANNEL_ID is not a text channel or cannot be fetched");
  }

  await channel.send(formatTodayMessage(todayEvents));

  return { posted: true, count: todayEvents.length, date: today };
}

// ---------- scheduler ----------
function startDailyAnnouncements(client) {
  const channelId = process.env.ANNOUNCE_CHANNEL_ID;
  if (!channelId) {
    console.warn("ANNOUNCE_CHANNEL_ID not set — daily announcements disabled.");
    return;
  }

  // Every day at 8:00 AM America/New_York
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        const result = await postTodayNow(client);
        if (result.posted) {
          console.log(`Daily post sent for ${result.date} (${result.count} events).`);
        } else {
          console.log(`No daily post for ${result.date}: ${result.reason}`);
        }
      } catch (err) {
        console.error("Daily 8am announcement failed:", err);
      }
    },
    { timezone: "America/New_York" }
  );

  console.log("Daily announcements scheduled: 8:00 AM America/New_York");
}

module.exports = { startDailyAnnouncements, postTodayNow };
