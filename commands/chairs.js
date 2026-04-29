const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "كراسي") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) return;
      
      if (has_play.get(message.guild.id)) {
        return message.reply({ content: `❌ هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      }


      const storedTime = await dbq.get(`timerchairs_${message.author.id}`) || 30000;
      let data = {
        author: message.author.id,
        players: [],
        start_in: Date.now() + storedTime,
        type: "chairs",
        maxPlayers: 20,
        minPlayers: 2,
        gameState: "waiting",
        currentRound: 0,
        chairsAvailable: 0,
        eliminatedPlayers: [],
        roundActive: false
      };


      let attachment;
      const chairsImage = `./imager/chairsimage_${message.guild.id}.png`;
      
      try {
        if (fs.existsSync(chairsImage)) {
          attachment = new AttachmentBuilder(chairsImage);
        } else {
          attachment = new AttachmentBuilder(`./photo/chairs.png`);
        }
      } catch (error) {
        attachment = new AttachmentBuilder(`./photo/chairs.png`);
      }

      let content_time1 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`;
      let content_players1 = `**(0 / ${data.maxPlayers})**`;


      let row = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "join_chairs", "دخول", '1243848352026591274'),
          createButton("SECONDARY", "leave_chairs", "خروج", '1243848354535047230'),
          createButton("SECONDARY", "explain_chairs", "شرح اللعبة", '1254234763699687476')
        )
      ];

      let msg = await message.channel.send({ 
        content: `${content_time1}\n${content_players1}`, 
        files: [attachment], 
        components: row 
      }).catch(() => 0);

      if (!msg) return;
      
      has_play.set(message.guild.id, data);
      let start_c = msg.createMessageComponentCollector({ time: storedTime });


      async function updateCounter() {
        let data = has_play.get(message.guild.id);
        if (!data) return;
        let counter = data.players.length;
        let content_players2 = `**(${counter} / ${data.maxPlayers})**`;
        await msg.edit({ content: `${content_time1}\n${content_players2}`, components: row }).catch(() => {});
      }


      start_c.on("collect", async inter => {
        if (!has_play.get(message.guild.id)) return;
        let data = has_play.get(message.guild.id);

        if (inter.customId === "join_chairs") {
          if (data.players.find(u => u.id === inter.user.id)) {
            return inter.reply({ content: `لقد انضممت للعبة بالفعل!`, ephemeral: true });
          }
          
          if (data.players.length >= data.maxPlayers) {
            return inter.reply({ content: `عذراً، اكتمل عدد اللاعبين! الحد الأقصى ${data.maxPlayers} لاعب.`, ephemeral: true });
          }

          data.players.push({
            id: inter.user.id,
            username: inter.user.username,
            displayName: inter.user.displayName,
            avatar: inter.user.displayAvatarURL({ 
              extension: "png", 
              format: 'png', 
              size: 512, 
              forceStatic: true 
            }),
            isAlive: true,
            hasChair: false
          });
          
          has_play.set(message.guild.id, data);
          await updateCounter();
          inter.reply({ content: `✅ تم انضمامك للعبة بنجاح!`, ephemeral: true });

        } else if (inter.customId === "leave_chairs") {
          let playerIndex = data.players.findIndex(p => p.id === inter.user.id);
          if (playerIndex === -1) {
            return inter.reply({ content: `أنت لست منضماً للعبة!`, ephemeral: true });
          }

          data.players.splice(playerIndex, 1);
          has_play.set(message.guild.id, data);
          await updateCounter();
          inter.reply({ content: `✅ تم خروجك من اللعبة.`, ephemeral: true });

        } else if (inter.customId === "explain_chairs") {
          inter.reply({
            content: `
**🪑 طريقة لعب الكراسي الموسيقية:**

🎯 **الهدف:** كن آخر لاعب متبقي!

⚡ **القواعد:**
• عدد الكراسي = عدد اللاعبين - 1
• عندما تبدأ الجولة، اضغط بسرعة على أي كرسي متاح 🪑
• احذر من الحفر! 🕳️ (أزرار وهمية)
• آخر شخص بدون كرسي يخرج من اللعبة

🎮 **آلية اللعب:**
• كل جولة تقل عدد الكراسي بـ 1
• لديك 10 ثوانٍ للعثور على كرسي
• الكراسي محدودة - كن سريعاً!
• تستمر الجولات حتى يبقى لاعب واحد

🏆 **الفوز:** آخر لاعب يجد كرسي يفوز!

🎮 **المكافآت:**
• البقاء في الجولة = +1 نقطة ألعاب جماعية
• الفوز = +3 نقاط ألعاب جماعية إضافية

💡 **استراتيجية:** كن سريعاً ولا تضغط على الحفر!`,
            ephemeral: true
          });
        }
      });


      start_c.on("end", async () => {
        if (!has_play.get(message.guild.id)) return;
        let data = has_play.get(message.guild.id);

        let content_players4 = `**(${data.players.length} / ${data.maxPlayers})**`;
        await msg.edit({ content: `${content_players4}`, components: [] }).catch(() => 0);

        if (data.players.length < data.minPlayers) {
          has_play.delete(message.guild.id);
          return message.channel.send({ 
            content: `تم إيقاف اللعبة لعدم وجود **${data.minPlayers}** لاعبين على الأقل - ⛔.` 
          });
        }

        message.channel.send({ content: `⏳ تم تسجيل اللاعبين سوف تبدأ اللعبة قريباً...` });
        
        setTimeout(() => {
          startChairsGame(message);
        }, 5000);
      });
    }
  });


  async function startChairsGame(message) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data || data.players.length === 0) return;

      data.gameState = "playing";
      data.currentRound = 1;
      has_play.set(message.guild.id, data);

      await startNewRound(message);
    } catch (error) {
      console.error('Error starting chairs game:', error);
      message.channel.send('❌ حدث خطأ أثناء بدء اللعبة.');
      has_play.delete(message.guild.id);
    }
  }


  async function startNewRound(message) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data) return;

      const alivePlayers = data.players.filter(p => p.isAlive);
      

      if (alivePlayers.length === 1) {
        await announceWinner(message, alivePlayers[0]);
        has_play.delete(message.guild.id);
        return;
      }

      if (alivePlayers.length === 0) {
        await message.channel.send('🤔 لا يوجد فائز! انتهت اللعبة.');
        has_play.delete(message.guild.id);
        return;
      }


      if (data.currentRound > 1) {
        for (const player of alivePlayers) {
          await giveGroupGamePoints(message.guild.id, player.id, 1);
        }
      }


      data.chairsAvailable = alivePlayers.length - 1;
      data.roundActive = true;
      

      alivePlayers.forEach(player => {
        player.hasChair = false;
      });

      has_play.set(message.guild.id, data);


      await message.channel.send(`
🪑 **الجولة ${data.currentRound}**
👥 **اللاعبين المتبقين:** ${alivePlayers.length}

⏳ ابحثوا عن الكراسي...`);

      await sendChairButtons(message);

    } catch (error) {
      console.error('Error starting new round:', error);
      message.channel.send('❌ حدث خطأ أثناء بدء الجولة.');
    }
  }


  async function sendChairButtons(message) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data) return;

      const alivePlayers = data.players.filter(p => p.isAlive);
      const chairsNeeded = data.chairsAvailable;
      

      const totalButtons = Math.max(12, alivePlayers.length + 3);
      

      let buttonTypes = [];
      

      for (let i = 0; i < chairsNeeded; i++) {
        buttonTypes.push('chair');
      }
      

      for (let i = chairsNeeded; i < totalButtons; i++) {
        buttonTypes.push('hole');
      }
      

      buttonTypes = shuffleArray(buttonTypes);


      const rows = [];
      const buttonsPerRow = 4;
      const totalRows = Math.ceil(totalButtons / buttonsPerRow);

      for (let row = 0; row < totalRows; row++) {
        const actionRow = new ActionRowBuilder();
        const startIndex = row * buttonsPerRow;
        const endIndex = Math.min(startIndex + buttonsPerRow, totalButtons);

        for (let i = startIndex; i < endIndex; i++) {
          const buttonType = buttonTypes[i];
          const buttonNumber = i + 1;
          
          if (buttonType === 'chair') {
            actionRow.addComponents(
              createButton("SECONDARY", `chair_btn_${i}`, `${buttonNumber} -`, '<:chair:1402081488794685512>')
            );
          } else {
            actionRow.addComponents(
              createButton("SECONDARY", `hole_btn_${i}`, `${buttonNumber} -`, '<:hole:1402081502367318157>')
            );
          }
        }
        rows.push(actionRow);
      }

      const chairMsg = await message.channel.send({
        content: `** ! ابحثوا عن الكراسي!**\n⏰ لديكم **10 ثواني** فقط!`,
        components: rows
      });


      const chairCollector = chairMsg.createMessageComponentCollector({ time: 10000 });
      
      let chairsTaken = 0;
      const playersWithChairs = new Set();

      chairCollector.on('collect', async inter => {
        let currentData = has_play.get(message.guild.id);
        if (!currentData || !currentData.roundActive) return;

        const alivePlayers = currentData.players.filter(p => p.isAlive);
        const player = alivePlayers.find(p => p.id === inter.user.id);


        if (!player) {
          return inter.reply({ content: 'أنت لست في اللعبة!', ephemeral: true });
        }

        if (playersWithChairs.has(inter.user.id)) {
          return inter.reply({ content: 'لديك كرسي بالفعل!', ephemeral: true });
        }


        if (inter.customId.startsWith('chair_btn_')) {

          if (chairsTaken < currentData.chairsAvailable) {
            chairsTaken++;
            playersWithChairs.add(inter.user.id);
            player.hasChair = true;
            
            await inter.reply({ content: '🪑 **عثرت على كرسي ✅**', ephemeral: true });
            

            if (chairsTaken >= currentData.chairsAvailable) {
              chairCollector.stop('chairs_full');
            }
          } else {
            await inter.reply({ content: '🛑 **عذراً، هذا الكرسي محجوز بالفعل!**', ephemeral: true });
          }
        } else if (inter.customId.startsWith('hole_btn_')) {

          await inter.reply({ content: '🕳️ **هذه حفرة! ابحث عن كرسي !**', ephemeral: true });
        }

        has_play.set(message.guild.id, currentData);
      });

      chairCollector.on('end', async (collected, reason) => {
        let currentData = has_play.get(message.guild.id);
        if (!currentData) return;

        currentData.roundActive = false;
        has_play.set(message.guild.id, currentData);

        await chairMsg.edit({ components: [] }).catch(() => {});


        const alivePlayers = currentData.players.filter(p => p.isAlive);
        const playersWithoutChairs = alivePlayers.filter(p => !p.hasChair);

        if (playersWithoutChairs.length > 0) {

          for (const player of playersWithoutChairs) {
            player.isAlive = false;
            currentData.eliminatedPlayers.push(player);
          }

          const eliminatedNames = playersWithoutChairs.map(p => p.displayName).join(', ');
          await message.channel.send(`💔 **تم إقصاء:** ${eliminatedNames}\n**السبب:** لم يجدوا كراسي!`);
        }


        currentData.currentRound++;
        has_play.set(message.guild.id, currentData);

        setTimeout(() => {
          startNewRound(message);
        }, 3000);
      });

    } catch (error) {
      console.error('Error sending chair buttons:', error);
    }
  }


  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }


  async function announceWinner(message, winner) {
    try {

      let avatarURL;
      try {
        const user = await message.client.users.fetch(winner.id);
        avatarURL = user.displayAvatarURL({ 
          extension: "png", 
          format: 'png', 
          size: 512, 
          forceStatic: true 
        });
      } catch (fetchError) {
        avatarURL = winner.avatar || winner.avatarURL;
      }

      const winnerImage = await generateChairsWinnerImage(winner.displayName, avatarURL, message.guild.id);
      const attachment = new AttachmentBuilder(winnerImage, { name: 'winner.png' });


      const pointsEarned = 3;
      await giveGroupGamePoints(message.guild.id, winner.id, pointsEarned);
      

      const totalGroupGamePoints = await dbq.get(`groupgamepoints_${message.guild.id}.${winner.id}`) || 0;
      
      await updatePlayerStats(message.guild.id, winner.id, true);

      const row = new ActionRowBuilder()
        .addComponents(
          createButton("SECONDARY", "winner_points", `🎮 +${pointsEarned} (${totalGroupGamePoints})`, null, true)
        );

      await message.channel.send({ 
        content: `🎉 **تهانينا <@${winner.id}>!** 🏆\n🪑 **الفائز   !**`, 
        files: [attachment],
        components: [row]
      });

    } catch (error) {
      console.error('Error announcing winner:', error);
      await message.channel.send(`🎉 **تهانينا <@${winner.id}>!** 🏆\n🪑 **الفائز   !**`);
    }
  }


  async function generateChairsWinnerImage(playerName, avatarURL, guildId) {
    try {
      const canvas = createCanvas(2560, 1080);
      const ctx = canvas.getContext('2d');


      let backgroundImage;
      const winImagePath = `./imager/messageimage_${guildId}.png`;
      
      try {
        if (fs.existsSync(winImagePath)) {
          backgroundImage = await loadImage(winImagePath);
        } else {
          backgroundImage = await loadImage('./photo/win.png');
        }
      } catch (error) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      }


      let avatar;
      if (!avatarURL || avatarURL === 'undefined' || avatarURL === 'null') {
        avatar = await createChairsDefaultAvatar();
      } else {
        try {
          const loadPromise = loadImage(avatarURL);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Avatar load timeout')), 10000)
          );
          
          avatar = await Promise.race([loadPromise, timeoutPromise]);
        } catch (avatarError) {
          avatar = await createChairsDefaultAvatar();
        }
      }


      const avatarSize = 720;
      const avatarX = 962;
      const avatarY = 68;
      
      drawChairsCircularImageWithBorder(ctx, avatar, avatarX, avatarY, avatarSize);


      ctx.font = '90px cairo';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const textName = playerName || 'الفائز';
      const textX = 275 + avatarSize + 280;
      const textY = 985;

      ctx.strokeText(textName, textX, textY - 100);
      ctx.fillText(textName, textX, textY - 100);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating chairs winner image:', error);
      return await createEmergencyChairsWinnerImage(playerName);
    }
  }


  function drawChairsCircularImageWithBorder(ctx, image, x, y, size) {
    try {
      if (!image) {
        throw new Error('Image object is null or undefined');
      }


      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 12, 0, Math.PI * 2, true);
      ctx.fillStyle = '#CD7F32';
      ctx.fill();
      ctx.restore();
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 6, 0, Math.PI * 2, true);
      ctx.fillStyle = '#8B4513';
      ctx.fill();
      ctx.restore();
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      
      if (image.width && image.height) {
        ctx.drawImage(image, x, y, size, size);
      } else {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, size, size);
      }
      
      ctx.restore();
      
    } catch (error) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.fillStyle = '#8B4513';
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 60px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪑', x + size / 2, y + size / 2);
      
      ctx.restore();
    }
  }


  async function createChairsDefaultAvatar() {
    try {
      const canvas = createCanvas(720, 720);
      const ctx = canvas.getContext('2d');
      

      const gradient = ctx.createRadialGradient(360, 360, 0, 360, 360, 360);
      gradient.addColorStop(0, '#CD7F32');
      gradient.addColorStop(0.5, '#DEB887');
      gradient.addColorStop(1, '#8B4513');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 720, 720);
      

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 200px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪑', 360, 360);
      
      return canvas;
    } catch (error) {
      const canvas = createCanvas(720, 720);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 0, 720, 720);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 100px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 360, 360);
      return canvas;
    }
  }


  async function createEmergencyChairsWinnerImage(playerName) {
    try {
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');
      

      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, '#CD7F32');
      gradient.addColorStop(0.5, '#DEB887');
      gradient.addColorStop(1, '#8B4513');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 400);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 فائز لعبة الكراسي 🏆', 400, 150);
      
      ctx.font = 'bold 28px cairo';
      ctx.fillText(playerName || 'اللاعب', 400, 250);
      
      return canvas.toBuffer();
    } catch (error) {
      throw error;
    }
  }


  function createButton(style, customId, label, emoji, disabled) {
    let styles = {
      PRIMARY: ButtonStyle.Primary,
      SECONDARY: ButtonStyle.Secondary,
      SUCCESS: ButtonStyle.Success,
      DANGER: ButtonStyle.Danger
    };
    
    let btn = new ButtonBuilder()
      .setStyle(styles[style])
      .setCustomId(customId)
      .setLabel(label)
      .setDisabled(disabled || false);
    
    if (emoji) btn.setEmoji(emoji);
    return btn;
  }


  async function giveGroupGamePoints(guildId, userId, points) {
    try {
      let groupGamePoints = await dbq.get(`groupgamepoints_${guildId}.${userId}`) || 0;
      groupGamePoints += points;
      await dbq.set(`groupgamepoints_${guildId}.${userId}`, groupGamePoints);
    } catch (error) {
      console.error('Error giving group game points:', error);
    }
  }


  async function updatePlayerStats(guildId, userId, won = false) {
    try {
      let games = await dbq.get(`chairsgames_${guildId}.${userId}`) || 0;
      await dbq.set(`chairsgames_${guildId}.${userId}`, games + 1);

      if (won) {
        let wins = await dbq.get(`chairswins_${guildId}.${userId}`) || 0;
        await dbq.set(`chairswins_${guildId}.${userId}`, wins + 1);
      }
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  }

  

  

  

  


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "وقت_كراسي") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      const mgamess = await dbq.get(`managergames_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات لتعديل وقت الانضمام.");
      }

      const newTime = parseInt(args[1]);
      if (!newTime || newTime < 10 || newTime > 300) {
        return message.reply('❌ | يجب أن يكون الوقت بين 10 و 300 ثانية.');
      }

      await dbq.set(`timerchairs_${message.author.id}`, newTime * 1000);
      await message.reply(`✅ | تم تعديل وقت الانضمام إلى ${newTime} ثانية.`);
    }
  });
 }
  


module.exports = { execute };
