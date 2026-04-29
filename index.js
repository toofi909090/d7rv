const { token, owners, prefix } = require("./config.json");
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const fs = require('fs');
const Discord = require('discord.js');
const path = require('path');
const config = require("./config");
const { QuickDB } = require("quick.db");
const { GlobalFonts } = require("canvas-constructor/napi-rs");
const ms = require("ms");
const colors = require("colors");

GlobalFonts.registerFromPath(process.cwd() + "./Al Qabas Bold.ttf", "cairo");
GlobalFonts.registerFromPath(process.cwd() + "./Emojis.ttf", "Emojis");

const dbq = new QuickDB();

const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const has_play = new Map();
let gameRunning = false;
let times = false;

function isGameRunning() {
  return gameRunning;
}

function setGameRunning(state) {
  gameRunning = state;
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.execute) {
    command.execute(client, dbq, has_play, config, {
      isGameRunning,
      setGameRunning,
      times,
      setTimes: (value) => times = value,
      owners,
      prefix,
      timeout,
      Discord,
      EmbedBuilder,
      ActionRowBuilder,
      ButtonBuilder,
      ButtonStyle,
      PermissionsBitField,
      ms,
      fs,
      path
    });
  }
}


require('./helpers/gif-shop-system');



client.on("ready", () => {
  const botId = client.user.id;
  config.botId = `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=8&scope=bot`;
  console.log(`Client Ready Bot On ${client.user.tag}`.red);
  console.log(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`.bgGreen);
});
client.on('ready', async () => {
  try {
    let activity = await dbq.get(`activity_${client.user.id}`);
    if (!activity) {
      activity = { 
        name: "Security", 
        type: Discord.ActivityType.Streaming, 
        url: "https://www.twitch.tv/#$" 
      };
    }
    client.user.setActivity(activity);
    console.log(`Discord.gg/NJJM\n\nDevloped By 2ht | Winny | NJM Team`.green);
     
  } catch (error) {
    console.log('Error In The Activity:', error.message);
  }
  setInterval(async () => {
    try {
     
      if (!client.isReady() || !client.user || client.ws.status !== 0) {
        return;
      }

      let activity = await dbq.get(`activity_${client.user.id}`);
      let existActivity = client.user.presence.activities[0];
      
      if (!activity) {
        activity = { 
          name: "Security", 
          type: Discord.ActivityType.Streaming, 
          url: "https://www.twitch.tv/#$" 
        };
      }
      
     
      if (existActivity && 
          existActivity.name === activity.name && 
          existActivity.type === activity.type) {
        return;
      }
      
      client.user.setActivity(activity);
    } catch (error) {
      console.log('❌ خطأ في تحديث الـ Activity:', error.message);
    }
  }, 300000);
});


client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.content === `<@${client.user.id}>`) {
    message.reply({ content: `**Hello My prefix is ${prefix}**` });
  }
});


client.on("guildCreate", async (guild) => {
  try {
    const owner = await guild.fetchOwner();
    let privetch = client.channels.cache.get("1205043952017870858");
    let addembed = new EmbedBuilder()
      .setTitle("Joined new guild 🛒")
      .setDescription(`**Guild name:** ${guild.name} \n **Members:** ${guild.memberCount} \n **Guild ID:** ${guild.id} \n **Owner:** <@${owner.user.id}>`)
      .setThumbnail(guild.iconURL());

    if (privetch) {
      privetch.send({ embeds: [addembed] });
    }
  } catch (error) {
    console.error('An error occurred while sending the join message:', error);
  }
});

client.on("guildDelete", async (guild) => {
  try {
    let privetch = client.channels.cache.get("1207604124032569426");
    const owner = await guild.fetchOwner();
    let removeembed = new EmbedBuilder()
      .setTitle("Left a guild 🛒")
      .setDescription(`**Guild name:** ${guild.name} \n **Members:** ${guild.memberCount} \n **Guild ID:** ${guild.id} \n **Owner:** <@${owner.user.id}>`)
      .setThumbnail(guild.iconURL());

    if (privetch) {
      privetch.send({ embeds: [removeembed] });
    }
  } catch (error) {
    console.error('An error occurred while sending the leave message:', error);
  }
});


process.on("uncaughtException", error => {
  console.log(error);
  return;
});

process.on("unhandledRejection", error => {
  console.log(error);
  return;
});

process.on("rejectionHandled", error => {
  console.log(error);
  return;
});


require("dotenv").config();
require('events').EventEmitter.defaultMaxListeners = 120;
client.login(token);

process.on("unhandledRejection", (reason, promise) => { return })
 process.on("uncaughtException", (err, origin) => { return })
 process.on('uncaughtExceptionMonitor', (err, origin) => { return });
 process.on('multipleResolves', (type, promise, reason) => { return })
 