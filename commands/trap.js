const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "فخ" || args[0] === prefix + "لغم") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) return;
      
      if (has_play.get(message.guild.id)) {
        return message.reply({ content: `❌ هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      }


      const storedTime = await dbq.get(`timertrap_${message.author.id}`) || 30000;
      let data = {
        author: message.author.id,
        players: [],
        start_in: Date.now() + storedTime,
        type: "trap",
        maxPlayers: 15,
        minPlayers: 3,
        gameState: "waiting",
        currentPlayerIndex: 0,
        mines: [],
        pressedButtons: [],
        roundNumber: 1,
        eliminatedPlayers: []
      };


      let attachment;
      const trapImage = `./imager/trapimage_${message.guild.id}.png`;
      
      try {
        if (fs.existsSync(trapImage)) {
          attachment = new AttachmentBuilder(trapImage);
        } else {
          attachment = new AttachmentBuilder(`./photo/trap.png`);
        }
      } catch (error) {
        attachment = new AttachmentBuilder(`./photo/trap.png`);
      }

      let content_time1 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`;
      let content_players1 = `**(0 / ${data.maxPlayers})**`;


      let row = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "join_trap", "دخول", '1243848352026591274'),
          createButton("SECONDARY", "leave_trap", "خروج", '1243848354535047230'),
          createButton("SECONDARY", "explain_trap", "طريقة العبة", '1399549609981776043')
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

        if (inter.customId === "join_trap") {
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
            buttonsPressed: 0
          });
          
          has_play.set(message.guild.id, data);
          
          await updateCounter();
          inter.reply({ content: `✅ تم انضمامك للعبة بنجاح!`, ephemeral: true });

        } else if (inter.customId === "leave_trap") {
          let playerIndex = data.players.findIndex(p => p.id === inter.user.id);
          if (playerIndex === -1) {
            return inter.reply({ content: `أنت لست منضماً للعبة!`, ephemeral: true });
          }

          data.players.splice(playerIndex, 1);
          
          if (playerIndex <= data.currentPlayerIndex && data.currentPlayerIndex > 0) {
            data.currentPlayerIndex--;
          }
          
          has_play.set(message.guild.id, data);
          await updateCounter();
          inter.reply({ content: `✅ تم خروجك من اللعبة.`, ephemeral: true });

        } else if (inter.customId === "explain_trap") {
          inter.reply({
            content: `
**💣 طريقة لعب الألغام:**

🎯 **الهدف:** كن آخر لاعب متبقي!

⚡ **القواعد الجديدة:**
• كل لاعب لديه **قلب واحد فقط** ❤️
• عدد الأزرار = عدد اللاعبين + 2
• يوجد **لغم واحد مخفي** 💥
• اللاعبون يضغطون بالتناوب
• الضغط على لغم = **خروج فوري** ☠️

🎮 **آلية اللعب:**
• دور كل لاعب: 30 ثانية للاختيار
• الزر الآمن يبقيك في اللعبة
• انتهاء الوقت = خروج من اللعبة
• في الجولة التالية: موقع لغم جديد

🏆 **الفوز:** آخر لاعب متبقي يفوز!

🎮 **المكافآت:**
• البقاء في الجولة = +1 نقطة ألعاب جماعية
• الفوز = +3 نقاط ألعاب جماعية إضافية

💡 **استراتيجية:** اختر بحذر شديد!`,
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
            content: `**تم إيقاف اللعبة لعدم وجود **${data.minPlayers}** لاعبين على الأقل - ⛔.**` 
          });
        }

        message.channel.send({ content: `⏳ **تم تسجيل اللاعبين سوف تبدأ اللعبة قريباً.**` });
        
        setTimeout(() => {
          startTrapGame(message);
        }, 5000);
      });
    }
  });


  async function startTrapGame(message) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data || data.players.length === 0) return;

      data.gameState = "playing";
      data.currentPlayerIndex = 0;
      

      data.gridSize = data.players.length + 2;
      

      generateMines(data);
      
      data.pressedButtons = [];
      has_play.set(message.guild.id, data);

      await startGameRound(message);
    } catch (error) {
      console.error('Error starting trap game:', error);
      message.channel.send('❌ حدث خطأ أثناء بدء اللعبة.');
      has_play.delete(message.guild.id);
    }
  }


  function generateMines(data) {
    data.mines = [];
    const randomPos = Math.floor(Math.random() * data.gridSize);
    data.mines.push(randomPos);
  }


  async function startGameRound(message) {
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


      if (data.currentPlayerIndex >= alivePlayers.length) {
        data.currentPlayerIndex = 0;
      }
      const currentPlayer = alivePlayers[data.currentPlayerIndex];


      const gameRows = createDynamicGameGrid(data);


      const gameMsg = await message.channel.send({
        content: `💣 **دور** <@${currentPlayer.id}> - اختر زراً بحذر!\n📦 **الأزرار المتبقية:** ${data.gridSize - data.pressedButtons.length}/${data.gridSize}`,
        components: gameRows
      });


      const gameCollector = gameMsg.createMessageComponentCollector({ 
        filter: i => i.user.id === currentPlayer.id,
        time: 30000 
      });

      gameCollector.on('collect', async inter => {
        await handleButtonPress(message, inter, gameCollector, gameMsg, currentPlayer);
      });

      gameCollector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          await handleTimeOut(message, currentPlayer, gameMsg);
        }
      });

    } catch (error) {
      console.error('Error in game round:', error);
    }
  }


  function createDynamicGameGrid(data) {
    const rows = [];
    const buttonsPerRow = 5;
    const totalRows = Math.ceil(data.gridSize / buttonsPerRow);

    for (let row = 0; row < totalRows; row++) {
      const actionRow = new ActionRowBuilder();
      const startIndex = row * buttonsPerRow;
      const endIndex = Math.min(startIndex + buttonsPerRow, data.gridSize);

      for (let i = startIndex; i < endIndex; i++) {
        const isPressed = data.pressedButtons.includes(i);
        const isMine = data.mines.includes(i);
        
        let style = "SECONDARY";
        let emoji = '📦';
        let disabled = isPressed;
        
        if (isPressed) {
          if (isMine) {
            style = "DANGER";
            emoji = '💥';
          } else {
            style = "SUCCESS";
            emoji = '✅';
          }
        }
        
        actionRow.addComponents(
          createButton(style, `trap_btn_${i}`, `${i + 1}`, emoji, disabled)
        );
      }
      rows.push(actionRow);
    }
    return rows;
  }


  async function handleButtonPress(message, inter, collector, gameMsg, currentPlayer) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data) return;

      const buttonIndex = parseInt(inter.customId.split('_')[2]);


      data.pressedButtons.push(buttonIndex);
      currentPlayer.buttonsPressed++;


      if (data.mines.includes(buttonIndex)) {

        currentPlayer.isAlive = false;
        data.eliminatedPlayers.push(currentPlayer);
        
        await inter.reply(`💥 **ضرب الغم!** <@${currentPlayer.id}> خرج من اللعبة!`);
        

        const alivePlayersCount = data.players.filter(p => p.isAlive).length;
        if (data.currentPlayerIndex >= alivePlayersCount && alivePlayersCount > 0) {
          data.currentPlayerIndex = 0;
        }
      } else {

        await inter.reply(`✅ <@${currentPlayer.id}> اختار زراً آمناً!`);
        

        await giveGroupGamePoints(message.guild.id, currentPlayer.id, 1);
        

        const alivePlayersNew = data.players.filter(p => p.isAlive);
        data.currentPlayerIndex = (data.currentPlayerIndex + 1) % alivePlayersNew.length;
      }

      has_play.set(message.guild.id, data);


      if (!collector.ended) {
        collector.stop();
      }


      const updatedRows = createDynamicGameGrid(data);
      await gameMsg.edit({
        content: `💣 **تم الضغط على الزر ${buttonIndex + 1}**`,
        components: []
      }).catch(() => {});


      if (data.pressedButtons.length === data.gridSize) {
        await startNewRound(message);
      } else {
        setTimeout(() => {
          startGameRound(message);
        }, 2000);
      }

    } catch (error) {
      console.error('Error handling button press:', error);
    }
  }


  async function handleTimeOut(message, currentPlayer, gameMsg) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data) return;


      currentPlayer.isAlive = false;
      data.eliminatedPlayers.push(currentPlayer);
      
      await gameMsg.edit({ 
        content: `⏰ انتهى وقت <@${currentPlayer.id}>!`, 
        components: [] 
      }).catch(() => {});
      
      await message.channel.send(`💀 <@${currentPlayer.id}> خرج من اللعبة بسبب انتهاء الوقت!`);


      const alivePlayersNew = data.players.filter(p => p.isAlive);
      if (alivePlayersNew.length > 0) {
        data.currentPlayerIndex = data.currentPlayerIndex % alivePlayersNew.length;
      }
      
      has_play.set(message.guild.id, data);
      
      setTimeout(() => {
        startGameRound(message);
      }, 2000);

    } catch (error) {
      console.error('Error handling timeout:', error);
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


      data.roundNumber++;
      data.pressedButtons = [];
      data.currentPlayerIndex = 0;
      

      data.gridSize = alivePlayers.length + 2;
      generateMines(data);
      
      has_play.set(message.guild.id, data);

      await message.channel.send(`
🔄 **الجولة ${data.roundNumber}**
👥 **اللاعبين المتبقين:** ${alivePlayers.length}
📦 **عدد الأزرار:** ${data.gridSize}
💣 **لغم جديد:** تم وضع لغم واحد في موقع عشوائي

⏳ بدء الجولة الجديدة...`);

      setTimeout(() => {
        startGameRound(message);
      }, 3000);

    } catch (error) {
      console.error('Error starting new round:', error);
    }
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

      
      const winnerImage = await generateWinnerImage(winner.displayName, avatarURL, message.guild.id);
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
        content: `🎉 **فاز في العبة <@${winner.id}>!** 🏆`, 
        files: [attachment],
        components: [row]
      });

    } catch (error) {
     
      await message.channel.send(`🎉 **فاز في العبة  <@${winner.id}>!** 🏆`);
    }
  }


  async function generateWinnerImage(playerName, avatarURL, guildId) {
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
       
        avatar = await createDefaultAvatar();
      } else {
        try {
         
          

          const loadPromise = loadImage(avatarURL);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Avatar load timeout')), 10000)
          );
          
          avatar = await Promise.race([loadPromise, timeoutPromise]);
        
        } catch (avatarError) {
          
          avatar = await createDefaultAvatar();
        }
      }


      const avatarSize = 720;
      const avatarX = 962;
      const avatarY = 68;
      
     
      

      drawCircularImageWithBorder(ctx, avatar, avatarX, avatarY, avatarSize);


      ctx.font = '90px cairo';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const textName = playerName || 'اللاعب الفائز';
      const textX = 275 + avatarSize + 280;
      const textY = 985;


      ctx.strokeText(textName, textX, textY - 100);
      ctx.fillText(textName, textX, textY - 100);
      
     

      return canvas.toBuffer();
    } catch (error) {

      return await createEmergencyWinnerImage(playerName);
    }
  }


  function drawCircularImageWithBorder(ctx, image, x, y, size) {
    try {
      
      

      if (!image) {
        throw new Error('Image object is null or undefined');
      }


      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 12, 0, Math.PI * 2, true);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.restore();
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 6, 0, Math.PI * 2, true);
      ctx.fillStyle = '#B8860B';
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
        

        ctx.fillStyle = '#4A5568';
        ctx.fillRect(x, y, size, size);
      }
      
      ctx.restore();
      
    } catch (error) {
      
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.fillStyle = '#4A5568';
      ctx.fill();
      

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 60px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👤', x + size / 2, y + size / 2);
      
      ctx.restore();
    }
  }


  async function createDefaultAvatar() {
    try {
      const canvas = createCanvas(720, 720);
      const ctx = canvas.getContext('2d');
      

      const gradient = ctx.createRadialGradient(360, 360, 0, 360, 360, 360);
      gradient.addColorStop(0, '#FF6B6B');
      gradient.addColorStop(0.5, '#FF8E8E');
      gradient.addColorStop(1, '#8B0000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 720, 720);
      

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 200px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👤', 360, 360);
      
     
      return canvas;
    } catch (error) {
      console.error('Error creating default avatar:', error);

      const canvas = createCanvas(720, 720);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#4A5568';
      ctx.fillRect(0, 0, 720, 720);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 100px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 360, 360);
      return canvas;
    }
  }


  async function createEmergencyWinnerImage(playerName) {
    try {
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');
      

      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(0.5, '#FFA500');
      gradient.addColorStop(1, '#FF8C00');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 400);
      

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 فائز لعبة الألغام 🏆', 400, 150);
      
      ctx.font = 'bold 28px cairo';
      ctx.fillText(playerName || 'اللاعب', 400, 250);
      
      return canvas.toBuffer();
    } catch (error) {
      console.error('Emergency winner image creation failed:', error);
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
      let games = await dbq.get(`trapgames_${guildId}.${userId}`) || 0;
      await dbq.set(`trapgames_${guildId}.${userId}`, games + 1);

      if (won) {
        let wins = await dbq.get(`trapwins_${guildId}.${userId}`) || 0;
        await dbq.set(`trapwins_${guildId}.${userId}`, wins + 1);
      }
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  }


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "ايقاف_فخ" || args[0] === prefix + "ايقاف_لغم") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      const mgamess = await dbq.get(`managergames_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات لإيقاف اللعبة.");
      }

      let data = has_play.get(message.guild.id);
      if (data && data.type === "trap") {
        has_play.delete(message.guild.id);
        await message.reply('⌛ | تم إيقاف لعبة الألغام بنجاح.');
      } else {
        message.reply('❌ | لا يوجد لعبة ألغام قيد التشغيل.');
      }
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "statsf5" || args[0] === prefix + "حالة_لغم") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      let data = has_play.get(message.guild.id);
      if (!data || data.type !== "trap") {
        return message.reply('❌ | لا يوجد لعبة ألغام قيد التشغيل.');
      }

      const alivePlayers = data.players.filter(p => p.isAlive);
      let statusText = `📊 **حالة لعبة الألغام:**\n\n`;
      statusText += `🎮 **الحالة:** ${data.gameState === "waiting" ? "انتظار اللاعبين" : "جاري اللعب"}\n`;
      statusText += `🔄 **الجولة:** ${data.roundNumber}\n`;
      statusText += `👥 **اللاعبين الأحياء:** ${alivePlayers.length}/${data.players.length}\n`;
      statusText += `📦 **عدد الأزرار:** ${data.gridSize}\n`;
      statusText += `📦 **الأزرار المضغوطة:** ${data.pressedButtons.length}/${data.gridSize}\n`;
      statusText += `💥 **عدد الألغام:** 1\n\n`;

      if (data.gameState === "playing" && alivePlayers.length > 0) {
        const currentPlayer = alivePlayers[data.currentPlayerIndex];
        statusText += `🎯 **دور:** ${currentPlayer.displayName}\n\n`;
        
        statusText += `**اللاعبين المتبقين:**\n`;
        alivePlayers.forEach(player => {
          statusText += `• ${player.displayName} (${player.buttonsPressed} أزرار)\n`;
        });
      }

      await message.reply({ content: statusText });
    }
  });
}

module.exports = { execute };
