if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
} = require("discord.js");
const { fetchSchedule } = require("./api");
const { handleScheduleCommand } = require("./schedule");
const { startDailyAnnouncements, postTodayNow } = require("./daily");

const fs = require("fs");
const path = require("path");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");

function withTimeout(promise, ms, label = "operation") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  startDailyAnnouncements(client);
});

client.on("error", console.error);
client.on("shardError", console.error);

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "schedule") {
      await interaction.deferReply();
      const events = await fetchSchedule();
      await handleScheduleCommand(interaction, events);
      return;
    }

    if (interaction.commandName === "image") {
      const name = interaction.options.getString("name").toLowerCase();
      const imageRoot = path.join(__dirname, "images");
      const dir = path.join(imageRoot, name);

      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        return interaction.reply({
          content: `❌ No images found for **${name}**.`,
          ephemeral: true,
        });
      }

      const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
      const files = fs
        .readdirSync(dir)
        .filter((f) => allowedExts.includes(path.extname(f).toLowerCase()));

      if (!files.length) {
        return interaction.reply({
          content: `❌ No images found for **${name}**.`,
          ephemeral: true,
        });
      }

      // pick one at random
      const pick = files[Math.floor(Math.random() * files.length)];
      const filePath = path.join(dir, pick);

      const attachment = new AttachmentBuilder(filePath, { name: pick });

      const embed = new EmbedBuilder()
        .setTitle(name.charAt(0).toUpperCase() + name.slice(1))
        .setImage(`attachment://${pick}`);

      return interaction.reply({
        embeds: [embed],
        files: [attachment],
      });
    }

    if (interaction.commandName === "post-today") {
      // runtime enforcement (in addition to Discord's default perms)
      if (
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({ content: "Admins only.", ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const result = await withTimeout(
        postTodayNow(client),
        15_000,
        "postTodayNow",
      );

      if (!result.posted) {
        return interaction.editReply(`No post sent: ${result.reason}`);
      }

      return interaction.editReply(
        `✅ Posted today’s schedule (${result.count} event(s)) in the announcement channel.`,
      );
    }
  } catch (err) {
    console.error(err);

    const msg = `⚠️ ${err?.message ?? "Something went wrong."}`;
    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(msg);
      } else {
        await interaction.reply({ content: msg, ephemeral: true });
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
