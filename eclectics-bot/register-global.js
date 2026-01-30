require("dotenv").config();
const { REST, Routes, SlashCommandBuilder, InteractionContextType } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("image")
    .setDescription("Send an image by name")
    .addStringOption(opt =>
      opt.setName("name").setDescription("Image name").setRequired(true)
    )
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ]),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
    { body: commands }
  );
  console.log("✅ Registered global /image command");
})();
