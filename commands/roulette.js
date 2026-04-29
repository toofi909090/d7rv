const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const { Canvas } = require("canvas-constructor/napi-rs");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { createRouletteGifImage, createRouletteImage, shuffleArray: pkgShuffleArray } = require('../pkg.js');
const { 
  showShop, 
  showBag, 
  showStats, 
  useSelectedItem, 
  getUserPointsEmoji,
  checkStealth, 
  checkLinked, 
  applyLinkEffect, 
  cleanupGameData, 
  filterStealthPlayers, 
  addAbilityButtons, 
  handleAbilityUsage 
} = require('./njm.js');
const { GifShopSystem, addGifShopButtonToRoulette, setupGifShopCommands } = require('./gif-shop-system.js');
const fs = require('fs');


function shuffleArray(arr, specific_num = null) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  
  const shuffled = [...arr];
  const timestamp = Date.now();
  const performanceNow = typeof performance !== 'undefined' ? performance.now() : Date.now();
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const seed1 = Math.sin(timestamp * Math.random() * (i + 1)) * 10000;
    const seed2 = Math.cos(performanceNow * Math.random() * (i + 1)) * 10000;
    const combinedSeed = Math.abs(seed1 + seed2);
    const j = Math.floor((combinedSeed % 1) * (i + 1));
    
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  if (specific_num !== null && specific_num > 0) {
    const validNumber = Math.min(specific_num, shuffled.length);
    return [
      ...shuffled.slice(shuffled.length - validNumber),
      ...shuffled.slice(0, shuffled.length - validNumber)
    ];
  }
  
  return shuffled;
}

