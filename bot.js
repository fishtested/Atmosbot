const { SlashCommandBuilder } = require('@discordjs/builders');
const { token } = require('./config.json');
const { Client, Events, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async readyClient => {
  console.log(`Connected as ${readyClient.user.tag}!`);
  await registerCommands();
});


async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('temp')
      .setDescription('Gets the current temperature')
      .addStringOption(option =>
        option.setName('id')
          .setDescription('Enter a location')
          .setRequired(true)
      ),
  ].map(cmd => cmd.toJSON());

  try {
    await client.application.commands.set(commands);
    console.log('Commands registered');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}



client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'temp') {
    const id = interaction.options.getString('id'); // location name
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${id}&units=metric&appid=`); // I removed the API key
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      const temp = data.main.temp; // temperature
      const city = data.name; //  location name from API
      const country = data.sys.country; // country
      const highTemp = data.main.temp_max; // high temperature
      const lowTemp = data.main.temp_min; // low temperature
    
      await interaction.reply(`## ${city}, ${country} Weather:\nCurrent Temperature: ${temp} °C\nLow: ${lowTemp} °C\nHigh: ${highTemp} °C`);
      
    } catch (error) {
      console.error(error);
      await interaction.reply('Error: Location not found.');
    }
  }
});


  

client.login(token);
