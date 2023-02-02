const fs = require('fs')
const path = require('path')
const { REST, Routes } = require('discord.js')

module.exports = async function(client) {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  const commands = []

  for await(const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath)

    if ('data' in command) {
      commands.push(command.data.toJSON())
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" property`)
    }

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  async function register() {
    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      const data = await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands },
      )

      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      console.error(error);
    }
  }
  register()
}