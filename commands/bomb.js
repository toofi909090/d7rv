const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;


  let quizData = [];
  try {
    const quizPath = './Games/quiz.json';
    if (fs.existsSync(quizPath)) {
      quizData = JSON.parse(fs.readFileSync(quizPath, 'utf8'));
    } else {
      console.error('❌ ملف quiz.json غير موجود في مجلد Games');
    }
  } catch (error) {
    console.error('❌ خطأ في تحميل ملف quiz.json:', error);
  }

  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "بومب") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) return;
      
      if (has_play.get(message.guild.id)) {
        return message.reply({ content: `🛑 - هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      }

      if (quizData.length === 0) {
        return message.reply({ content: `لا توجد اسأله متاحه قم فتح تذكره عند الدعم الفني - 📛` });
      }


      const storedTime = await dbq.get(`timerbomb_${message.author.id}`) || 30000;
      let time = storedTime;
      let data = {
        author: message.author.id,
        players: [],
        playerHearts: {},
        currentPlayerIndex: 0,
        start_in: Date.now() + time,
        type: "bomb",
        maxPlayers: 15,
        minPlayers: 3
      };


      let attachment;
      const bombImage = `./imager/bombimage_${message.guild.id}.png`;
      
      try {
        if (fs.existsSync(bombImage)) {
          attachment = new AttachmentBuilder(bombImage);
        } else {
          throw new Error('File not found');
        }
      } catch (error) {
        attachment = new AttachmentBuilder(`./photo/bomb.png`);
      }

      let counter = 0;
      let content_time1 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`;
      let content_players1 = `**(${counter} / ${data.maxPlayers})**`;


      let row = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "join_bomb", "دخول", '1243848352026591274'),
          createButton("SECONDARY", "leave_bomb", "دخول", '1243848354535047230'),
          createButton("SECONDARY", "explain_bomb", "طريقة اللعب", '1399549609981776043')
        )
      ];

      let msg = await message.channel.send({ 
        content: `${content_time1}\n${content_players1}`, 
        files: [attachment], 
        components: row 
      }).catch(() => 0);

      if (!msg) return;
      
      has_play.set(message.guild.id, data);
      let start_c = msg.createMessageComponentCollector({ time: time });

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

        if (inter.customId === "join_bomb") {
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
            avatar: inter.user.displayAvatarURL({ dynamic: true })
          });
          
          data.playerHearts[inter.user.id] = 2;
          has_play.set(message.guild.id, data);
          
          await updateCounter();
          inter.reply({ content: `✅ تم انضمامك للعبة بنجاح! لديك قلبان للبداية.`, ephemeral: true });

        } else if (inter.customId === "leave_bomb") {
          let playerIndex = data.players.findIndex(p => p.id === inter.user.id);
          if (playerIndex === -1) {
            return inter.reply({ content: `أنت لست منضماً للعبة!`, ephemeral: true });
          }

          data.players.splice(playerIndex, 1);
          delete data.playerHearts[inter.user.id];
          

          if (playerIndex <= data.currentPlayerIndex && data.currentPlayerIndex > 0) {
            data.currentPlayerIndex--;
          }
          
          has_play.set(message.guild.id, data);
          
          await updateCounter();
          inter.reply({ content: `✅ تم خروجك من اللعبة.`, ephemeral: true });

        } else if (inter.customId === "explain_bomb") {
          inter.reply({
            content: `
**📋 طريقة لعب البومب:**

🎯 **الهدف:** كن آخر لاعب متبقي!

⚡ **القواعد:**
• كل لاعب يبدأ بـ **2 قلب** ❤️❤️
• يتم اختيار لاعب عشوائي لإجابة سؤال
• لديك **15 ثانية** للإجابة
• إجابة خاطئة أو عدم إجابة = خسارة قلب 💔
• خسارة كل القلوب = خروج من اللعبة ☠️

🏆 **الفوز:** آخر لاعب متبقي يفوز!

📝 **الأسئلة:** أكمل الكلمات الناقصة
مثال: "قط" → الإجابة: "قطة"

🎮 **المكافآت:**
• إجابة صحيحة = +1 نقطة عامة
• الفوز = +3 نقاط عامة إضافية`,
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

        message.channel.send({ content: `⏳ - سيتم بدء اللعبة خلال 5 ثواني...` });
        
        setTimeout(() => {
          startBombGame(message);
        }, 5000);
      });
    }
  });


  async function startBombGame(message) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data || data.players.length === 0) return;


      data.currentPlayerIndex = 0;
      has_play.set(message.guild.id, data);

      await askQuestion(message);
    } catch (error) {
      console.error('Error starting bomb game:', error);
      message.channel.send('❌ حدث خطأ أثناء بدء اللعبة.');
      has_play.delete(message.guild.id);
    }
  }


  async function askQuestion(message) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data) return;


      if (data.players.length === 1) {
        await announceWinner(message, data.players[0]);
        has_play.delete(message.guild.id);
        return;
      }


      if (data.currentPlayerIndex >= data.players.length) {
        data.currentPlayerIndex = 0;
      }

      const currentPlayer = data.players[data.currentPlayerIndex];
      

      const question = quizData[Math.floor(Math.random() * quizData.length)];
      

      const questionImage = await generateQuestionImage(question.partial, currentPlayer.displayName, data.playerHearts[currentPlayer.id]);
      const attachment = new AttachmentBuilder(questionImage, { name: 'roundbomb.png' });


      await message.channel.send({ 
        content: `💥 **<@${currentPlayer.id}>** اكمل الجملة التالية!\n❤️ القلوب المتبقية: ${data.playerHearts[currentPlayer.id]}`, 
        files: [attachment] 
      });


      const filter = response => response.author.id === currentPlayer.id && 
                               response.content.toLowerCase().trim() === question.complete.toLowerCase().trim();
      
      const collector = message.channel.createMessageCollector({ filter, time: 15000 });

      collector.on('collect', async response => {
        try {
          await response.reply('✅ **إجابة صحيحة!** الانتقال إلى اللاعب التالي...');
          

          let generalPoints = await dbq.get(`points_${message.guild.id}.${currentPlayer.id}`) || 0;
          generalPoints += 1;
          await dbq.set(`points_${message.guild.id}.${currentPlayer.id}`, generalPoints);
          
          collector.stop();
          

          data = has_play.get(message.guild.id);
          if (data) {
            data.currentPlayerIndex = (data.currentPlayerIndex + 1) % data.players.length;
            has_play.set(message.guild.id, data);
            
            setTimeout(() => {
              askQuestion(message);
            }, 1000);
          }
        } catch (error) {
          console.error('Error handling correct answer:', error);
        }
      });

      collector.on('end', async collected => {
        try {
          if (!collected.size) {

            data = has_play.get(message.guild.id);
            if (!data) return;
            

            data.playerHearts[currentPlayer.id]--;
            
            if (data.playerHearts[currentPlayer.id] <= 0) {

              const playerIndex = data.players.findIndex(p => p.id === currentPlayer.id);
              if (playerIndex !== -1) {
                data.players.splice(playerIndex, 1);
                delete data.playerHearts[currentPlayer.id];
                

                if (playerIndex <= data.currentPlayerIndex && data.currentPlayerIndex > 0) {
                  data.currentPlayerIndex--;
                }
                

                if (data.currentPlayerIndex >= data.players.length) {
                  data.currentPlayerIndex = 0;
                }
              }
              
              await message.channel.send(`💀 **${currentPlayer.displayName}** فقد كل القلوب وخرج من اللعبة!`);
            } else {
              await message.channel.send(`💔 **${currentPlayer.displayName}** لم يجب بشكل صحيح وفقد قلباً! القلوب المتبقية: ${data.playerHearts[currentPlayer.id]}`);
              

              data.currentPlayerIndex = (data.currentPlayerIndex + 1) % data.players.length;
            }
            

            has_play.set(message.guild.id, data);
            

            setTimeout(() => {
              askQuestion(message);
            }, 1500);
          }
        } catch (error) {
          console.error('Error handling incorrect answer:', error);
        }
      });

    } catch (error) {
      console.error('Error asking question:', error);
      message.channel.send('❌ حدث خطأ أثناء طرح السؤال.');
    }
  }


  async function generateQuestionImage(partialText, playerName, hearts) {
    try {
      const canvas = createCanvas(1322, 486);
      const ctx = canvas.getContext('2d');
      

      let background;
      try {
        background = await loadImage('./photo/roundbomb.png');
      } catch (error) {

        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        

        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        

        ctx.fillStyle = '#E74C3C';
        ctx.font = 'bold 48px cairo';
        ctx.textAlign = 'center';
        ctx.fillText('💣 لعبة البومب 💣', canvas.width / 2, 80);
      }

      if (background) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      }


      ctx.font = 'bold 64px cairo';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      
      ctx.strokeText(partialText, canvas.width / 2, 280);
      ctx.fillText(partialText, canvas.width / 2, 280);


      try {
        const heartImage = await loadImage('./photo/heart.png');
        const heartSize = 40;
        const heartSpacing = 50;
        const totalHeartsWidth = (hearts * heartSize) + ((hearts - 1) * (heartSpacing - heartSize));
        const heartsStartX = (canvas.width / 2) - (totalHeartsWidth / 2);
        const heartsY = 390;
        

        for (let i = 0; i < hearts; i++) {
          const heartX = heartsStartX + (i * heartSpacing);
          ctx.drawImage(heartImage, heartX, heartsY, heartSize, heartSize);
        }
      } catch (error) {

        console.warn('Heart image not found, using text fallback');
        const heartsText = '❤️'.repeat(hearts);
        ctx.font = 'bold 28px cairo';
        ctx.fillStyle = '#ff0000ff';
        ctx.textAlign = 'center';
        ctx.fillText(heartsText, canvas.width / 2, 430);
      }


      ctx.font = 'bold 24px cairo';
      ctx.fillStyle = '#ffffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      
      ctx.strokeText('15 ثانية للإجابة', canvas.width / 2, 470);
      ctx.fillText('15 ثانية للإجابة', canvas.width / 2, 470);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating question image:', error);
      throw new Error('حدث خطأ أثناء إنشاء صورة السؤال.');
    }
  }


  async function announceWinner(message, winner) {
    try {

      const winnerImage = await generateRouletteStyleWinnerImage(winner.displayName, winner.avatar, message.guild.id);
      const attachment = new AttachmentBuilder(winnerImage, { name: 'winner.png' });


      let generalPoints = await dbq.get(`points_${message.guild.id}.${winner.id}`) || 0;
      generalPoints += 3;
      await dbq.set(`points_${message.guild.id}.${winner.id}`, generalPoints);

      const row = new ActionRowBuilder()
        .addComponents(
           createButton("SECONDARY", "winner_points", `🎮 +${pointsEarned} (${totalPoints})`, null, true)
           
        );

      await message.channel.send({ 
        content: `🎉 **تهانينا <@${winner.id}>!** 🏆\n**الفائز   !**`, 
        files: [attachment],
        components: [row]
      });

    } catch (error) {
      console.error('Error announcing winner:', error);
      await message.channel.send(`🎉 **تهانينا ${winner.displayName}!** 🏆\nلقد فزت  !`);
    }
  }


  async function generateRouletteStyleWinnerImage(playerName, avatarURL, guildId) {
    try {
      const canvas = createCanvas(2560, 1080);
      const ctx = canvas.getContext('2d');


      let backgroundImage;
      const winImagePath = `./imager/messageimage_${guildId}.png`;
      
      try {
        if (fs.existsSync(winImagePath)) {
          backgroundImage = await loadImage(winImagePath);
        } else {
          throw new Error('Custom win image not found');
        }
      } catch (error) {

        try {
          backgroundImage = await loadImage('./photo/win.png');
        } catch (fallbackError) {

          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, '#FFD700');
          gradient.addColorStop(0.5, '#FFA500');
          gradient.addColorStop(1, '#FF8C00');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }


      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      }


      let avatar;
      try {
        avatar = await loadImage(avatarURL);
      } catch (error) {

        avatar = await createDefaultAvatar();
      }


      const avatarSize = 720;
      const avatarX = 962;
      const avatarY = 68;
      

      drawCircularImage(ctx, avatar, avatarX, avatarY, avatarSize);


      ctx.font = '90px cairo';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const textName = `${playerName}`;
      const textX = 275 + avatarSize + 280;
      const textY = 985;

      ctx.fillText(textName, textX, textY - 100);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating roulette style winner image:', error);

      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(0, 0, 800, 400);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 48px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 فائز لعبة البومب 🏆', 400, 200);
      return canvas.toBuffer();
    }
  }


  function drawCircularImage(ctx, image, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
  }


  async function createDefaultAvatar() {
    const canvas = createCanvas(720, 720);
    const ctx = canvas.getContext('2d');
    

    const gradient = ctx.createRadialGradient(360, 360, 0, 360, 360, 360);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#2E7D32');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 720, 720);
    

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 200px cairo';
    ctx.textAlign = 'center';
    ctx.fillText('👤', 360, 450);
    
    return canvas;
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


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "ايقاف_بومب") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      const mgamess = await dbq.get(`managergames_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات لإيقاف اللعبة.");
      }

      let data = has_play.get(message.guild.id);
      if (data && data.type === "bomb") {
        has_play.delete(message.guild.id);
        await message.reply('⌛ | تم إيقاف لعبة البومب بنجاح.');
      } else {
        message.reply('❌ | لا يوجد لعبة بومب قيد التشغيل.');
      }
    }
  });
}

module.exports = { execute };
