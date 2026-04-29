const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "هايد") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) return;
      
      if (has_play.get(message.guild.id)) {
        return message.reply({ content: `❌ هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      }


      const storedTime = await dbq.get(`timerhide_${message.author.id}`) || 30000;
      let data = {
        author: message.author.id,
        players: [],
        start_in: Date.now() + storedTime,
        type: "hide",
        maxPlayers: 10,
        minPlayers: 3,
        currentRound: 0,
        gameState: "waiting",
        currentSeeker: null,
        hidingSpots: {},
        seekerAttempts: 0,
        maxAttempts: 3,
        eliminatedPlayers: []
      };


      let attachment;
      const hideImage = `./imager/hideimage_${message.guild.id}.png`;
      
      try {
        if (fs.existsSync(hideImage)) {
          attachment = new AttachmentBuilder(hideImage);
        } else {
          attachment = new AttachmentBuilder(`./photo/hide.png`);
        }
      } catch (error) {
        attachment = new AttachmentBuilder(`./photo/hide.png`);
      }

      let content_time1 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`;
      let content_players1 = `**(0 / ${data.maxPlayers})**`;


      let row = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "join_hide", "دخول", '1243848352026591274'),
          createButton("SECONDARY", "leave_hide", "خروج", '1243848354535047230'),
          createButton("SECONDARY", "explain_hide", "شرح اللعبة", '1399549609981776043')
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

        if (inter.customId === "join_hide") {
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
            isAlive: true
          });
          
          has_play.set(message.guild.id, data);
          await updateCounter();
          inter.reply({ content: `✅ تم انضمامك للعبة بنجاح!`, ephemeral: true });

        } else if (inter.customId === "leave_hide") {
          let playerIndex = data.players.findIndex(p => p.id === inter.user.id);
          if (playerIndex === -1) {
            return inter.reply({ content: `أنت لست منضماً للعبة!`, ephemeral: true });
          }

          data.players.splice(playerIndex, 1);
          has_play.set(message.guild.id, data);
          await updateCounter();
          inter.reply({ content: `✅ تم خروجك من اللعبة.`, ephemeral: true });

        } else if (inter.customId === "explain_hide") {
          inter.reply({
            content: `
**🫥 طريقة لعب الاختباء:**

🎯 **الهدف:** كن آخر لاعب متبقي!

⚡ **القواعد:**
• كل لاعب يختار مكان اختباء من الأزرار المتاحة
• البوت يختار لاعب عشوائي ليكون **الباحث**
• الباحث لديه **3 محاولات** فقط للعثور على الآخرين
• كل محاولة تكشف عن مكان واحد فقط
• إذا وجد لاعب، يخرج من اللعبة
• إذا لم يجد أحد، ينتقل للجولة التالية

🔄 **الجولات:**
• بعد كل جولة، يغير الجميع أماكنهم
• يتم اختيار باحث جديد
• تستمر حتى يبقى لاعب واحد

🏆 **الفوز:** آخر لاعب متبقي يفوز!

📊 **المكافآت:**
• البقاء في الجولة = +1 نقطة ألعاب جماعية
• الفوز = +3 نقاط ألعاب جماعية إضافية`,
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
          startHideGame(message);
        }, 5000);
      });
    }
  });


  async function startHideGame(message) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data || data.players.length === 0) return;

      data.gameState = "playing";
      data.currentRound = 1;
      has_play.set(message.guild.id, data);

      await startNewRound(message);
    } catch (error) {
     
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


      const randomIndex = Math.floor(Math.random() * alivePlayers.length);
      data.currentSeeker = alivePlayers[randomIndex];
      data.seekerAttempts = 0;
      data.hidingSpots = {};


      const totalButtons = alivePlayers.length + 6;
      
      has_play.set(message.guild.id, data);


      await message.channel.send(`
🔄 **الجولة ${data.currentRound}**
👥 **اللاعبين المتبقين:** ${alivePlayers.length}
🔍 **الباحث:** <@${data.currentSeeker.id}>
📍 **الأماكن المتاحة:** ${totalButtons}

⏳ اختاروا أماكن اختبائكم...`);

      await sendHidingButtons(message, totalButtons);

    } catch (error) {
      
      message.channel.send('❌ حدث خطأ أثناء بدء الجولة.');
    }
  }


  async function sendHidingButtons(message, totalButtons) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data) return;


      const rows = [];
      const buttonsPerRow = 5;
      const totalRows = Math.ceil(totalButtons / buttonsPerRow);

      for (let row = 0; row < totalRows; row++) {
        const actionRow = new ActionRowBuilder();
        const startIndex = row * buttonsPerRow;
        const endIndex = Math.min(startIndex + buttonsPerRow, totalButtons);

        for (let i = startIndex; i < endIndex; i++) {
          const buttonNumber = i + 1;
          actionRow.addComponents(
            createButton("SECONDARY", `hide_spot_${buttonNumber}`, `مكان ${buttonNumber}`, '📦')
          );
        }
        rows.push(actionRow);
      }


      const hideMsg = await message.channel.send({
        content: `**اختاروا أماكن اختبائكم! (ما عدا <@${data.currentSeeker.id}>)**`,
        components: rows
      });


      const hideCollector = hideMsg.createMessageComponentCollector({ time: 30000 });

      hideCollector.on('collect', async inter => {
        let currentData = has_play.get(message.guild.id);
        if (!currentData) return;

        const alivePlayers = currentData.players.filter(p => p.isAlive);
        const player = alivePlayers.find(p => p.id === inter.user.id);


        if (!player) {
          return inter.reply({ content: 'أنت لست في اللعبة!', ephemeral: true });
        }

        if (inter.user.id === currentData.currentSeeker.id) {
          return inter.reply({ content: 'أنت الباحث! لا يمكنك الاختباء.', ephemeral: true });
        }

        const spotNumber = parseInt(inter.customId.split('_')[2]);


        if (Object.values(currentData.hidingSpots).includes(spotNumber)) {
          return inter.reply({ content: 'هذا المكان محجوز بالفعل!', ephemeral: true });
        }

        if (currentData.hidingSpots[inter.user.id]) {
          return inter.reply({ content: 'لقد اخترت مكان بالفعل!', ephemeral: true });
        }


        currentData.hidingSpots[inter.user.id] = spotNumber;
        has_play.set(message.guild.id, currentData);

        inter.reply({ content: `✅ تم اختيار المكان ${spotNumber} بنجاح!`, ephemeral: true });


        const nonSeekerPlayers = alivePlayers.filter(p => p.id !== currentData.currentSeeker.id);
        if (Object.keys(currentData.hidingSpots).length === nonSeekerPlayers.length) {
          hideCollector.stop('all_chosen');
        }
      });

      hideCollector.on('end', async (collected, reason) => {
        let currentData = has_play.get(message.guild.id);
        if (!currentData) return;

        await hideMsg.edit({ components: [] }).catch(() => {});

        if (reason === 'all_chosen') {
          await message.channel.send('✅ اختار جميع اللاعبين أماكنهم! بدء مرحلة البحث...');
        } else {

          const alivePlayers = currentData.players.filter(p => p.isAlive);
          const nonSeekerPlayers = alivePlayers.filter(p => p.id !== currentData.currentSeeker.id);
          const usedSpots = Object.values(currentData.hidingSpots);
          
          for (const player of nonSeekerPlayers) {
            if (!currentData.hidingSpots[player.id]) {
              let randomSpot;
              do {
                randomSpot = Math.floor(Math.random() * totalButtons) + 1;
              } while (usedSpots.includes(randomSpot));
              
              currentData.hidingSpots[player.id] = randomSpot;
              usedSpots.push(randomSpot);
            }
          }

          has_play.set(message.guild.id, currentData);
          await message.channel.send('⏰ انتهى الوقت! تم اختيار أماكن عشوائية للاعبين المتأخرين.');
        }

        setTimeout(() => {
          startSeekingPhase(message, totalButtons);
        }, 2000);
      });

    } catch (error) {
    
    }
  }


  async function startSeekingPhase(message, totalButtons) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data) return;


      const rows = [];
      const buttonsPerRow = 5;
      const totalRows = Math.ceil(totalButtons / buttonsPerRow);

      for (let row = 0; row < totalRows; row++) {
        const actionRow = new ActionRowBuilder();
        const startIndex = row * buttonsPerRow;
        const endIndex = Math.min(startIndex + buttonsPerRow, totalButtons);

        for (let i = startIndex; i < endIndex; i++) {
          const buttonNumber = i + 1;
          actionRow.addComponents(
            createButton("DANGER", `seek_spot_${buttonNumber}`, `تفتيش ${buttonNumber}`, '🔍')
          );
        }
        rows.push(actionRow);
      }

      const seekMsg = await message.channel.send({
        content: `🔍 **<@${data.currentSeeker.id}>**، ابحث عن اللاعبين!\n**المحاولات المتبقية:** ${data.maxAttempts - data.seekerAttempts}`,
        components: rows
      });


      const seekCollector = seekMsg.createMessageComponentCollector({ 
        filter: i => i.user.id === data.currentSeeker.id,
        time: 60000 
      });

      seekCollector.on('collect', async inter => {
        let currentData = has_play.get(message.guild.id);
        if (!currentData) return;

        const spotNumber = parseInt(inter.customId.split('_')[2]);
        currentData.seekerAttempts++;


        const foundPlayerId = Object.keys(currentData.hidingSpots).find(
          playerId => currentData.hidingSpots[playerId] === spotNumber
        );

        if (foundPlayerId) {

          const foundPlayer = currentData.players.find(p => p.id === foundPlayerId);
          foundPlayer.isAlive = false;
          currentData.eliminatedPlayers.push(foundPlayer);

          await inter.reply(`🎯 **تم العثور على ${foundPlayer.displayName} في المكان ${spotNumber}!**`);
          
          const updatedRows = disableButton(rows, spotNumber, '❌', 'DANGER');
          await seekMsg.edit({ 
            content: `🔍 **<@${currentData.currentSeeker.id}>**، ابحث عن اللاعبين!\n**المحاولات المتبقية:** ${currentData.maxAttempts - currentData.seekerAttempts}`,
            components: updatedRows 
          });

        } else {

          await inter.reply(`❌ **المكان ${spotNumber} فارغ!**`);
          
          const updatedRows = disableButton(rows, spotNumber, '❌', 'SECONDARY');
          await seekMsg.edit({ 
            content: `🔍 **<@${currentData.currentSeeker.id}>**، ابحث عن اللاعبين!\n**المحاولات المتبقية:** ${currentData.maxAttempts - currentData.seekerAttempts}`,
            components: updatedRows 
          });
        }

        has_play.set(message.guild.id, currentData);


        const alivePlayers = currentData.players.filter(p => p.isAlive);
        const nonSeekerAlivePlayers = alivePlayers.filter(p => p.id !== currentData.currentSeeker.id);

        if (currentData.seekerAttempts >= currentData.maxAttempts || nonSeekerAlivePlayers.length === 0) {
          seekCollector.stop();
        }
      });

      seekCollector.on('end', async () => {
        let currentData = has_play.get(message.guild.id);
        if (!currentData) return;

        await seekMsg.edit({ components: [] }).catch(() => {});

        const alivePlayers = currentData.players.filter(p => p.isAlive);
        const nonSeekerAlivePlayers = alivePlayers.filter(p => p.id !== currentData.currentSeeker.id);

        if (nonSeekerAlivePlayers.length === 0) {

          await announceWinner(message, currentData.currentSeeker);
          has_play.delete(message.guild.id);
        } else if (currentData.seekerAttempts >= currentData.maxAttempts) {

          await message.channel.send(`⏰ **<@${currentData.currentSeeker.id}>** لم يجد جميع اللاعبين! الانتقال للجولة التالية...`);
          

          currentData.currentSeeker.isAlive = false;
          currentData.eliminatedPlayers.push(currentData.currentSeeker);
          
          currentData.currentRound++;
          has_play.set(message.guild.id, currentData);
          
          setTimeout(() => {
            startNewRound(message);
          }, 3000);
        }
      });

    } catch (error) {
     
    }
  }


  function disableButton(rows, spotNumber, newEmoji, newStyle) {
    return rows.map(row => {
      const updatedComponents = row.components.map(button => {
        if (button.data.custom_id === `seek_spot_${spotNumber}`) {
          return createButton(newStyle, button.data.custom_id, button.data.label, newEmoji, true);
        }
        return button;
      });
      return new ActionRowBuilder().addComponents(...updatedComponents);
    });
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
        console.warn('⚠️ Failed to fetch user from API, using stored avatar:', fetchError.message);
        avatarURL = winner.avatar || winner.avatarURL;
      }

     
      
      const winnerImage = await generateHideWinnerImage(winner.displayName, avatarURL, message.guild.id);
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
        content: `🎉 **تهانينا <@${winner.id}>!** 🏆`, 
        files: [attachment],
        components: [row]
      });

    } catch (error) {
     
      await message.channel.send(`🎉 **تهانينا <@${winner.id}>!** 🏆`);
    }
  }


  async function generateHideWinnerImage(playerName, avatarURL, guildId) {
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
        console.warn('⚠️ Background loading failed, using gradient fallback:', error.message);
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
        console.warn('⚠️ Invalid avatar URL, using default avatar');
        avatar = await createHideDefaultAvatar();
      } else {
        try {
         
          
          const loadPromise = loadImage(avatarURL);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Avatar load timeout')), 10000)
          );
          
          avatar = await Promise.race([loadPromise, timeoutPromise]);
        
        } catch (avatarError) {
          console.warn('❌ Failed to load avatar from URL:', avatarError.message);
         
          avatar = await createHideDefaultAvatar();
        }
      }


      const avatarSize = 720;
      const avatarX = 962;
      const avatarY = 68;
      
      
      
      drawHideCircularImageWithBorder(ctx, avatar, avatarX, avatarY, avatarSize);


      ctx.font = '90px cairo';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const textName = playerName || 'فائز الاختباء';
      const textX = 275 + avatarSize + 280;
      const textY = 985;

      ctx.strokeText(textName, textX, textY - 100);
      ctx.fillText(textName, textX, textY - 100);
     

      return canvas.toBuffer();
    } catch (error) {
     
     
      return await createEmergencyHideWinnerImage(playerName);
    }
  }


  function drawHideCircularImageWithBorder(ctx, image, x, y, size) {
    try {
     
      
      if (!image) {
        throw new Error('Image object is null or undefined');
      }


      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 12, 0, Math.PI * 2, true);
      ctx.fillStyle = '#3498DB';
      ctx.fill();
      ctx.restore();
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 6, 0, Math.PI * 2, true);
      ctx.fillStyle = '#2980B9';
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
        console.warn('⚠️ Image dimensions are invalid');
        ctx.fillStyle = '#34495E';
        ctx.fillRect(x, y, size, size);
      }
      
      ctx.restore();
      
    } catch (error) {
     
     
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.fillStyle = '#34495E';
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 60px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🫥', x + size / 2, y + size / 2);
      
      ctx.restore();
    }
  }


  async function createHideDefaultAvatar() {
    try {
      const canvas = createCanvas(720, 720);
      const ctx = canvas.getContext('2d');
      

      const gradient = ctx.createRadialGradient(360, 360, 0, 360, 360, 360);
      gradient.addColorStop(0, '#3498DB');
      gradient.addColorStop(0.5, '#5DADE2');
      gradient.addColorStop(1, '#2980B9');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 720, 720);
      

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 200px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🫥', 360, 360);
      
    
      return canvas;
    } catch (error) {
      
      const canvas = createCanvas(720, 720);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#34495E';
      ctx.fillRect(0, 0, 720, 720);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 100px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 360, 360);
      return canvas;
    }
  }


  async function createEmergencyHideWinnerImage(playerName) {
    try {
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');
      

      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, '#3498DB');
      gradient.addColorStop(0.5, '#5DADE2');
      gradient.addColorStop(1, '#2980B9');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 400);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 فائز لعبة الاختباء 🏆', 400, 150);
      
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
      let games = await dbq.get(`hidegames_${guildId}.${userId}`) || 0;
      await dbq.set(`hidegames_${guildId}.${userId}`, games + 1);

      if (won) {
        let wins = await dbq.get(`hidewins_${guildId}.${userId}`) || 0;
        await dbq.set(`hidewins_${guildId}.${userId}`, wins + 1);
      }
    } catch (error) {
     
    }
  }


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "ايقاف_هايد") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      const mgamess = await dbq.get(`managergames_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات لإيقاف اللعبة.");
      }

      let data = has_play.get(message.guild.id);
      if (data && data.type === "hide") {
        has_play.delete(message.guild.id);
        await message.reply('⌛ | تم إيقاف لعبة الاختباء بنجاح.');
      } else {
        message.reply('❌ | لا يوجد لعبة اختباء قيد التشغيل.');
      }
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "حالة_هايد") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      let data = has_play.get(message.guild.id);
      if (!data || data.type !== "hide") {
        return message.reply('❌ | لا يوجد لعبة اختباء قيد التشغيل.');
      }

      const alivePlayers = data.players.filter(p => p.isAlive);
      let statusText = `📊 **حالة لعبة الاختباء:**\n\n`;
      statusText += `🎮 **الحالة:** ${data.gameState === "waiting" ? "انتظار اللاعبين" : "جاري اللعب"}\n`;
      statusText += `🔄 **الجولة:** ${data.currentRound}\n`;
      statusText += `👥 **اللاعبين الأحياء:** ${alivePlayers.length}/${data.players.length}\n`;
      
      if (data.gameState === "playing" && data.currentSeeker) {
        statusText += `🔍 **الباحث:** ${data.currentSeeker.displayName}\n`;
        statusText += `🎯 **محاولاته:** ${data.seekerAttempts}/${data.maxAttempts}\n`;
        
        statusText += `\n**اللاعبين المتبقين:**\n`;
        alivePlayers.forEach(player => {
          const hideStatus = player.id === data.currentSeeker.id ? "(باحث)" : 
                           data.hidingSpots[player.id] ? `(مكان ${data.hidingSpots[player.id]})` : "(لم يختر)";
          statusText += `• ${player.displayName} ${hideStatus}\n`;
        });
      }

      await message.reply({ content: statusText });
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "احصائيات_هايد") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      const targetUser = message.mentions.users.first() || message.author;
      
      let hideWins = await dbq.get(`hidewins_${message.guild.id}.${targetUser.id}`) || 0;
      let hideGames = await dbq.get(`hidegames_${message.guild.id}.${targetUser.id}`) || 0;
      let groupGamePoints = await dbq.get(`groupgamepoints_${message.guild.id}.${targetUser.id}`) || 0;

      const winRate = hideGames > 0 ? ((hideWins / hideGames) * 100).toFixed(1) : '0.0';
      
      let statsText = `📊 **إحصائيات الاختباء - ${targetUser.displayName}:**\n\n`;
      statsText += `🏆 **الانتصارات:** ${hideWins}\n`;
      statsText += `🎮 **الألعاب:** ${hideGames}\n`;
      statsText += `📈 **معدل الفوز:** ${winRate}%\n`;
      statsText += `🎯 **النقاط الجماعية:** ${groupGamePoints}\n`;

      if (hideGames > 0) {
        if (winRate >= 70) statsText += `🥇 **الرتبة:** خبير إخفاء`;
        else if (winRate >= 50) statsText += `🥈 **الرتبة:** محترف`;
        else if (winRate >= 30) statsText += `🥉 **الرتبة:** متوسط`;
        else statsText += `😅 **الرتبة:** مبتدئ`;
      } else {
        statsText += `🆕 **الرتبة:** لاعب جديد`;
      }

      await message.reply({ content: statsText });
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "توب_هايد") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      try {
        const allData = await dbq.get(`hidewins_${message.guild.id}`) || {};
        
        if (Object.keys(allData).length === 0) {
          return message.reply('❌ | لا توجد إحصائيات متاحة بعد!');
        }

        const sortedPlayers = Object.entries(allData)
          .map(([userId, wins]) => ({ userId, wins }))
          .sort((a, b) => b.wins - a.wins)
          .slice(0, 10);

        let topText = `🏆 **أفضل 10 لاعبين في الاختباء:**\n\n`;
        
        for (let i = 0; i < sortedPlayers.length; i++) {
          const player = sortedPlayers[i];
          const user = await client.users.fetch(player.userId).catch(() => null);
          const userName = user ? user.displayName : 'مستخدم محذوف';
          
          const games = await dbq.get(`hidegames_${message.guild.id}.${player.userId}`) || 0;
          const winRate = games > 0 ? ((player.wins / games) * 100).toFixed(1) : '0.0';
          
          let emoji = '';
          if (i === 0) emoji = '🥇';
          else if (i === 1) emoji = '🥈';
          else if (i === 2) emoji = '🥉';
          else emoji = `**${i + 1}.**`;
          
          topText += `${emoji} **${userName}** - ${player.wins} انتصار (${winRate}%)\n`;
        }

        await message.reply({ content: topText });

      } catch (error) {
      
        message.reply('❌ | حدث خطأ أثناء جلب البيانات.');
      }
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "وقت_هايد") {
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

      await dbq.set(`timerhide_${message.author.id}`, newTime * 1000);
      await message.reply(`✅ | تم تعديل وقت الانضمام إلى ${newTime} ثانية.`);
    }
  });
}

module.exports = { execute };
