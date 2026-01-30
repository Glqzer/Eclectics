require("dotenv").config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("Show the upcoming schedule (paginated)"),

  new SlashCommandBuilder()
    .setName("post-today")
    .setDescription("Admin: post today's schedule to the announcement channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log("✅ Registered guild commands");
})();
