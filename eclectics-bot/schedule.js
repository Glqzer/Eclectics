const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

/* ---------- helpers ---------- */

function toMinutes(t) {
  if (!t) return null;
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return "TBA";
  if (startTime && endTime) return `${startTime}–${endTime}`;
  if (startTime) return `${startTime}`;
  return `until ${endTime}`;
}

function parseLocalDateTime(dateStr, timeStr, endOfDay = false) {
  if (!dateStr) return null;
  if (!timeStr) {
    return endOfDay
      ? new Date(`${dateStr}T23:59:59`)
      : new Date(`${dateStr}T00:00:00`);
  }
  return new Date(`${dateStr}T${timeStr}:00`);
}

function isCurrentOrFuture(e, now = new Date()) {
  const end = e.endTime
    ? parseLocalDateTime(e.date, e.endTime, true)
    : e.startTime
      ? parseLocalDateTime(e.date, e.startTime, false)
      : parseLocalDateTime(e.date, null, true);

  return !end || end >= now;
}

function dedupeEvents(events) {
  const keyOf = (e) =>
    [
      e.title ?? "",
      e.date ?? "",
      e.startTime ?? "",
      e.endTime ?? "",
      e.location ?? "",
      e.type ?? "",
      e.description ?? "",
    ].join("|");

  const map = new Map();
  for (const e of events) {
    const k = keyOf(e);
    const prev = map.get(k);
    if (!prev) map.set(k, e);
    else {
      const p = Date.parse(prev.createdAt || 0);
      const n = Date.parse(e.createdAt || 0);
      if (n > p || (n === p && (e.id ?? 0) > (prev.id ?? 0))) {
        map.set(k, e);
      }
    }
  }
  return [...map.values()];
}

function sortChronologically(events) {
  return events.sort((a, b) => {
    if (a.date !== b.date) return (a.date ?? "").localeCompare(b.date ?? "");
    const ta = toMinutes(a.startTime);
    const tb = toMinutes(b.startTime);
    if (ta === null && tb !== null) return 1;
    if (ta !== null && tb === null) return -1;
    if (ta !== null && tb !== null && ta !== tb) return ta - tb;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/* ---------- embeds ---------- */

function formatPrettyWhen(e) {
  const dateObj = e.date ? new Date(`${e.date}T00:00:00`) : null;

  // Example: "Saturday, Feb 7, 2026"
  const dayAndDate = dateObj
    ? dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown date";

  const timeRange = formatTimeRange(e.startTime, e.endTime); // uses your existing helper

  // If time is missing, just show date.
  if (!e.startTime && !e.endTime) return dayAndDate;

  return `${dayAndDate}, ${timeRange}`;
}

function eventToField(e) {
  const when = formatPrettyWhen(e);
  const location = e.location && e.location.trim() ? e.location.trim() : "TBA";

  return {
    // Line 1: Event Name
    name: e.title ?? "Untitled Event",

    // Line 2 + 3: When + Location
    value: `${when}\n${location}`,

    inline: false,
  };
}

function prettyDay(dateStr) {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : null;
  return d
    ? d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown date";
}

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

function prettyDay(dateStr) {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : null;
  return d
    ? d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown date";
}

function typeEmoji(type) {
  const t = (type || "").toLowerCase();
  if (t === "teaching") return "";
  if (t === "workshop") return "";
  if (t === "blocking") return "";
  if (t === "performance") return "";
  if (t === "social") return "";
  if (t === "cleaning") return "";
  return "📌";
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function prettyDayWithRelative(dateStr) {
  if (!dateStr) return "Unknown date";

  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(d, today)) return "**Today**";
  if (isSameDay(d, tomorrow)) return "**Tomorrow**";

  return `**${d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  })}**`;
}

function buildScheduleEmbed(pages, pageIndex) {
  const page = pages[pageIndex] ?? [];

  const embed = new EmbedBuilder()
    .setTitle("📅 Schedule")
    .setFooter({
      text: pages.length ? `Page ${pageIndex + 1} / ${pages.length}` : "",
    });

  if (!page.length) {
    embed.setDescription("No current or upcoming events.");
    return embed;
  }

  // Group THIS page by date
  const grouped = new Map();
  for (const e of page) {
    const key = e.date ?? "Unknown date";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(e);
  }

  const lines = [];

  for (const [date, items] of grouped) {
    // Date header
    lines.push(`**__${prettyDayWithRelative(date).replace(/\*\*/g, "")}__**`);

    items.forEach((e) => {
      const time = prettyTime(e);
      const title = e.title ?? "Untitled Event";
      const loc = e.location && e.location.trim() ? e.location.trim() : "TBA";

      const timePart = e.startTime || e.endTime ? `\`${time}\`` : "`TBA`";

      lines.push(`• ${timePart}  **${title}** @ ${loc}`);
    });

    // one blank line between date sections
    lines.push("");
  }

  let desc = lines.join("\n").trimEnd();

  // Safety against embed limits
  if (desc.length > 4000) desc = desc.slice(0, 3990) + "\n…";

  embed.setDescription(desc);
  return embed;
}

function buildPagerRow(pageIndex, total) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("schedule_prev")
      .setLabel("Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex <= 0),
    new ButtonBuilder()
      .setCustomId("schedule_next")
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex >= total - 1),
  );
}

/* ---------- main exported handler ---------- */

async function handleScheduleCommand(interaction, events) {
  const now = new Date();

  const deduped = dedupeEvents(events);
  const filtered = deduped.filter((e) => isCurrentOrFuture(e, now));
  const sorted = sortChronologically(filtered);
  const pages = chunk(sorted, 6);

  let pageIndex = 0;

  const message = await interaction.editReply({
    embeds: [buildScheduleEmbed(pages, pageIndex)],
    components:
      pages.length > 1 ? [buildPagerRow(pageIndex, pages.length)] : [],
  });

  if (pages.length <= 1) return;

  const collector = message.createMessageComponentCollector({
    time: 2 * 60 * 1000,
  });

  collector.on("collect", async (btn) => {
    if (btn.user.id !== interaction.user.id) {
      return btn.reply({
        content: "Only the command user can page this.",
        ephemeral: true,
      });
    }

    if (btn.customId === "schedule_prev") pageIndex--;
    if (btn.customId === "schedule_next") pageIndex++;

    await btn.update({
      embeds: [buildScheduleEmbed(pages, pageIndex)],
      components: [buildPagerRow(pageIndex, pages.length)],
    });
  });
}

module.exports = { handleScheduleCommand };