const safeShuffleArray = pkgShuffleArray || shuffleArray;

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord, ms } = utils;


  const gifShop = GifShopSystem.integratWithRouletteShop(client, dbq, has_play, config, utils);
  setupGifShopCommands(client, dbq, utils);


  const activeInteractions = new Map();


  function isValidInteraction(interaction) {
    try {
      if (!interaction || !interaction.user || !interaction.guild) {
        return false;
      }
      
      const now = Date.now();
      const interactionTime = interaction.createdTimestamp;
      const maxAge = 3 * 60 * 1000;
      
      if (now - interactionTime > maxAge) {
        console.warn('Interaction expired in roulette');
        return false;
      }
      
      const interactionId = `${interaction.id}_${interaction.user.id}`;
      if (activeInteractions.has(interactionId)) {
        console.warn('Interaction already being processed in roulette');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking interaction validity in roulette:', error);
      return false;
    }
  }


  function markInteractionActive(interaction) {
    const interactionId = `${interaction.id}_${interaction.user.id}`;
    activeInteractions.set(interactionId, Date.now());
    
    setTimeout(() => {
      activeInteractions.delete(interactionId);
    }, 5 * 60 * 1000);
  }


  async function safeInteractionReply(interaction, options) {
    try {
      if (!isValidInteraction(interaction)) {
        return null;
      }
      
      markInteractionActive(interaction);
      
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply(options);
      } else if (interaction.deferred) {
        return await interaction.editReply(options);
      } else if (interaction.replied) {
        return await interaction.editReply(options);
      }
      
      return null;
    } catch (error) {
      console.error('Error in safeInteractionReply:', error);
      return null;
    }
  }


  async function safeDeferUpdate(interaction) {
    try {
      if (!isValidInteraction(interaction)) {
        return false;
      }
      
      if (interaction.replied || interaction.deferred) {
        return true;
      }
      
      await interaction.deferUpdate();
      return true;
    } catch (error) {
      console.error('Error in safeDeferUpdate:', error);
      return false;
    }
  }

  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "روليت") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) return;
      
      if (has_play.get(message.guild.id)) return message.reply({ content: `🛑 - هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      
      const storedTime = await dbq.get(`timerroulette_${message.author.id}`) || 60000;
      let time = storedTime;
      let data = {
        author: message.author.id,
        players: [],
        removedPlayers: [],
        start_in: Date.now() + time,
        type: "roulette"
      };
      const playerNumber = await dbq.get(`playersCount_${message.guild.id}`) || 20;

      let attachment;
      const image = `./imager/ruolateimage_${message.guild.id}.png`;
      
      try {
        if (fs.existsSync(image)) {
          attachment = new AttachmentBuilder(image);
        } else {
          throw new Error('File not found');
        }
      } catch (error) {
        attachment = new AttachmentBuilder(`./photo/rullate.png`);
      }

      let backgroundColorDB = await dbq.get(`backgroundColor_${message.guild.id}`);
      let textColorDB = await dbq.get(`textColor_${message.guild.id}`);
      const roulettecolors = [backgroundColorDB, textColorDB];

      let counter = 0;
      let content_time1 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`
      let content_players1 = `**(${counter} / ${playerNumber})**`;

      const roluToN = await dbq.get(`numberSetting_${message.guild.id}`);

      async function createButtonsWithNumbers(data) {
        let buttons = [];
        for (let i = 1; i <= playerNumber; i++) {
          const isNumberTaken = data.players.some(player => player.number == i);
          if (!isNumberTaken) {
            buttons.push(
              createButton("SECONDARY", `number_${i}`, `${i}`)
            );
          }
        }
      
        buttons.push(
          createButton("SECONDARY", "left_roulette", `خروج`, '1430688411622182942')
        );
      
        return buttons;
      }

      let numberButtons = await createButtonsWithNumbers(data);

      let rows = [];
      for (let i = 0; i < numberButtons.length; i += 5) {
        rows.push(new ActionRowBuilder().addComponents(numberButtons.slice(i, i + 5)));
      }

      let row;
      if (roluToN) {
        row = rows;
      } else {
        row = [
          new ActionRowBuilder().addComponents(
            createButton("SECONDARY", `join_roulette`, `دخول`, '1430687527748239420'),
            createButton(`SECONDARY`, `left_roulette`, `خروج`, '1430688411622182942'),
            createButton('SECONDARY', `shop_roulette`, `المتجر`, `1400205006946308268`),
            createButton('SECONDARY', `bag_roulette`, `الحقيبة`, `1430692083420889280`)
          ),
          new ActionRowBuilder().addComponents(
            createButton('SECONDARY', `stats_roulette`, `إحصائياتك`, `1400205434396348438`),
            addGifShopButtonToRoulette()
          )
        ];
      }
      
      let msg = await message.channel.send({ content: `${content_time1}\n${content_players1}`, files: [attachment], components: row }).catch(() => 0);
      if (!msg) return;
      has_play.set(message.guild.id, data);
      let start_c = msg.createMessageComponentCollector({ time: time });

      async function updateCounter() {
        let data = has_play.get(message.guild.id);
        if (!data) return;
        let counter = data.players.length;
        let content_players2 = `**(${counter} / ${playerNumber})**`;
        try {
          await msg.edit({ content: `${content_time1}\n${content_players2}`, components: row });
        } catch (error) {
          console.error('Error updating counter:', error);
        }
      }

      start_c.on("collect", async inter => {
        try {
          if (!has_play.get(message.guild.id)) return;
          
          if (!isValidInteraction(inter)) {
            console.warn('Invalid interaction in start collector');
            return;
          }

          let data = has_play.get(message.guild.id);
      
          if (inter.customId.startsWith("number_")) {
              let number = inter.customId.split("_")[1];
              if (data.players.find(u => u.id == inter.user.id)) {
                return await safeInteractionReply(inter, { content: `لقد سجلت بالفعل.`, ephemeral: true });
              }
              if (data.players.length >= playerNumber) {
                return await safeInteractionReply(inter, { content: `عدد المشاركين مكتمل`, ephemeral: true });
              }
              const avatarUrl = await inter.user.displayAvatarURL({ extension: "png", format: 'png', size: 512, forceStatic: true });
              data.players.push({
                  number: number,
                  id: inter.user.id,
                  username: inter.user.username,
                  avatar: avatarUrl
              });
      
              has_play.set(message.guild.id, data);
      
              let user = await client.users.fetch(inter.user.id);
              let buttonIndex = parseInt(number) - 1;
              numberButtons[buttonIndex].setLabel(user.displayName);
              numberButtons[buttonIndex].setDisabled(true);
      
              await updateCounter();
              await safeInteractionReply(inter, { content: `✅ تم إضافتك للعبة بنجاح`, ephemeral: true });
      
          } else if (inter.customId === "join_roulette") {
            if (data.players.find(u => u.id == inter.user.id)) {
              return await safeInteractionReply(inter, { content: `لقد سجلت بالفعل.`, ephemeral: true });
            }
            if (data.players.length >= playerNumber) {
              return await safeInteractionReply(inter, { content: `عدد المشاركين مكتمل`, ephemeral: true });
            }
        
            const avatarURL = await inter.user.displayAvatarURL({ extension: "png", format: 'png', size: 512, forceStatic: true });
        
            let availableNumber = 1;
            while (data.players.some(player => player.number == availableNumber)) {
              availableNumber++;
            }
        
            data.players.push({
              number: availableNumber,
              id: inter.user.id,
              username: inter.user.username,
              avatar: avatarURL
            });
        
            has_play.set(message.guild.id, data);
        
            await updateCounter();
        
            await safeInteractionReply(inter, { content: `✅ تم إضافتك للعبة بنجاح`, ephemeral: true });
          } else if (inter.customId === "left_roulette") {
            if (data.players.find(u => u.id == inter.user.id)) {
              let index = data.players.findIndex(i => i.id == inter.user.id);
              if (index == -1) {
                return await safeInteractionReply(inter, { content: `❌ - انت غير مشارك بالفعل`, ephemeral: true });
              }
        
              let removedPlayer = data.players.splice(index, 1)[0];
              data.removedPlayers.push(removedPlayer);
              has_play.set(message.guild.id, data);
              let buttonIndex = parseInt(removedPlayer.number) - 1;
              if (removedPlayer) {
                numberButtons[buttonIndex].setLabel(removedPlayer.number);
                numberButtons[buttonIndex].setDisabled(false);
        
                await updateCounter();
        
                await safeInteractionReply(inter, { content: `✅ تم إزالتك من اللعبة`, ephemeral: true });
              } else {
                data.players.splice(index, 1);
                has_play.set(message.guild.id, data);
        
                await updateCounter();
        
                await safeInteractionReply(inter, { content: `✅ تم إزالتك من اللعبة`, ephemeral: true });
              }
            }
          } else if (inter.customId == "explain") {
            await safeInteractionReply(inter, {
              content: `
            **طريقة اللعب:**
            1- ستبدأ الجولة الأولى وسيتم تدوير العجلة واختيار لاعب عشوائي
            2- إذا كنت اللاعب المختار ، فستختار لاعبًا من اختيارك ليتم طرده من اللعبة
            3- يُطرد اللاعب وتبدأ جولة جديدة ، عندما يُطرد جميع اللاعبين ويتبقى لاعبان فقط ، ستدور العجلة ويكون اللاعب المختار هو الفائز باللعبة`, ephemeral: true
            });
          } else if (inter.customId == "shop_roulette") {
            await showShop(inter, dbq);
          } else if (inter.customId == "bag_roulette") {
            await showBag(inter, dbq);
          } else if (inter.customId == "stats_roulette") {
            await showStats(inter, dbq, message.guild.id);
          } else if (inter.customId === "gif_shop_roulette") {

          }
        } catch (error) {
          console.error('Error in start collector:', error);
          try {
            await safeInteractionReply(inter, { content: '❌ حدث خطأ في معالجة طلبك!', ephemeral: true });
          } catch (replyError) {
            console.error('Error sending error reply:', replyError);
          }
        }
      });

      start_c.on("end", async (end, reason) => {
        if (!has_play.get(message.guild.id)) return;

        let content_players4 = `**(${data.players.length} / ${playerNumber})**`;
        await msg.edit({ content: `${content_players4}`, components: [] }).catch(() => 0);

        if (data.players.length < 2) {
          msg.edit({ content: `${content_players4}`, components: [] })
          has_play.delete(message.guild.id);
          return message.channel.send({ content: ' ⛔ - يجب ان تحتوي اللعبه على **3** اشخاص على الاقل لبدء اللعبة .' });
        }

        let clr_num = 0;
        let plys = [];
        let i = 0;
        for (let player of data.players) {
          i += 1;
          clr_num = clr_num >= roulettecolors.length ? 1 : clr_num += 1;
          plys.push({ ...player, position: i - 1, color: roulettecolors[clr_num - 1] });
        }
        data.players = plys;
        has_play.set(message.guild.id, data);
        

        await dbq.set(`current_players_${message.guild.id}`, data.players.map(p => p.id));
        
        message.channel.send({ content: `⏳ تم الانتهاء من تسجيل الارقام ستبدأ الجولة خلال ثواني .` });
        
        setTimeout(() => {
          roulette(message);
        }, 850);
      });

      async function rouletteGif(array, servericon) {
        try {
          if (!array || !Array.isArray(array) || array.length === 0) {
            throw new Error('Players array is empty or invalid');
          }
          
          if (!servericon) {
            servericon = './photo/rullate.png';
          }
          
          const result = await createRouletteGifImage(array, servericon);
          
          return result;
        } catch (error) {
          return null;
        }
      }
      
      async function rouletteImage(array) {
        try {
          if (!array || !Array.isArray(array) || array.length === 0) {
            throw new Error('Players array is empty or invalid');
          }
          
          const result = await createRouletteImage(array);
          return result;
        } catch (error) {
          return null;
        }
      }

      function drawCircularImage(ctx, image, x, y, size, clip = false) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(image, x, y, size, size);
        ctx.restore();
      }

      async function roulette(message) {
        try {
          if (!message || !message.guild) {
            return;
          }
          
          let data = has_play.get(message.guild.id);
          if (!data) {
            return;
          }


          await cleanupGameData(message.guild.id, dbq);

          let backgroundColorDB = await dbq.get(`backgroundColor_${message.guild.id}`);
          let textColorDB = await dbq.get(`textColor_${message.guild.id}`);
          let winner_index = Math.floor(Math.random() * data.players.length);
          let winner = data.players[winner_index];
          
          if (!winner) {
            return;
          }
          
          data.players.splice(winner_index, 1);
          data.players = safeShuffleArray(data.players);
          data.players.push(winner);
          has_play.set(message.guild.id, data);
          
          const players = data.players.map(p => {
            if (p.position % 2 == 0) {
              return { number: p.position, username: p.username, avatarURL: p.avatar, color: backgroundColorDB }
            } else {
              return { number: p.position, username: p.username, avatarURL: p.avatar, color: textColorDB }
            }
          });

          let backgroundImage;
          const image = `./imager/messageimage_${message.guild.id}.png`
          try {
            backgroundImage = await loadImage(image);
          } catch (error) {
            backgroundImage = await loadImage(`./photo/win.png`);
          }

          const avatar = await loadImage(winner.avatar);
          const avatarSize = 720;

          const canvas = createCanvas(2560, 1080);
          const ctx = canvas.getContext('2d');

          ctx.drawImage(backgroundImage, 0, 0, 2560, 1080);

          drawCircularImage(ctx, avatar, 962, 68, avatarSize, true);

          ctx.font = '90px cairo';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          const textName = `${winner.username}`;
          const textX = 275 + avatarSize + 280;
          const textY = 985;

          ctx.fillText(textName, textX, textY + -100);

          const gifPlayers = data.players.map((p, index) => {
            return {
              number: p.position !== undefined ? p.position : index,
              username: p.username || 'Player',
              avatarURL: p.avatar || p.avatarURL || './photo/default-avatar.png',
              color: p.color || (index % 2 === 0 ? backgroundColorDB : textColorDB)
            };
          });

          const gifResult = await rouletteGif(gifPlayers, message.guild.iconURL({ format: 'png', size: 512 }));

          let gifAttachment;
          let gifData = null;
          
          if (gifResult && typeof gifResult === 'object' && gifResult.data) {
            gifData = gifResult.data;
          } else if (gifResult instanceof Buffer || gifResult instanceof ArrayBuffer) {
            gifData = gifResult;
          }

          if (gifData && (gifData instanceof Buffer || gifData instanceof ArrayBuffer)) {
            gifAttachment = new AttachmentBuilder(gifData, { name: `roulette_${message.guild.id}_${Date.now()}.gif` });
          } else {
            try {
              const staticImageResult = await rouletteImage(gifPlayers);
              if (staticImageResult && (staticImageResult instanceof Buffer || staticImageResult instanceof ArrayBuffer)) {
                gifAttachment = new AttachmentBuilder(staticImageResult, { name: 'roulette_static.png' });
              } else {
                const fallbackCanvas = createCanvas(500, 500);
                const fallbackCtx = fallbackCanvas.getContext('2d');
                fallbackCtx.fillStyle = '#2C3E50';
                fallbackCtx.fillRect(0, 0, 500, 500);
                fallbackCtx.fillStyle = '#FFFFFF';
                fallbackCtx.font = '30px cairo';
                fallbackCtx.textAlign = 'center';
                fallbackCtx.fillText('Roulette Loading...', 250, 250);
                
                gifAttachment = new AttachmentBuilder(fallbackCanvas.toBuffer(), { name: 'roulette_loading.png' });
              }
            } catch (fallbackError) {
              if (fs.existsSync('./photo/rullate.png')) {
                gifAttachment = new AttachmentBuilder('./photo/rullate.png', { name: 'emergency_fallback.png' });
              } else {
                throw new Error('No fallback images available');
              }
            }
          }

          let rouletteMsg = await message.channel.send({ files: [gifAttachment] });

          await sleep(1500);

          setTimeout(async () => {
            try {
              let rouletteImageResult = await rouletteImage(gifPlayers);
              
              let imageAttachment;
              if (rouletteImageResult && (rouletteImageResult instanceof Buffer || rouletteImageResult instanceof ArrayBuffer)) {
                imageAttachment = { name: "roulette.png", attachment: rouletteImageResult };
              } else {
                imageAttachment = { name: "roulette.png", attachment: canvas.toBuffer() };
              }

              const canvasAttachment = new AttachmentBuilder(canvas.toBuffer(), { name: `roulette.png` });

              if (data.players.length <= 2) {
                
                const play = `${winner.id}`
let roulettePoints = await dbq.get(`roulette_points_${message.guild.id}.${play}`);

if (roulettePoints === null || roulettePoints === undefined) {
  roulettePoints = 0;
}

roulettePoints += 1;
await dbq.set(`roulette_points_${message.guild.id}.${play}`, roulettePoints);

let stats = await dbq.get(`roulette_stats_${message.guild.id}.${winner.id}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
stats.wins++;
await dbq.set(`roulette_stats_${message.guild.id}.${winner.id}`, stats);


const currentRoulettePoints = await dbq.get(`roulette_points_${message.guild.id}.${play}`) || 0;


const winnerEmoji = await getUserPointsEmoji(winner.id, message.guild.id, dbq);

let row_2 = new ActionRowBuilder()
  .addComponents(
    createButton("SECONDARY", "total_roulette_points", `${winnerEmoji} ${currentRoulettePoints}`, null, true)
    
  );

                await rouletteMsg.edit({ content: `🏆 | الجولة القادمة هي الاخيرة من تختاره العجلة يفوز باللعبة .`, files: [imageAttachment] });
                await sleep(1500);
                const roleEnabled = await dbq.get(`hereRoleEnabled_${message.guild.id}`) || false;

                if (roleEnabled) {
                  message.channel.send({ files: [canvasAttachment], components: [row_2], content: `🏆 | <@${winner.id}> | @here` });
                } else {
                  message.channel.send({ files: [canvasAttachment], components: [row_2], content: `🏆 | <@${winner.id}>` });
                }
                

                await cleanupGameData(message.guild.id, dbq);
                await dbq.delete(`current_players_${message.guild.id}`);
                has_play.delete(message.guild.id);
              } else {
                
                await rouletteMsg.edit({ content: `**${winner.number} - <@${winner.id}>**`, files: [imageAttachment] });
                

                const visiblePlayers = await filterStealthPlayers(
                  data.players.filter(a => a.id != winner.id), 
                  message.guild.id, 
                  dbq, 
                  winner.id
                );
                
                let buttons_array = await Promise.all(visiblePlayers.map(async (p) => {
                  const playersCount = await dbq.get(`playersCount_${message.guild.id}`) || 20;
                  const usedNumbers = new Set();
                  let playerNumbers = Math.floor(Math.random() * playersCount) + 1;

                  while (usedNumbers.has(playerNumbers)) {
                    playerNumbers = Math.floor(Math.random() * playersCount) + 1;
                  }
                
                  usedNumbers.add(playerNumbers);
                  let player = await client.users.fetch(p.id);
                  return {
                    id: p.id,
                    label: `${p.number !== undefined ? p.number : playerNumbers} - ${player.displayName}`,
                    disabled: false,
                    emoji: null
                  }
                }));

                let kick_random = await dbq.get(`kick_random_${message.guild.id}`);
                if (kick_random === null) kick_random = true;
            
                if (kick_random) {
                  buttons_array.push({
                      id: "kick_random",
                      label: "طرد عشوائي",
                      setEmoji: "<:exchange:1304155528255111230>",
                      style: ButtonStyle.Primary,
                      disabled: false
                  });
                }
            
                buttons_array.push({
                    id: winner.id,
                    label: "انسحاب",
                    setEmoji: "<:logout:1399026943449628773>>",
                    style: ButtonStyle.Danger,
                    disabled: false
                });


                const canRevive = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_revive_check', { removedPlayers: data.removedPlayers });
                const canBomb = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_bomb_check', { players: data.players });
                const canSnipe = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_snipe_check', { players: data.players });
                const canHack = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_hack_check', { players: data.players });
                const canStealth = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_stealth_check', { players: data.players });
                const canLink = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_link_check', { players: data.players });
                const canReveal = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_reveal_check', { players: data.players });
                const canDisable = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_disable_check', { players: data.players });
            
                const existingMessage = await message.channel.send({
                    content: `<@${winner.id}>  🦵لديك **15** ثانية لاختيار لاعب لطرده \n⏱️ الوقت يبدأ الآن!`,
                    components: await createMultipleButtons(buttons_array, winner, message.guild.id)
                });

                let itemsMessage = null;
                const itemButtons = [];
                

                if (canRevive === 'can_revive') {
                  itemButtons.push({
                    id: "item_revive",
                    label: "إنعاش",
                    setEmoji: "<:revive:1399028791233216523>",
                    style: ButtonStyle.Secondary,
                    disabled: false
                  });
                }

                if (canBomb === 'can_bomb') {
                  itemButtons.push({
                    id: "item_bomb",
                    label: "قنبلة", 
                    setEmoji: "<:metrics:1399028793808781383>",
                    style: ButtonStyle.Secondary,
                    disabled: false
                  });
                }


                if (canSnipe === 'can_snipe') {
                  itemButtons.push({
                    id: "item_snipe",
                    label: "قنص",
                    setEmoji: "<:sniper:1399028789991542784>",
                    style: ButtonStyle.Secondary,
                    disabled: false
                  });
                }

                if (canHack === 'can_hack') {
                  itemButtons.push({
                    id: "item_hack",
                    label: "تهكير",
                    setEmoji: "<:hack:1399028792762863616>",
                    style: ButtonStyle.Secondary,
                    disabled: false
                  });
                }

                if (canStealth === 'can_stealth') {
                  itemButtons.push({
                    id: "item_stealth",
                    label: "إخفاء",
                    setEmoji: "<:stealth:1399028790612484126>",
                    style: ButtonStyle.Secondary,
                    disabled: false
                  });
                }

                if (canLink === 'can_link') {
                  itemButtons.push({
                    id: "item_link",
                    label: "ربط",
                    setEmoji: "<:link:1399028787219947532>",
                    style: ButtonStyle.Secondary,
                    disabled: false
                  });
                }

                if (canReveal === 'can_reveal') {
                  itemButtons.push({
                    id: "item_reveal",
                    label: "كشف",
                    setEmoji: "<:reveal:1399028794291187712>",
                    style: ButtonStyle.Secondary,
                    disabled: false
                  });
                }

                if (canDisable === 'can_disable') {
                  itemButtons.push({
                    id: "item_disable",
                    label: "منع",
                    setEmoji: "<:disable:1399028795658694656>",
                    style: ButtonStyle.Secondary,
                    disabled: false
                  });
                }

                if (itemButtons.length > 0) {
                  const itemRows = [];
                  for (let i = 0; i < itemButtons.length; i += 5) {
                    const row = itemButtons.slice(i, i + 5).map(btn => 
                      new ButtonBuilder()
                        .setCustomId(btn.id)
                        .setLabel(btn.label)
                        .setStyle(btn.style)
                        .setDisabled(btn.disabled)
                    );
                    itemRows.push(new ActionRowBuilder().addComponents(row));
                  }

                  itemsMessage = await message.channel.send({
                    content: `🎒 **${winner.username}** - العناصر والقدرات المتاحة لديك:`,
                    components: itemRows
                  });
                }

                let collect = null;
                const timeout = 30000;

                try {
                  const promises = [
                    existingMessage.awaitMessageComponent({
                      filter: m => m.user.id == winner.id,
                      time: timeout
                    })
                  ];

                  if (itemsMessage) {
                    promises.push(
                      itemsMessage.awaitMessageComponent({
                        filter: m => m.user.id == winner.id && m.customId.startsWith('item_'),
                        time: timeout
                      })
                    );
                  }

                  collect = await Promise.race(promises);
                } catch (error) {
                  collect = null;
                }
            
                if (!has_play.get(message.guild.id)) return;
            
                buttons_array = buttons_array.map(e => ({ ...e, disabled: true }));
                await existingMessage.edit({ components: await createMultipleButtons(buttons_array, winner, message.guild.id) }).catch(() => 0);
                if (itemsMessage) {
                  await itemsMessage.edit({ components: [] }).catch(() => 0);
                }
            
                let choice;
                if (!collect || !collect.customId) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    choice = winner.id;
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    message.channel.send({ content: `💣 | تم طرد <@${winner.id}> من اللعبة لعدم تفاعله ، سيتم بدء الجولة القادمة في بضع ثواني...` });
                    data.removedPlayers = [...data.removedPlayers, { id: choice, username: winner.username, position: winner.position }];
                    
                    let stats = await dbq.get(`roulette_stats_${message.guild.id}.${winner.id}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
                    stats.kicked++;
                    await dbq.set(`roulette_stats_${message.guild.id}.${winner.id}`, stats);


                    await applyLinkEffect(winner.id, message.guild.id, dbq, data);
                    has_play.set(message.guild.id, data);
                    
                } else if (collect.customId == winner.id) {
                    await safeDeferUpdate(collect);
                    choice = winner.id;
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    message.channel.send({ content: `💣 | لقد انسحب <@${winner.id}> من اللعبة ، سيتم بدء الجولة القادمة في بضع ثواني...` });
                    data.removedPlayers = [...data.removedPlayers, { id: choice, username: winner.username, position: winner.position }];
                    
                    let stats = await dbq.get(`roulette_stats_${message.guild.id}.${winner.id}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
                    stats.withdrawals++;
                    await dbq.set(`roulette_stats_${message.guild.id}.${winner.id}`, stats);


                    await applyLinkEffect(winner.id, message.guild.id, dbq, data);
                    has_play.set(message.guild.id, data);
                    
                } else if (collect.customId == "kick_random") {
                  await safeDeferUpdate(collect);
                  let randomIndex = Math.floor(Math.random() * (data.players.length - 1));
                  let kickedPlayer = data.players.splice(randomIndex, 1)[0];
                  await existingMessage.delete().catch(() => 0);
                  if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                  message.channel.send(`🪄 | جاري طرد شخص ما بشكل عشوائي...`);
                  data.removedPlayers = [...data.removedPlayers, { id: kickedPlayer.id, username: kickedPlayer.username, position: kickedPlayer.position }];
                  
                  let winnerStats = await dbq.get(`roulette_stats_${message.guild.id}.${winner.id}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
                  winnerStats.kicks++;
                  await dbq.set(`roulette_stats_${message.guild.id}.${winner.id}`, winnerStats);
                  
                  let kickedStats = await dbq.get(`roulette_stats_${message.guild.id}.${kickedPlayer.id}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
                  kickedStats.kicked++;
                  await dbq.set(`roulette_stats_${message.guild.id}.${kickedPlayer.id}`, kickedStats);
                  

                  await applyLinkEffect(kickedPlayer.id, message.guild.id, dbq, data);
                  has_play.set(message.guild.id, data);
                  
                  await GifShopSystem.sendKickGif(message, kickedPlayer.id, winner.id, dbq);
                  
                  await sleep(800);
                  message.channel.send(`💣 | تم طرده بشكل عشوائي <@${kickedPlayer.id}> من اللعبة ، سيتم بدء الجولة القادمة في بضع ثواني...`);
                  roulette(message);


                } else if (collect.customId == "item_bomb") {
                  await safeDeferUpdate(collect);
                  
                  const bombResult = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_bomb', { 
                    players: data.players, 
                    removedPlayers: data.removedPlayers, 
                    message,
                    excludeUserId: winner.id
                  });
                  
                  if (bombResult) {
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    
                    let winnerStats = await dbq.get(`roulette_stats_${message.guild.id}.${winner.id}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
                    winnerStats.kicks += 3;
                    await dbq.set(`roulette_stats_${message.guild.id}.${winner.id}`, winnerStats);
                    
                    await GifShopSystem.sendKickGif(message, null, winner.id, dbq);
                    
                    has_play.set(message.guild.id, data);
                    await sleep(1200);
                    roulette(message);
                  } else {
                    await message.channel.send({ content: `❌ لا يمكن استخدام القنبلة الآن (يجب أن يكون هناك أكثر من 3 لاعبين).` });
                    roulette(message);
                  }
                  
                } else if (collect.customId == "item_revive") {
                  await safeDeferUpdate(collect);
                  
                  const reviveResult = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_revive', { 
                    removedPlayers: data.removedPlayers,
                    players: data.players,
                    message,
                    winnerId: winner.id
                  });
                  
                  if (reviveResult) {
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    
                    has_play.set(message.guild.id, data);
                    await sleep(800);
                    roulette(message);
                  } else {
                    await message.channel.send({ content: `❌ لا يمكن استخدام الإنعاش الآن (لا يوجد لاعبين مطرودين).` });
                    roulette(message);
                  }


                } else if (collect.customId == "item_snipe") {
                  await safeDeferUpdate(collect);
                  
                  const snipeResult = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_snipe', { 
                    players: data.players,
                    removedPlayers: data.removedPlayers,
                    message,
                    winnerId: winner.id
                  });
                  
                  if (snipeResult) {
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    
                    has_play.set(message.guild.id, data);
                    await sleep(1200);
                    roulette(message);
                  } else {
                    await message.channel.send({ content: `❌ لا يمكن استخدام القنص الآن.` });
                    roulette(message);
                  }
                  
                } else if (collect.customId == "item_hack") {
                  await safeDeferUpdate(collect);
                  
                  const hackResult = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_hack', { 
                    players: data.players,
                    message,
                    winnerId: winner.id
                  });
                  
                  if (hackResult) {
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    
                    has_play.set(message.guild.id, data);
                    await sleep(800);
                    roulette(message);
                  } else {
                    await message.channel.send({ content: `❌ لا يمكن استخدام التهكير الآن.` });
                    roulette(message);
                  }
                  
                } else if (collect.customId == "item_stealth") {
                  await safeDeferUpdate(collect);
                  
                  const stealthResult = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_stealth', { 
                    players: data.players,
                    message,
                    winnerId: winner.id
                  });
                  
                  if (stealthResult) {
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    
                    has_play.set(message.guild.id, data);
                    await sleep(800);
                    roulette(message);
                  } else {
                    await message.channel.send({ content: `❌ لا يمكن استخدام الإخفاء الآن.` });
                    roulette(message);
                  }
                  
                } else if (collect.customId == "item_link") {
                  await safeDeferUpdate(collect);
                  
                  const linkResult = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_link', { 
                    players: data.players,
                    message,
                    winnerId: winner.id
                  });
                  
                  if (linkResult) {
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    
                    has_play.set(message.guild.id, data);
                    await sleep(800);
                    roulette(message);
                  } else {
                    await message.channel.send({ content: `❌ لا يمكن استخدام الربط الآن.` });
                    roulette(message);
                  }
                  
                } else if (collect.customId == "item_reveal") {
                  await safeDeferUpdate(collect);
                  
                  const revealResult = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_reveal', { 
                    players: data.players,
                    message,
                    winnerId: winner.id
                  });
                  
                  if (revealResult) {
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    
                    has_play.set(message.guild.id, data);
                    await sleep(800);
                    roulette(message);
                  } else {
                    await message.channel.send({ content: `❌ لا يمكن استخدام الكشف الآن.` });
                    roulette(message);
                  }
                  
                } else if (collect.customId == "item_disable") {
                  await safeDeferUpdate(collect);
                  
                  const disableResult = await useSelectedItem(winner.id, message.guild.id, dbq, 'manual_disable', { 
                    players: data.players,
                    message,
                    winnerId: winner.id
                  });
                  
                  if (disableResult) {
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    
                    has_play.set(message.guild.id, data);
                    await sleep(800);
                    roulette(message);
                  } else {
                    await message.channel.send({ content: `❌ لا يمكن استخدام المنع الآن.` });
                    roulette(message);
                  }
                  
                } else {

                  await safeDeferUpdate(collect);
                  choice = collect.customId;
                  let kickedPlayer = data.players.find(p => p.id == choice);
                  
                  const itemResult = await useSelectedItem(choice, message.guild.id, dbq, 'being_kicked', {
                    targetId: choice,
                    kickerId: winner.id,
                    message: message
                  });

                  if (itemResult === 'protected') {
                    await existingMessage.delete().catch(() => 0);
                    if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                    const protectedUser = data.players.find(p => p.id == choice);
                    const protectedName = protectedUser ? protectedUser.username : 'اللاعب';
                    message.channel.send({ content: `🛡️ **${protectedName}** استخدم الحماية ولا يمكن طرده! سيتم بدء الجولة القادمة خلال ثواني...` });
                    await sleep(500);
                    roulette(message);
                    return;
                  } else if (itemResult && itemResult !== true && itemResult !== 'protected') {
                    const originalChoice = choice;
                    
                    const targetId = itemResult.targetId || itemResult;
                    choice = targetId;
                    
                    kickedPlayer = data.players.find(p => p.id == choice);
                    if (!kickedPlayer) {
                      kickedPlayer = { id: winner.id, username: winner.username, position: winner.position };
                      choice = winner.id;
                    }
                    
                    const targetUser = data.players.find(p => p.id == originalChoice);
                    const targetName = targetUser ? targetUser.username : 'اللاعب';
                    
                    if (itemResult.type === 'counter_attack') {
                      await message.channel.send({ content: `⚔️ **${targetName}** استخدم الهجمة المرتدة ولم ينطرد! تم طرد <@${winner.id}> بدلاً منه!` });
                    } else if (itemResult.type === 'swap') {
                      await message.channel.send({ content: `🔄 **${targetName}** استخدم التبديل! سيتم طرد <@${winner.id}> بدلاً منه!` });
                    } else {
                      await message.channel.send({ content: `🔄 **${targetName}** استخدم التبديل! سيتم طرد <@${winner.id}> بدلاً منه!` });
                    }
                  }

                  data.removedPlayers = [...data.removedPlayers, { id: kickedPlayer.id, username: kickedPlayer.username, position: kickedPlayer.position }];
                  has_play.set(message.guild.id, data);
                  await existingMessage.delete().catch(() => 0);
                  if (itemsMessage) await itemsMessage.delete().catch(() => 0);
                  
                  let winnerStats = await dbq.get(`roulette_stats_${message.guild.id}.${winner.id}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
                  winnerStats.kicks++;
                  await dbq.set(`roulette_stats_${message.guild.id}.${winner.id}`, winnerStats);
                  
                  let kickedStats = await dbq.get(`roulette_stats_${message.guild.id}.${kickedPlayer.id}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
                  kickedStats.kicked++;
                  await dbq.set(`roulette_stats_${message.guild.id}.${kickedPlayer.id}`, kickedStats);
                  

                  await applyLinkEffect(kickedPlayer.id, message.guild.id, dbq, data);
                  has_play.set(message.guild.id, data);
                  
                  if (itemResult !== 'protected') {
                    await GifShopSystem.sendKickGif(message, choice, winner.id, dbq);
                    message.channel.send({ content: `💣 | تم طرد <@${choice}> من اللعبة ، سيتم بدء الجولة القادمة في بضع ثواني...` });
                  }
                }
      
                if (!choice) return;
      
                let index = data.players.findIndex(p => p.id == choice);
                if (index == -1) return;
      
                data.players.splice(index, 1);
                has_play.set(message.guild.id, data);
                await sleep(500);
                roulette(message);
      
              }
            } catch (error) {
              console.error('Error in roulette main loop:', error);
              message.channel.send({ content: '❌ حدث خطأ في اللعبة. سيتم إنهاء اللعبة.' });
              await cleanupGameData(message.guild.id, dbq);
              await dbq.delete(`current_players_${message.guild.id}`);
              has_play.delete(message.guild.id);
            }
          }, 2000);
        } catch (error) {
          console.error('Error in roulette function:', error);
          message.channel.send({ content: '❌ حدث خطأ في اللعبة. سيتم إنهاء اللعبة.' });
          await cleanupGameData(message.guild.id, dbq);
          await dbq.delete(`current_players_${message.guild.id}`);
          has_play.delete(message.guild.id);
        }
      }

      async function createMultipleButtons(array, winner, guildId) {
        let components = [];
        let c = 5;
        for (let i = 0; i < array.length; i += c) {
          let buttons = array.slice(i, i + c);
          let component = new ActionRowBuilder()
          for (let button of buttons) {
            let btn = new ButtonBuilder()
              .setStyle(winner.id != button.id ? ButtonStyle.Secondary : ButtonStyle.Danger)
              .setLabel(button.label)
              .setCustomId(`${button.id}`)
              .setDisabled(button.disabled ? button.disabled : false);
            if (button.emoji) {
              btn.setEmoji(button.emoji);
            }
            component.addComponents(btn);
          }
          components.push(component);
        }
        return components;
      }

      function createButton(style, customId, label, emoji, disabled) {
        let styles = {
          PRIMARY: ButtonStyle.Primary,
          SECONDARY: ButtonStyle.Secondary,
          SUCCESS: ButtonStyle.Success,
          DANGER: ButtonStyle.Danger
        }
        let btn = new ButtonBuilder()
          .setStyle(styles[style])
          .setCustomId(customId)
          .setLabel(label)
          .setDisabled(disabled ? disabled : false);
        if (emoji) btn.setEmoji(emoji);
        return btn;
      }

      function sleep(time) {
        return new Promise((resolve) => setTimeout(() => resolve(time), time));
      }
    }
  });
}

module.exports = { execute };
