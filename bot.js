const { SlashCommandBuilder } = require('@discordjs/builders');
const { token, api } = require('./config.json');
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
      )
      .addStringOption(option =>
        option.setName('units')
          .setDescription('Celsius? Fahrenheit??')
          .setRequired(true)
          .addChoices(
              { name: 'Celsius', value: 'metric'},
              { name: 'Fahrenheit', value: 'imperial'}
      )
    ),
    new SlashCommandBuilder()
      .setName('wind')
      .setDescription('Gets the current wind information')
      .addStringOption(option =>
        option.setName('id')
          .setDescription('Enter a location')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('units')
          .setDescription('km/h? m/s? mph?')
          .setRequired(true)
          .addChoices(
              { name: 'km/h', value: 'km'},
              { name: 'm/s', value: 'm'},
              { name: 'mph', value: 'mi'}
          )
        ),
    new SlashCommandBuilder()
      .setName('conditions')
      .setDescription('Gets the current weather conditions')
      .addStringOption(option =>
        option.setName('id')
          .setDescription('Enter a location')
          .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('sun')
        .setDescription('Gets the sunrise and sunset times')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('Enter a location')
            .setRequired(true)
          ),
    new SlashCommandBuilder()
      .setName('info')
      .setDescription('Information about Atmosbot'),
    new SlashCommandBuilder()
      .setName('commands')
      .setDescription('List of commands'),
    new SlashCommandBuilder()
      .setName('weather')
      .setDescription('The weather')
      .addStringOption(option =>
        option.setName('id')
          .setDescription('Enter a location')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('units')
          .setDescription('Celsius? Fahrenheit??')
          .setRequired(true)
          .addChoices(
              { name: 'Celsius', value: 'metric'},
              { name: 'Fahrenheit', value: 'imperial'}
          )
      )
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
  // temp
  if (commandName === 'temp') {
    const id = interaction.options.getString('id'); // location name
    const units = interaction.options.getString('units');
    let unit;
    if (units === 'metric') {
      unit = '°C'
    } else {
      unit = '°F'
    }

    try {
      const req = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${id}&units=${units}&appid=${api}`);
      if (!req.ok) throw new Error(`HTTP error ${req.status}`);
      const data = await req.json();
      const temp = data.main.temp; // temperature
      const city = data.name; //  location name from API
      const country = data.sys.country; // country
      const highTemp = data.main.temp_max; // high temperature
      const lowTemp = data.main.temp_min; // low temperature
      const feelsLike = data.main.feels_like // feels like
    
      await interaction.reply(`## ${city}, ${country} Weather:\nCurrent Temperature: ${temp} ${unit}\nFeels like: ${feelsLike} ${unit}\nLow: ${lowTemp} ${unit}\nHigh: ${highTemp} ${unit}`);
      
    } catch (error) {
      console.error(error);
      await interaction.reply('Error: Location not found.');
    }
  }

  // wind
  if (commandName === 'wind') {
    const id = interaction.options.getString('id');
    const units = interaction.options.getString('units');
    let metOrImp;
    let windspeed;
    let unit;
    if (units === 'km') {
      unit = 'km/h';
      metOrImp = 'metric'
    } else if (units === 'm') {
      unit = 'm/s';
      metOrImp = 'metric'
    } else if (units === 'mi') {
      unit = 'mph';
      metOrImp = 'imperial'
  }


  try {
    const req = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${id}&units=${metOrImp}&appid=${api}`);
    if (!req.ok) throw new Error(`HTTP error ${req.status}`);
    const data = await req.json();
    const speed = data.wind.speed;
    const city = data.name;
    const country = data.sys.country;
    const deg = data.wind.deg;
    if (units === 'km') {
      windspeed = (speed * 3.6)
    } else {
      windspeed = speed
    }

    await interaction.reply(`## ${city}, ${country} Weather:\nCurrent Wind Speed: ${windspeed} ${unit}\nDirection: ${deg} degrees`);
    
  } catch (error) {
    console.error(error);
    await interaction.reply('Error: Location not found.');
  }
}

  // conditions
  if (commandName === 'conditions') {
    const id = interaction.options.getString('id');

    try {
      const req = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${id}&units=metric&appid=${api}`);
      if (!req.ok) throw new Error(`HTTP error ${req.status}`);
      const data = await req.json();
      const city = data.name;
      const country = data.sys.country;
      const cond = data.weather[0].main;
      const condDesc = data.weather[0].description;

      await interaction.reply(`## ${city}, ${country} Weather:\n${cond}\n${condDesc}`);
    } catch (error) {
      console.error(error);
      await interaction.reply('Error: Location not found.');
    }
  }
  
  // sun
  if (commandName === 'sun') {
    const id = interaction.options.getString('id')

    try {
      const req = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${id}&units=metric&appid=${api}`);
      if (!req.ok) throw new Error(`HTTP error ${req.status}`);
      const data = await req.json();
      const city = data.name;
      const country = data.sys.country;
      const sunrisesec = new Date(data.sys.sunrise * 1000);
      const sunsetsec = new Date(data.sys.sunset * 1000);
      const sunrise = sunrisesec.toUTCString();
      const sunset = sunsetsec.toUTCString();

      await interaction.reply(`## ${city}, ${country} Sun:\nSunrise: ${sunrise}\nSunset: ${sunset}`);
    } catch (error) {
      console.error(error);
      await interaction.reply('Error: Location not found.');
    }
  }

  // info
  if (commandName === 'info') {
    await interaction.reply(`Greetings!\nAtmosbot is a Discord.js bot that gets and sends weather data from OpenWeather.\nMy code is publicly available on GitHub!\nBugs? Issues? Suggestions? Please submit a GitHub issue.`)
  }

  // weather
  if (commandName === 'weather') {
    const id = interaction.options.getString('id')
    const units = interaction.options.getString('units');
    let unit;
    let speedunit;
    if (units === 'metric') {
      unit = '°C'
      speedunit = 'm/s'
    } else {
      unit = '°F'
      speedunit = 'mph'
    }

    try {
      const req = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${id}&units=${units}&appid=${api}`);
      if (!req.ok) throw new Error(`HTTP error ${req.status}`);
      const data = await req.json();
      const temp = data.main.temp;
      const city = data.name;
      const country = data.sys.country;
      const cond = data.weather[0].main;
      const condDesc = data.weather[0].description;
      const highTemp = data.main.temp_max;
      const lowTemp = data.main.temp_min;
      const feelsLike = data.main.feels_like
      const speed = data.wind.speed;
      const deg = data.wind.deg;
      const sunrisesec = new Date(data.sys.sunrise * 1000);
      const sunsetsec = new Date(data.sys.sunset * 1000);
      const sunrise = sunrisesec.toUTCString();
      const sunset = sunsetsec.toUTCString();
      
    
      await interaction.reply(`## ${city}, ${country} Weather:\n### Conditions\n${cond}\n${condDesc}\n### Temperature\nCurrent: ${temp} ${unit}\nFeels like: ${feelsLike} ${unit}\nLow: ${lowTemp} ${unit}\nHigh: ${highTemp} ${unit}\n### Wind\nSpeed: ${speed} ${speedunit}\nDirection: ${deg} degrees\n### Sun\nSunrise: ${sunrise}\nSunset: ${sunset}`);
      
    } catch (error) {
      console.error(error);
      await interaction.reply('Error: Location not found.');
    }
  }
  // commands
  if (commandName === 'commands') {
    await interaction.reply(`## Commands:\n/temp: Gets the current temperature\n/wind: Gets the current wind information\n/conditions: Gets the current weather conditions\n/sun: Gets the sunrise and sunset times.\n/info: Information about Atmosbot\n/commands: List of commands (this!)\n/weather: The weather`)
  }
});

client.login(token);
