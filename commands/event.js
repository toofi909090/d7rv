const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { Canvas } = require("canvas-constructor/napi-rs");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');


const activeEvents = new Map();

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, isGameRunning, setGameRunning, times, setTimes } = utils;
  const canvass = require("canvas-constructor/napi-rs");


  const eventSettings = new Map();



  function drawCircularImage(ctx, image, x, y, size, clip = false) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
  }


  async function createWinImage(winner, guildId) {
    try {
      let backgroundImage;
      const customImage = `./imager/messageimage_${guildId}.png`;
      
      try {
        backgroundImage = await loadImage(customImage);
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

      return canvas.toBuffer();
    } catch (error) {
      console.error('خطأ في إنشاء صورة الفوز:', error);
      return null;
    }
  }


  async function runEventGame(message, gameType, gameFile, questionText, backgroundPath, eventData) {
    try {
      const file = require(`../Games/${gameFile}`);
      const selectedItem = file[Math.floor(Math.random() * file.length)];
      const filter = s => selectedItem.jwab.some(answer => answer.toLowerCase() === s.content.toLowerCase());

      let backgroundImage;
      const customImage = `./imager/sbgrouns_${message.guild.id}.png`;
      
      try {
        backgroundImage = await canvass.loadImage(customImage);
      } catch (error) {
        backgroundImage = await canvass.loadImage(backgroundPath);
      }

      async function createCanvas() {
        const background = await canvass.loadImage(backgroundImage);
        const name = new Canvas(2560, 1080)
          .printImage(background, 0, 0, 2560, 1080)
          .setColor("#FFFFFF")
          .setTextFont("bold 120px cairo")
          .setTextAlign("center")
          .printText(questionText, 1320, 250)
          .pngAsync();

        const questionContent = selectedItem.sheh || selectedItem.break || selectedItem.trteb || selectedItem.ans || selectedItem.text;
        const question = new Canvas(2560, 1080)
          .printImage(await canvass.loadImage(await name), 0, 0, 2560, 1050)
          .setColor("#FFFFFF")
          .setTextFont("bold 120px cairo")
          .setTextAlign("center")
          .printText(questionContent, 1280, 600)
          .pngAsync();

        const timeCanvas = new Canvas(2560, 1080)
          .printImage(await canvass.loadImage(await question), 0, 0, 2560, 1050)
          .setColor("#FFFFFF")
          .setTextFont("bold 80px cairo")
          .setTextAlign("center")
          .printText(`لديك 15 ثانية`, 1200, 925)
          .pngAsync();

        return timeCanvas;
      }
      
      const attachment = new AttachmentBuilder(await createCanvas(), {
        name: "Njm-Store.png"
      });

      await message.channel.send({ files: [attachment] });
      
      return new Promise((resolve) => {
        message.channel.awaitMessages({ filter, max: 1, time: 15 * 1000, errors: ['time'] })
          .then(async collected => {
            const winner = collected.first().author;
            
            if (!eventData.playerScores.has(winner.id)) {
              eventData.playerScores.set(winner.id, { 
                username: winner.username, 
                score: 0, 
                avatar: winner.displayAvatarURL({ extension: "png", format: 'png', size: 512, forceStatic: true }) 
              });
            }
            
            const playerData = eventData.playerScores.get(winner.id);
            playerData.score += 1;
            eventData.playerScores.set(winner.id, playerData);

            let userPoints = await dbq.get(`points_${message.guild.id}.${winner.id}`) || 0;
            userPoints += 1;
            await dbq.set(`points_${message.guild.id}.${winner.id}`, userPoints);

            if (playerData.score >= eventData.targetScore) {
              const winnerData = {
                username: winner.username,
                avatar: winner.displayAvatarURL({ extension: "png", format: 'png', size: 512, forceStatic: true })
              };
              
              const winImage = await createWinImage(winnerData, message.guild.id);
              
              if (winImage) {
                message.channel.send({ 
               
                });
              } else {
                message.channel.send(`:crown: فاز <@${winner.id}> - نقاط الفعالية: **${playerData.score}/${eventData.targetScore}**`);
              }
            } else {
              message.channel.send(`:crown: فاز <@${winner.id}> - نقاط الفعالية: **${playerData.score}/${eventData.targetScore}**`);
            }
            
            resolve({ winner: winner.id, answered: true, targetReached: playerData.score >= eventData.targetScore });
          })
          .catch(() => {
            message.channel.send(`**❌ لا يوجد فائز - الإجابة: ${selectedItem.jwab}**`);
            resolve({ winner: null, answered: false, targetReached: false });
          });
      });
    } catch (error) {
      console.error('خطأ في تشغيل اللعبة:', error);
      return { winner: null, answered: false, targetReached: false };
    }
  }


  async function runCompanyEventGame(message, eventData) {
    try {
      const file = require('../Games/company.json');
      const selectedFlag = file[Math.floor(Math.random() * file.length)];
      const filter = s => selectedFlag.jwab.some(answer => answer.toLowerCase() === s.content.toLowerCase());

      let backgroundImage;
      const image = `./imager/sbimagecf_${message.guild.id}.png`;
      
      try {
        backgroundImage = await canvass.loadImage(image);
      } catch (error) {
        backgroundImage = await canvass.loadImage(`./photo/answer.png`);
      }

      async function createCanvas() {
        const background = await canvass.loadImage(backgroundImage);
        const flagImageURL = selectedFlag.flag;
        const flagImage = await canvass.loadImage(flagImageURL);
        
        const name = new Canvas(2560, 1080)
          .printImage(background, 0, 0, 2560, 1080)
          .setColor("#FFFFFF")
          .setTextFont("bold 120px cairo")
          .setTextAlign("center")
          .printText(`اول من يكتب اسم الشركة`, 1320, 250)
          .pngAsync();

        const question = new Canvas(2560, 1080)
          .printImage(await canvass.loadImage(await name), 0, 0, 2560, 1050)
          .setColor("#FFFFFF")
          .setTextFont("bold 120px cairo")
          .setTextAlign("center")
          .printImage(flagImage, 975, 400, 450, 450)
          .pngAsync();

        return question;
      }
      
      const attachment = new AttachmentBuilder(await createCanvas(), {
        name: "Njm-Store.png"
      });

      await message.channel.send({ files: [attachment] });
      
      return new Promise((resolve) => {
        message.channel.awaitMessages({ filter, max: 1, time: 15 * 1000, errors: ['time'] })
          .then(async collected => {
            const winner = collected.first().author;
            
            if (!eventData.playerScores.has(winner.id)) {
              eventData.playerScores.set(winner.id, { 
                username: winner.username, 
                score: 0, 
                avatar: winner.displayAvatarURL({ extension: "png", format: 'png', size: 512, forceStatic: true }) 
              });
            }
            
            const playerData = eventData.playerScores.get(winner.id);
            playerData.score += 1;
            eventData.playerScores.set(winner.id, playerData);

            let userPoints = await dbq.get(`points_${message.guild.id}.${winner.id}`) || 0;
            userPoints += 1;
            await dbq.set(`points_${message.guild.id}.${winner.id}`, userPoints);

            if (playerData.score >= eventData.targetScore) {
              const winnerData = {
                username: winner.username,
                avatar: winner.displayAvatarURL({ extension: "png", format: 'png', size: 512, forceStatic: true })
              };
              
              const winImage = await createWinImage(winnerData, message.guild.id);
              
              if (winImage) {
                const winAttachment = new AttachmentBuilder(winImage, { name: "winner.png" });
                message.channel.send({ 
                  content: `:crown: فاز <@${winner.id}> - نقاط الفعالية: **${playerData.score}/${eventData.targetScore}**`, 
                  files: [winAttachment] 
                });
              } else {
                message.channel.send(`:crown: فاز <@${winner.id}> - نقاط الفعالية: **${playerData.score}/${eventData.targetScore}**`);
              }
            } else {
              message.channel.send(`:crown: فاز <@${winner.id}> - نقاط الفعالية: **${playerData.score}/${eventData.targetScore}**`);
            }
            
            resolve({ winner: winner.id, answered: true, targetReached: playerData.score >= eventData.targetScore });
          })
          .catch(() => {
            message.channel.send(`**❌ لا يوجد فائز - الإجابة: ${selectedFlag.jwab}**`);
            resolve({ winner: null, answered: false, targetReached: false });
          });
      });
    } catch (error) {
      console.error('خطأ في تشغيل لعبة الشركات:', error);
      return { winner: null, answered: false, targetReached: false };
    }
  }


  async function runCapitalEventGame(message, eventData) {
    try {
      const file = require('../Games/capital.json');
      const selectedFlag = file[Math.floor(Math.random() * file.length)];
      const filter = s => selectedFlag.jwab.some(answer => answer.toLowerCase() === s.content.toLowerCase());

      let backgroundImage;
      const image = `./imager/sbgrouns_${message.guild.id}.png`;
      
      try {
        backgroundImage = await canvass.loadImage(image);
      } catch (error) {
        backgroundImage = await canvass.loadImage(`./photo/question.png`);
      }

      async function createCanvas() {
        const background = await canvass.loadImage(backgroundImage);
        
        const name = new Canvas(2560, 1080)
          .printImage(background, 0, 0, 2560, 1080)
          .setColor("#FFFFFF")
          .setTextFont("bold 120px cairo")
          .setTextAlign("center")
          .printText(`ماهي عاصمة الدولة `, 1320, 250)
          .pngAsync();

        const question = new Canvas(2560, 1080)
          .printImage(await canvass.loadImage(await name), 0, 0, 2560, 1050)
          .setColor("#FFFFFF")
          .setTextFont("bold 120px cairo")
          .setTextAlign("center")
          .printText(selectedFlag.ans, 1280, 600)
          .pngAsync();

        const times = new Canvas(2560, 1080)
          .printImage(await canvass.loadImage(await question), 0, 0, 2560, 1050)
          .setColor("#FFFFFF")
          .setTextFont("bold 80px cairo")
          .setTextAlign("center")
          .printText(`لديك 15 ثانية`, 1200, 925)
          .pngAsync();

        return times;
      }
      
      const attachment = new AttachmentBuilder(await createCanvas(), {
        name: "Njm-Store.png"
      });

      await message.channel.send({ files: [attachment] });
      
      return new Promise((resolve) => {
        message.channel.awaitMessages({ filter, max: 1, time: 15 * 1000, errors: ['time'] })
          .then(async collected => {
            const winner = collected.first().author;
            
            if (!eventData.playerScores.has(winner.id)) {
              eventData.playerScores.set(winner.id, { 
                username: winner.username, 
                score: 0, 
                avatar: winner.displayAvatarURL({ extension: "png", format: 'png', size: 512, forceStatic: true }) 
              });
            }
            
            const playerData = eventData.playerScores.get(winner.id);
            playerData.score += 1;
            eventData.playerScores.set(winner.id, playerData);

            let userPoints = await dbq.get(`points_${message.guild.id}.${winner.id}`) || 0;
            userPoints += 1;
            await dbq.set(`points_${message.guild.id}.${winner.id}`, userPoints);

            if (playerData.score >= eventData.targetScore) {
              const winnerData = {
                username: winner.username,
                avatar: winner.displayAvatarURL({ extension: "png", format: 'png', size: 512, forceStatic: true })
              };
              
              const winImage = await createWinImage(winnerData, message.guild.id);
              
              if (winImage) {
                const winAttachment = new AttachmentBuilder(winImage, { name: "winner.png" });
                message.channel.send({ 
                  content: `:crown: فاز <@${winner.id}> - نقاط الفعالية: **${playerData.score}/${eventData.targetScore}**`, 
                  files: [winAttachment] 
                });
              } else {
                message.channel.send(`:crown: فاز <@${winner.id}> - نقاط الفعالية: **${playerData.score}/${eventData.targetScore}**`);
              }
            } else {
              message.channel.send(`:crown: فاز <@${winner.id}> - نقاط الفعالية: **${playerData.score}/${eventData.targetScore}**`);
            }
            
            resolve({ winner: winner.id, answered: true, targetReached: playerData.score >= eventData.targetScore });
          })
          .catch(() => {
            message.channel.send(`**❌ لا يوجد فائز - الإجابة: ${selectedFlag.jwab}**`);
            resolve({ winner: null, answered: false, targetReached: false });
          });
      });
    } catch (error) {
      console.error('خطأ في تشغيل لعبة العواصم:', error);
      return { winner: null, answered: false, targetReached: false };
    }
  }


  async function runGameLoop(message, eventData) {

    activeEvents.set(message.guild.id, {
      type: 'event',
      game: eventData.game,
      targetScore: eventData.targetScore,
      startTime: eventData.startTime,
      channelId: message.channel.id,
      active: true
    });

    while (eventData.active) {
      try {

        const eventStatus = activeEvents.get(message.guild.id);
        if (!eventStatus || !eventStatus.active) {
          eventData.active = false;
          break;
        }

        eventData.totalGames++;
        
        let gameResult;
        
        switch (eventData.game) {
          case 'اسرع':
            gameResult = await runEventGame(message, 'اسرع', 'fast.json', 'اسرع شخص يكتب الاسم', './photo/question.png', eventData);
            break;
          case 'شركة':
            gameResult = await runCompanyEventGame(message, eventData);
            break;
          case 'فكك':
            gameResult = await runEventGame(message, 'فكك', 'Break.json', 'اسرع شخص يفكك الاسم', './photo/question.png', eventData);
            break;
          case 'ترتيب':
            gameResult = await runEventGame(message, 'ترتيب', 'trteb.json', 'اسرع شخص يرتب الارقام', './photo/question.png', eventData);
            break;
          case 'صحح':
            gameResult = await runEventGame(message, 'صحح', 'sheh.json', 'اسرع شخص يصحح الاسم', './photo/question.png', eventData);
            break;
          case 'اعكس':
            gameResult = await runEventGame(message, 'اعكس', 'opposite.json', 'اسرع شخص يعكس الاسم', './photo/question.png', eventData);
            break;
          case 'حرف':
            gameResult = await runEventGame(message, 'حرف', 'Letter.json', 'اسرع شخص يركب الكلمة', './photo/question.png', eventData);
            break;
          case 'ادمج':
            gameResult = await runEventGame(message, 'ادمج', 'integrate.json', 'اسرع شخص يدمج الكلمة', './photo/question.png', eventData);
            break;
          case 'جمع':
            gameResult = await runEventGame(message, 'جمع', 'plural.json', 'ماهي جمع الكلمة', './photo/question.png', eventData);
            break;
          case 'ضرب':
            gameResult = await runEventGame(message, 'ضرب', 'Multiply.json', 'ماهو ضرب التالي', './photo/question.png', eventData);
            break;
          case 'طرح':
            gameResult = await runEventGame(message, 'طرح', 'Subtract.json', 'ماهو طرح التالي', './photo/question.png', eventData);
            break;
          case 'ترجمة':
            gameResult = await runEventGame(message, 'ترجمة', 'translation.json', 'ماهو ترجمة النص', './photo/question.png', eventData);
            break;
          case 'مفرد':
            gameResult = await runEventGame(message, 'مفرد', 'individual.json', 'ماهو مفرد الكلمة', './photo/question.png', eventData);
            break;
          case 'عواصم':
            gameResult = await runCapitalEventGame(message, eventData);
            break;
          default:
            gameResult = await runEventGame(message, 'اسرع', 'fast.json', 'اسرع شخص يكتب الاسم', './photo/question.png', eventData);
        }

        if (gameResult && gameResult.targetReached) {
          eventData.active = false;
          await showEventResults(message, eventData, gameResult.winner);
          break;
        }

        const nextGameDelay = (gameResult && gameResult.answered) ? 2000 : 3000;
        await new Promise(resolve => setTimeout(resolve, nextGameDelay));

      } catch (error) {
        console.error('خطأ في حلقة الألعاب:', error);
        eventData.active = false;
        message.channel.send('❌ حدث خطأ في الفعالية. سيتم إنهاؤها.');
        break;
      }
    }


    activeEvents.delete(message.guild.id);
  }


  async function showEventResults(message, eventData, winnerId) {
    const sortedPlayers = Array.from(eventData.playerScores.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.score - a.score);

    const winner = sortedPlayers.find(player => player.userId === winnerId);

    if (winner) {
      const championImage = await createWinImage({
        username: winner.username,
        avatar: winner.avatar
      }, message.guild.id);

      if (championImage) {
        const championAttachment = new AttachmentBuilder(championImage, { name: "champion.png" });
        await message.channel.send({
          content: `@here\n🏆 **فاز في الفعالية:** <@${winner.userId}>\n🎯 **وصل إلى:** ${winner.score} نقطة!`,
          files: [championAttachment]
        });
      }
    }

    const resultsEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🕹 نتائج الأيفنت")
      .setTimestamp();

    if (sortedPlayers.length > 0) {
      const resultsList = sortedPlayers.map((player, index) => {
        const position = index + 1;
        let medal = "";
        
        if (position === 1) medal = "🥇";
        else if (position === 2) medal = "🥈";
        else if (position === 3) medal = "🥉";
        else medal = "🏅";
        
        return `#${position} <@${player.userId}> : ${player.score} ${medal}`;
      }).join('\n');

      if (resultsList.length <= 4096) {
        resultsEmbed.setDescription(resultsList);
      } else {
        const chunks = resultsList.match(/[\s\S]{1,4000}/g) || [];
        resultsEmbed.setDescription(chunks[0]);
        
        for (let i = 1; i < chunks.length && i < 3; i++) {
          const extraEmbed = new EmbedBuilder()
            .setColor("#FFFFFF")
            .setDescription(chunks[i]);
          await message.channel.send({ embeds: [extraEmbed] });
        }
      }
    } else {
      resultsEmbed.setDescription("لم يشارك أي لاعب في هذه الفعالية");
    }

    await message.channel.send({ embeds: [resultsEmbed] });
  }


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "ايقاف_ايفنت" || args[0] === prefix + "ايقاف_event") {
      const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات لإيقاف الإيفنت.");
      }


      if (activeEvents.has(message.guild.id)) {
        const eventData = activeEvents.get(message.guild.id);
        

        eventData.active = false;
        activeEvents.delete(message.guild.id);


        try {
          const messages = await message.channel.messages.fetch({ limit: 20 });
          const eventMessages = messages.filter(msg => 
            msg.author.id === client.user.id && 
            msg.components && 
            msg.components.length > 0
          );

          for (const [id, msg] of eventMessages) {

            const disabledComponents = msg.components.map(row => {
              const newRow = new ActionRowBuilder();
              row.components.forEach(component => {
                if (component.type === 2) {
                  const disabledButton = new ButtonBuilder()
                    .setCustomId(component.customId || 'disabled')
                    .setLabel(component.label || '•')
                    .setStyle(component.style)
                    .setDisabled(true);
                  
                  if (component.emoji) {
                    disabledButton.setEmoji(component.emoji);
                  }
                  
                  newRow.addComponents(disabledButton);
                }
              });
              return newRow;
            });

            await msg.edit({ 
              content: `❌ **تم إيقاف الإيفنت**`,
              embeds: msg.embeds,
              components: disabledComponents
            }).catch(console.error);
          }
        } catch (error) {
          console.error('خطأ في تعطيل أزرار الإيفنت:', error);
        }

        await message.reply(`⌛ | تم إيقاف الإيفنت بواسطة <@${message.author.id}>`);
      } else {
        message.reply('❌ | لا يوجد إيفنت قيد التشغيل.');
      }
    }
  });


  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;
    
    if (message.content.startsWith(prefix + 'ايفنت')) {
      const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) return;

      const games = [
        { label: "🎮 اسرع", value: "اسرع", description: "لعبة كتابة الكلمة بأسرع وقت" },
        { label: "🎮 شركة", value: "شركة", description: "تخمين اسم الشركة من الصورة" },
        { label: "🎮 فكك", value: "فكك", description: "تفكيك الكلمات" },
        { label: "🎮 ترتيب", value: "ترتيب", description: "ترتيب الأرقام" },
        { label: "🎮 صحح", value: "صحح", description: "تصحيح الأسماء" },
        { label: "🎮 اعكس", value: "اعكس", description: "عكس الكلمات" },
        { label: "🎮 حرف", value: "حرف", description: "تركيب الكلمات من الحروف" },
        { label: "🎮 ادمج", value: "ادمج", description: "دمج الكلمات" },
        { label: "🎮 جمع", value: "جمع", description: "جمع الكلمات" },
        { label: "🎮 ضرب", value: "ضرب", description: "عمليات الضرب" },
        { label: "🎮 طرح", value: "طرح", description: "عمليات الطرح" },
        { label: "🎮 ترجمة", value: "ترجمة", description: "ترجمة النصوص" },
        { label: "🎮 مفرد", value: "مفرد", description: "مفرد الكلمات" },
        { label: "🎮 عواصم", value: "عواصم", description: "عواصم الدول" }
      ];

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("select_event_game")
        .setPlaceholder("اختر اللعبة للفعالية")
        .addOptions(games);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setThumbnail("https://i.ibb.co/MxgdcTst/confetti.png")
        .setTitle("🎮 إنشاء ايفنت ألعاب")
        .setDescription("يرجى اختيار اللعبة التي تريد تشغيلها ايفنت")
        .setFooter({ text: "الحد الاقل للنقاط 5 نقاط" });

      const msg = await message.channel.send({ embeds: [embed], components: [row] });

      const filter = (interaction) => 
        interaction.isStringSelectMenu() && 
        interaction.customId === "select_event_game" && 
        interaction.user.id === message.author.id;
      
      const collector = msg.createMessageComponentCollector({ filter, time: 120 * 1000 });

      collector.on("collect", async (interaction) => {
        const selectedGame = interaction.values[0];
        
        collector.stop('gameSelected');
        
        const eventId = `${message.guild.id}_${Date.now()}`;
        eventSettings.set(eventId, {
          game: selectedGame,
          targetScore: null,
          authorId: message.author.id,
          guildId: message.guild.id,
          channelId: message.channel.id
        });

        const controlButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`set_target_score_${eventId}`)
              .setLabel("تحديد النقاط")
              .setEmoji("<:setting:1398678331809071355>")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`start_event_${eventId}`)
              .setLabel("بدء الفعالية")
              .setEmoji("<:play:1398678329069928657>")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(`cancel_event_${eventId}`)
              .setLabel("إلغاء")
              .setEmoji("<:cross:1398678334573117531>")
              .setStyle(ButtonStyle.Secondary)
          );

        const setupEmbed = new EmbedBuilder()
          .setColor("#FFFFFF")
          .setTitle("⚙️ إعداد الفعالية")
          .setDescription(`**اللعبة المختارة:** ${selectedGame}`)
          .addFields(
            { name: "📍 النقاط المطلوبة", value: "غير محددة", inline: true },
            { name: "الحالة", value: "في انتظار تحديد النقاط", inline: true }
          )
          .setFooter({ text: "يجب تحديد النقاط قبل بدء الفعالية (الحد الأقل 5 نقاط)" });

        await interaction.update({ embeds: [setupEmbed], components: [controlButtons] });
      });

      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          msg.edit({ content: "❌ انتهى الوقت ولم يتم اختيار أي لعبة.", embeds: [], components: [] });
        }
      });
    }
  });


  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;


    if (interaction.customId.startsWith('set_target_score_')) {
      const eventId = interaction.customId.replace('set_target_score_', '');
      const eventData = eventSettings.get(eventId);
      
      if (!eventData || eventData.authorId !== interaction.user.id) {
        return interaction.reply({ content: "❌ ليس لديك صلاحية لتعديل هذه الفعالية.", ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`score_modal_${eventId}`)
        .setTitle("تحديد النقاط المطلوبة");

      const scoreInput = new TextInputBuilder()
        .setCustomId('target_score_input')
        .setLabel('عدد النقاط المطلوبة للفوز')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('أدخل رقم من 5 إلى 100')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(3);

      const firstActionRow = new ActionRowBuilder().addComponents(scoreInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    }


    if (interaction.customId.startsWith('score_modal_')) {
      const eventId = interaction.customId.replace('score_modal_', '');
      const eventData = eventSettings.get(eventId);
      
      if (!eventData) {
        return interaction.reply({ content: "❌ الفعالية غير موجودة.", ephemeral: true });
      }

      const targetScore = parseInt(interaction.fields.getTextInputValue('target_score_input'));
      
      if (isNaN(targetScore) || targetScore < 5) {
        return interaction.reply({ content: "❌ يجب أن يكون عدد النقاط رقماً صحيحاً أكبر من أو يساوي 5.", ephemeral: true });
      }

      eventData.targetScore = targetScore;
      eventSettings.set(eventId, eventData);

      const controlButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`set_target_score_${eventId}`)
            .setLabel("تحديد النقاط")
            .setEmoji("<:setting:1398678331809071355>")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`start_event_${eventId}`)
            .setLabel("بدء الفعالية")
            .setEmoji("<:play:1398678329069928657>")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(false),
          new ButtonBuilder()
            .setCustomId(`cancel_event_${eventId}`)
            .setLabel("إلغاء")
            .setEmoji("<:cross:1398678334573117531>")
            .setStyle(ButtonStyle.Secondary)
        );

      const setupEmbed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("⚙️ إعداد الفعالية")
        .setDescription(`**اللعبة المختارة:** ${eventData.game}`)
        .addFields(
          { name: "📍النقاط المطلوبة", value: `${targetScore} نقطة`, inline: true },
          { name: "الحالة", value: "جاهزة للبدء", inline: true }
        )
        .setFooter({ text: "اضغط على بدء الفعالية للبدء" });

      await interaction.update({ embeds: [setupEmbed], components: [controlButtons] });
    }


    if (interaction.customId.startsWith('start_event_')) {
      const eventId = interaction.customId.replace('start_event_', '');
      const eventData = eventSettings.get(eventId);
      
      if (!eventData || eventData.authorId !== interaction.user.id) {
        return interaction.reply({ content: "❌ ليس لديك صلاحية لبدء هذه الفعالية.", ephemeral: true });
      }

      if (!eventData.targetScore || eventData.targetScore < 5) {
        return interaction.reply({ content: "❌ يجب تحديد النقاط أولاً (الحد الأدنى 5 نقاط).", ephemeral: true });
      }

      const startEmbed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("🚀 بدأ الأيفنت!")
        .setDescription(`**اللعبة:** ${eventData.game}\n**النقاط المطلوبة:** ${eventData.targetScore} نقطة\n\n🎯 أول شخص يصل إلى ${eventData.targetScore} نقطة يفوز!`)
        .setTimestamp();

      await interaction.update({ embeds: [startEmbed], components: [] });

      const gameEventData = {
        game: eventData.game,
        targetScore: eventData.targetScore,
        playerScores: new Map(),
        startTime: Date.now(),
        totalGames: 0,
        active: true
      };

      const message = await interaction.followUp({ content: "⏳ جاري تحضير أول سؤال..." });
      await runGameLoop(message, gameEventData);

      eventSettings.delete(eventId);
    }


    if (interaction.customId.startsWith('cancel_event_')) {
      const eventId = interaction.customId.replace('cancel_event_', '');
      const eventData = eventSettings.get(eventId);
      
      if (!eventData || eventData.authorId !== interaction.user.id) {
        return interaction.reply({ content: "❌ ليس لديك صلاحية لإلغاء هذه الفعالية.", ephemeral: true });
      }

      eventSettings.delete(eventId);
      
      const cancelEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ تم إلغاء الأيفنت")
        .setDescription("تم إلغاء إعداد الأيفنت بنجاح.")
        .setTimestamp();

      await interaction.update({ embeds: [cancelEmbed], components: [] });
    }
  });
}


module.exports = { execute, activeEvents };
