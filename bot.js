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
});





client.login(token);
