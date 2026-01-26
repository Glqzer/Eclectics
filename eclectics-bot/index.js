require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { fetchSchedule } = require("./api");
const { handleScheduleCommand } = require("./schedule");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "schedule") {
    await interaction.deferReply();
    const events = await fetchSchedule();
    await handleScheduleCommand(interaction, events);
  }
});

client.login(process.env.DISCORD_TOKEN);
