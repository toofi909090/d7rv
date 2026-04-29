const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;


  const BANNED_WORDS = [

    'زب',  'امك', 'انيك', 'نيك', 'طيز', 'خرا', 'كسمك', 'زبي', 'لحس',
    'متناك', 'شرموط', 'عرص', 'قحب', 'بتاع', 'فرج', 'عير', 'كسختك', 'منيوك',
    'حقير', 'وسخ', 'نذل', 'حيوان', 'قذر', 'منحط', 'حمار', 'خنزير', 'كلب',
    'ابن الكلب', 'ابن الحرام', 'لعين', 'ملعون', 'شيطان', 'قرد', 'تافه',
    'سافل', 'دنيء', 'خسيس', 'رخيص', 'زنا', 'حثالة', 'زفت', 'خرق',
    

    'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'bastard', 'slut',
    'whore', 'dick', 'cock', 'pussy', 'cunt', 'piss', 'nigga', 'fag',
    

    'اقتل', 'اذبح', 'احرق', 'اكسر', 'اضرب', 'ادمر', 'اهدم', 'اقضي عليك',
    'موت', 'مات', 'قتل', 'دم', 'سكين', 'مسدس', 'قنبلة', 'انفجار',
    
 
    'ملحد', 'كافر', 'منافق', 'فاسق', 'ضال', 'مشرك',
    

    'مخدرات', 'حشيش', 'كوكايين', 'هيروين', 'خمر', 'كحول', 'سكران'
  ];

 
  const STORY_STARTERS = [
    "في صباح مشمس ذهبت إلى المدرسة و...",
    "بينما كنت أقرأ كتابي المفضل حدث شيء غريب و...",
    "عندما استيقظت هذا الصباح وجدت...",
    "أثناء المشي في الحديقة رأيت طائراً جميلاً و...",
    "في المطبخ كانت رائحة الطعام اللذيذ و...",
    "عندما فتحت صندوق الهدايا اكتشفت أن...",
    "أثناء اللعب مع أصدقائي في الملعب...",
    "في يوم ممطر قررت أن أبقى في المنزل و...",
    "عندما ذهبت إلى المكتبة للبحث عن كتاب...",
    "بينما كنت أساعد والدي في الحديقة...",
    "في رحلتنا إلى الشاطئ رأينا...",
    "عندما كنت أرسم لوحتي الجديدة...",
    "أثناء زيارتي لجدتي تعلمت كيف...",
    "في النادي العلمي اكتشفنا تجربة مثيرة و...",
    "عندما كنت أطعم القطط الصغيرة في الحي...",
    "أثناء مشاهدة النجوم من السطح...",
    "في رحلة العائلة إلى الجبال...",
    "عندما كنت أتعلم العزف على الآلة الموسيقية...",
    "أثناء مساعدة جارنا المسن...",
    "في معرض الكتب وجدت قصة رائعة عن..."
  ];


  function containsBannedWords(text) {
    if (!text || typeof text !== 'string') return false;
    
    const cleanText = text.toLowerCase().trim();
    

    const normalizedText = cleanText
      .replace(/[ًٌٍَُِّْـ]/g, '')
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ');


    for (const bannedWord of BANNED_WORDS) {

      if (normalizedText.includes(bannedWord.toLowerCase())) {
        return true;
      }
      

      const extendedPattern = bannedWord.toLowerCase().split('').join('[اأإآةهـ]*');
      const regex = new RegExp(extendedPattern, 'i');
      if (regex.test(normalizedText)) {
        return true;
      }
      

      const substitutedText = normalizedText
        .replace(/[0]/g, 'و')
        .replace(/[3]/g, 'ع')
        .replace(/[7]/g, 'ح')
        .replace(/[5]/g, 'خ')
        .replace(/[9]/g, 'ق')
        .replace(/[@]/g, 'ا');
        
      if (substitutedText.includes(bannedWord.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }


  function isValidResponse(text) {
    if (!text || typeof text !== 'string') {
      return { valid: false, reason: 'الرد فارغ أو غير صالح!' };
    }

    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    

    if (words.length < 2) {
      return { valid: false, reason: 'الرد قصير جداً! يجب أن يكون 2-3 كلمات على الأقل.' };
    }
    
    if (words.length > 3) {
      return { valid: false, reason: 'الرد طويل جداً! يجب أن يكون 2-3 كلمات فقط.' };
    }
    

    if (containsBannedWords(text)) {
      return { valid: false, reason: 'يحتوي الرد على كلمات غير مناسبة!' };
    }
    

    const validWordPattern = /^[\u0600-\u06FFa-zA-Z0-9\s،؟!.]+$/;
    if (!validWordPattern.test(text)) {
      return { valid: false, reason: 'يجب أن يحتوي الرد على كلمات صحيحة!' };
    }
    

    const uniqueChars = new Set(text.toLowerCase().replace(/\s/g, ''));
    if (uniqueChars.size < 3) {
      return { valid: false, reason: 'الرد يحتوي على تكرار مفرط للحروف!' };
    }


    for (const word of words) {
      if (word.length < 2) {
        return { valid: false, reason: 'يجب أن تكون كل كلمة حرفين على الأقل!' };
      }
    }
    
    return { valid: true };
  }


  function createButton(style, customId, label, emoji, disabled = false) {
    const styles = {
      PRIMARY: ButtonStyle.Primary,
      SECONDARY: ButtonStyle.Secondary,
      SUCCESS: ButtonStyle.Success,
      DANGER: ButtonStyle.Danger
    };
    
    const btn = new ButtonBuilder()
      .setStyle(styles[style])
      .setCustomId(customId)
      .setDisabled(disabled);
    
    if (label) btn.setLabel(label);
    if (emoji) btn.setEmoji(emoji);
    
    return btn;
  }


  async function givePoints(guildId, userId, points, type = 'general') {
    try {
      const pointsKey = type === 'general' ? `points_${guildId}.${userId}` : `completepoints_${guildId}.${userId}`;
      let currentPoints = await dbq.get(pointsKey) || 0;
      currentPoints += points;
      await dbq.set(pointsKey, currentPoints);
      return currentPoints;
    } catch (error) {
      console.error('Error giving points:', error);
      return 0;
    }
  }


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    const args = message.content.split(" ");
    
    if (args[0] === prefix + "اكمل") {

      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      

      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) return;
      

      if (has_play.get(message.guild.id)) {
        return message.reply({ content: `🛑 هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      }


      const storedTime = await dbq.get(`timercomplete_${message.author.id}`) || 30000;
      const data = {
        author: message.author.id,
        players: [],
        start_in: Date.now() + storedTime,
        type: "complete",
        maxPlayers: 12,
        minPlayers: 2,
        gameState: "waiting",
        story: "",
        storyParts: [],
        currentPlayerIndex: 0,
        roundNumber: 1,
        maxRounds: 6,
        playerContributions: {},
        completedStories: [],
        timeouts: {},
        createdAt: Date.now()
      };


      let attachment;
      const completeImage = `./imager/completeimage_${message.guild.id}.png`;
      
      try {
        if (fs.existsSync(completeImage)) {
          attachment = new AttachmentBuilder(completeImage);
        } else {
          attachment = new AttachmentBuilder(`./photo/akml.png`);
        }
      } catch (error) {
        attachment = new AttachmentBuilder(`./photo/akml.png`);
      }

      const content_time = `**ستبدأ اللعبة خلال:** <t:${Math.floor(data.start_in / 1000)}:R>`;
      const content_players = `**(0 / ${data.maxPlayers})**`;


      const row = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "join_complete", "انضم للعبة", '1243848352026591274'),
          createButton("SECONDARY", "leave_complete", "غادر اللعبة", '1243848354535047230'),
          createButton("SECONDARY", "explain_complete", "شرح اللعبة", '1254234763699687476')
        )
      ];

      const msg = await message.channel.send({ 
        content: `${content_time}\n${content_players}`, 
        files: [attachment], 
        components: row 
      }).catch(() => null);

      if (!msg) return;
      
      has_play.set(message.guild.id, data);
      const start_c = msg.createMessageComponentCollector({ time: storedTime });


      async function updateCounter() {
        const currentData = has_play.get(message.guild.id);
        if (!currentData) return;
        
        const counter = currentData.players.length;
        const content_players_updated = `**(${counter} / ${currentData.maxPlayers})**`;
        await msg.edit({ 
          content: `${content_time}\n${content_players_updated}`, 
          components: row 
        }).catch(() => {});
      }


      start_c.on("collect", async inter => {
        const currentData = has_play.get(message.guild.id);
        if (!currentData) return;

        if (inter.customId === "join_complete") {

          if (currentData.players.find(u => u.id === inter.user.id)) {
            return inter.reply({ content: `📝 لقد انضممت للعبة بالفعل!`, ephemeral: true });
          }
          

          if (currentData.players.length >= currentData.maxPlayers) {
            return inter.reply({ 
              content: `❌ عذراً، اكتمل عدد اللاعبين! الحد الأقصى ${currentData.maxPlayers} لاعب.`, 
              ephemeral: true 
            });
          }


          currentData.players.push({
            id: inter.user.id,
            username: inter.user.username,
            displayName: inter.user.displayName || inter.user.username,
            avatar: inter.user.displayAvatarURL({ dynamic: true }),
            contributions: 0,
            totalWords: 0,
            creativityScore: 0,
            timeouts: 0,
            joinedAt: Date.now()
          });
          
          currentData.playerContributions[inter.user.id] = [];
          has_play.set(message.guild.id, currentData);
          
          await updateCounter();
          await inter.reply({ content: `✅ تم انضمامك للعبة بنجاح! 🎉`, ephemeral: true });

        } else if (inter.customId === "leave_complete") {
          const playerIndex = currentData.players.findIndex(p => p.id === inter.user.id);
          if (playerIndex === -1) {
            return inter.reply({ content: `❌ أنت لست منضماً للعبة!`, ephemeral: true });
          }


          currentData.players.splice(playerIndex, 1);
          delete currentData.playerContributions[inter.user.id];
          

          if (playerIndex <= currentData.currentPlayerIndex && currentData.currentPlayerIndex > 0) {
            currentData.currentPlayerIndex--;
          }
          
          has_play.set(message.guild.id, currentData);
          await updateCounter();
          await inter.reply({ content: `👋 تم خروجك من اللعبة بنجاح.`, ephemeral: true });

        } else if (inter.customId === "explain_complete") {
          const embed = new EmbedBuilder()
            .setTitle('📚 طريقة لعب "أكمل القصة"')
            .setColor('#4FC3F7')
            .setDescription('لعبة جماعية إبداعية لكتابة القصص معاً!')
            .addFields(
              {
                name: '🎯 الهدف',
                value: 'إنشاء قصة جميلة ومترابطة بمشاركة جميع اللاعبين',
                inline: false
              },
              {
                name: '📝 آلية اللعب',
                value: `• البوت يبدأ بجملة ناقصة\n• كل لاعب يكمل بـ **2-3 كلمات فقط**\n• ${currentData.maxRounds} جولات لكل قصة\n• 30 ثانية للرد في كل دور`,
                inline: false
              },
              {
                name: '📏 القواعد المهمة',
                value: '• **2-3 كلمات فقط** في كل رد\n• ممنوع الكلمات البذيئة أو المسيئة\n• يجب أن تكون الإضافة منطقية\n• 3 تجاهلات = خروج من اللعبة',
                inline: false
              },
              {
                name: '🏆 نظام النقاط',
                value: '• كل مساهمة صحيحة: +3 نقاط\n• إكمال قصة: +5 نقاط للجميع\n• أفضل مساهم: +10 نقاط إضافية\n• المركز الأول: +8 نقاط عامة',
                inline: false
              },
              {
                name: '💡 نصائح للفوز',
                value: '• كن مبدعاً ومنطقياً\n• تابع سياق القصة\n• استخدم كلمات متنوعة\n• رد في الوقت المناسب',
                inline: false
              }
            )
            .setFooter({ text: 'استعدوا لتجربة إبداعية رائعة!' })
            .setTimestamp();

          await inter.reply({ embeds: [embed], ephemeral: true });
        }
      });


      start_c.on("end", async () => {
        const finalData = has_play.get(message.guild.id);
        if (!finalData) return;

        const content_players_final = `**(${finalData.players.length} / ${finalData.maxPlayers})**`;
        await msg.edit({ content: content_players_final, components: [] }).catch(() => {});

        if (finalData.players.length < finalData.minPlayers) {
          has_play.delete(message.guild.id);
          return message.channel.send({ 
            content: "**تم إيقاف اللعبة لعدم وجود`3` لاعبين على الأقل - ⛔.**" 
          });
        }

        await message.channel.send({ 
          content: "**⏳ تم الانتهاء من تسجيل الارقام ستبدأ الجولة خلال ثواني .**" 
        });
        
        setTimeout(() => {
          startCompleteGame(message);
        }, 5000);
      });
    }
  });


  async function startCompleteGame(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data || data.players.length === 0) return;

      data.gameState = "playing";
      data.currentPlayerIndex = 0;
      

      const randomStarter = STORY_STARTERS[Math.floor(Math.random() * STORY_STARTERS.length)];
      data.story = randomStarter;
      data.storyParts = [{ 
        text: randomStarter, 
        author: 'البوت', 
        isStarter: true, 
        timestamp: Date.now() 
      }];
      
      has_play.set(message.guild.id, data);

      const startEmbed = new EmbedBuilder()
        .setTitle('📚 بدأت لعبة "أكمل القصة"!')
        .setColor('#4FC3F7')
        .addFields(
          { name: '👥 عدد اللاعبين', value: `${data.players.length}`, inline: true },
          { name: '🎯 عدد الجولات', value: `${data.maxRounds}`, inline: true },
          { name: '⏱️ وقت كل دور', value: '30 ثانية', inline: true }
        )
        .setFooter({ text: 'بدء اللعبة خلال ثانيتين...' })
        .setTimestamp();

      await message.channel.send({ embeds: [startEmbed] });
      
      setTimeout(() => {
        startStoryRound(message);
      }, 2000);

    } catch (error) {
      console.error('Error starting complete game:', error);
      await message.channel.send('❌ حدث خطأ أثناء بدء اللعبة. يرجى المحاولة مرة أخرى.');
      has_play.delete(message.guild.id);
    }
  }


  async function startStoryRound(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data || !data.gameActive !== false) {

        if (!data || data.roundNumber > data.maxRounds) {
          await finishStory(message);
          return;
        }
      }


      if (data.currentPlayerIndex >= data.players.length) {
        data.currentPlayerIndex = 0;
      }
      
      const currentPlayer = data.players[data.currentPlayerIndex];
      if (!currentPlayer) {
        console.error('Current player not found');
        return;
      }


      const storyImage = await generateStoryImage(data.story, data.roundNumber, data.maxRounds, message.guild.id);
      const attachment = new AttachmentBuilder(storyImage, { name: 'story.png' });


      const requestEmbed = new EmbedBuilder()
        .setTitle(`📝 الجولة ${data.roundNumber}/${data.maxRounds}`)
        .setColor('#FF9800')
        .setDescription(`<@${currentPlayer.id}> دورك! أكمل القصة بـ **2-3 كلمات**`)
        .addFields({
          name: '⏰ الوقت المتاح',
          value: '30 ثانية',
          inline: true
        })
        .setFooter({ text: `اللاعب ${data.currentPlayerIndex + 1} من ${data.players.length}` })
        .setTimestamp();


      const requestMsg = await message.channel.send({
        embeds: [requestEmbed],
        files: [attachment]
      });


      await waitForPlayerResponse(message, currentPlayer, requestMsg);

    } catch (error) {
      console.error('Error in story round:', error);
      await message.channel.send('❌ حدث خطأ في الجولة الحالية. المتابعة للجولة التالية...');
      

      const data = has_play.get(message.guild.id);
      if (data) {
        data.currentPlayerIndex = (data.currentPlayerIndex + 1) % data.players.length;
        data.roundNumber++;
        has_play.set(message.guild.id, data);
        setTimeout(() => startStoryRound(message), 2000);
      }
    }
  }


  async function waitForPlayerResponse(message, currentPlayer, requestMsg) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;

      const filter = (msg) => {
        return msg.author.id === currentPlayer.id && 
               !msg.author.bot && 
               msg.channel.id === message.channel.id &&
               msg.content.trim().length > 0;
      };

      const collector = message.channel.createMessageCollector({ 
        filter, 
        max: 1, 
        time: 30000 
      });

      collector.on('collect', async (response) => {
        try {
          await processPlayerResponse(message, currentPlayer, response.content.trim(), requestMsg);
        } catch (error) {
          console.error('Error processing response:', error);
          await message.channel.send(`❌ حدث خطأ أثناء معالجة رد ${currentPlayer.displayName}. المتابعة للجولة التالية...`);
          await moveToNextPlayer(message);
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await handleNoResponse(message, currentPlayer, requestMsg);
        }
      });

    } catch (error) {
      console.error('Error waiting for player response:', error);
      await moveToNextPlayer(message);
    }
  }


  async function processPlayerResponse(message, currentPlayer, responseText, requestMsg) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      const validation = isValidResponse(responseText);
      if (!validation.valid) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ رد غير صحيح')
          .setColor('#FF5722')
          .setDescription(`**${currentPlayer.displayName}:** ${validation.reason}`)
          .addFields({
            name: '📝 ردك كان',
            value: `"${responseText}"`,
            inline: false
          })
          .setFooter({ text: 'الانتقال للاعب التالي...' });

        await message.channel.send({ embeds: [errorEmbed] });
        

        currentPlayer.timeouts = (currentPlayer.timeouts || 0) + 1;
        
        await moveToNextPlayer(message);
        return;
      }


      const newStoryPart = `${data.story} ${responseText}`;
      data.story = newStoryPart;
      
      data.storyParts.push({
        text: responseText,
        author: currentPlayer.displayName,
        authorId: currentPlayer.id,
        round: data.roundNumber,
        timestamp: Date.now()
      });


      currentPlayer.contributions++;
      currentPlayer.totalWords += responseText.split(/\s+/).length;
      currentPlayer.creativityScore += calculateCreativityScore(responseText);
      
      data.playerContributions[currentPlayer.id].push({
        round: data.roundNumber,
        text: responseText,
        creativity: calculateCreativityScore(responseText),
        timestamp: Date.now()
      });


      const successEmbed = new EmbedBuilder()
        .setTitle('✅ تم قبول مساهمتك!')
        .setColor('#4CAF50')
        .setDescription(`**${currentPlayer.displayName}:** "${responseText}"`)
        .addFields({
          name: '📊 إحصائياتك',
          value: `مساهمات: ${currentPlayer.contributions} | كلمات: ${currentPlayer.totalWords} | إبداع: ${currentPlayer.creativityScore}`,
          inline: false
        });

      await message.channel.send({ embeds: [successEmbed] });


      let basePoints = 3;
      let creativityBonus = 0;
      
      const creativityScore = calculateCreativityScore(responseText);
      if (creativityScore > 8) {
        creativityBonus = 2;
      } else if (creativityScore > 5) {
        creativityBonus = 1;
      }

      await givePoints(message.guild.id, currentPlayer.id, basePoints + creativityBonus);


      await moveToNextPlayer(message);

    } catch (error) {
      console.error('Error processing player response:', error);
      await message.channel.send('❌ حدث خطأ أثناء معالجة الرد. المتابعة للجولة التالية...');
      await moveToNextPlayer(message);
    }
  }


  async function moveToNextPlayer(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      data.currentPlayerIndex = (data.currentPlayerIndex + 1) % data.players.length;
      data.roundNumber++;
      has_play.set(message.guild.id, data);


      setTimeout(() => {
        startStoryRound(message);
      }, 3000);

    } catch (error) {
      console.error('Error moving to next player:', error);
    }
  }


  function calculateCreativityScore(text) {
    if (!text || typeof text !== 'string') return 0;
    
    let score = 0;
    const words = text.trim().split(/\s+/);
    

    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    score += uniqueWords.size * 2;
    

    if (text.length >= 8 && text.length <= 30) {
      score += 3;
    }
    

    const uniqueChars = new Set(text.toLowerCase().replace(/\s/g, ''));
    score += Math.min(uniqueChars.size, 8);
    

    const longWords = words.filter(word => word.length > 4);
    score += longWords.length * 1.5;
    

    const firstLetters = new Set(words.map(word => word.charAt(0).toLowerCase()));
    score += firstLetters.size;
    
    return Math.round(score);
  }


  async function handleNoResponse(message, currentPlayer, requestMsg) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      currentPlayer.timeouts = (currentPlayer.timeouts || 0) + 1;

      const timeoutEmbed = new EmbedBuilder()
        .setTitle('⏰ انتهى الوقت!')
        .setColor('#FF9800')
        .setDescription(`**${currentPlayer.displayName}** لم يرد في الوقت المحدد`)
        .addFields({
          name: '📊 إحصائية التجاهل',
          value: `${currentPlayer.timeouts}/3 تجاهل`,
          inline: true
        })
        .setFooter({ text: 'الانتقال للاعب التالي...' });

      await message.channel.send({ embeds: [timeoutEmbed] });


      if (currentPlayer.timeouts >= 3) {
        await removePlayerFromGame(message, currentPlayer);
        return;
      }


      await moveToNextPlayer(message);

    } catch (error) {
      console.error('Error handling no response:', error);
      await moveToNextPlayer(message);
    }
  }


  async function removePlayerFromGame(message, player) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;

      const playerIndex = data.players.findIndex(p => p.id === player.id);
      if (playerIndex === -1) return;


      data.players.splice(playerIndex, 1);
      delete data.playerContributions[player.id];


      if (playerIndex <= data.currentPlayerIndex && data.currentPlayerIndex > 0) {
        data.currentPlayerIndex--;
      }
      if (data.currentPlayerIndex >= data.players.length) {
        data.currentPlayerIndex = 0;
      }

      const removalEmbed = new EmbedBuilder()
        .setTitle('🚫 تم إخراج لاعب')
        .setColor('#F44336')
        .setDescription(`تم إخراج **${player.displayName}** لعدم المشاركة (3 تجاهلات)`)
        .addFields({
          name: '👥 اللاعبون المتبقون',
          value: `${data.players.length} لاعب`,
          inline: true
        });

      await message.channel.send({ embeds: [removalEmbed] });


      if (data.players.length < 2) {
        await endGameEarly(message, 'لا يوجد عدد كافٍ من اللاعبين');
        return;
      }

      has_play.set(message.guild.id, data);
      await moveToNextPlayer(message);

    } catch (error) {
      console.error('Error removing player:', error);
    }
  }


  async function endGameEarly(message, reason) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;

      const earlyEndEmbed = new EmbedBuilder()
        .setTitle('⏹️ انتهت اللعبة مبكراً')
        .setColor('#FF5722')
        .setDescription(`**السبب:** ${reason}`)
        .addFields({
          name: '📊 إحصائيات سريعة',
          value: `الجولات المكتملة: ${data.roundNumber - 1}/${data.maxRounds}\nكلمات القصة: ${data.story.split(/\s+/).length}`,
          inline: false
        })
        .setFooter({ text: 'شكراً للجميع على المشاركة!' });

      await message.channel.send({ embeds: [earlyEndEmbed] });


      for (const player of data.players) {
        if (player.contributions > 0) {
          await givePoints(message.guild.id, player.id, player.contributions * 2);
        }
      }

      has_play.delete(message.guild.id);

    } catch (error) {
      console.error('Error ending game early:', error);
      has_play.delete(message.guild.id);
    }
  }


  async function finishStory(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      data.completedStories.push({
        story: data.story,
        parts: data.storyParts,
        completedAt: Date.now(),
        playerCount: data.players.length,
        totalRounds: data.roundNumber - 1
      });


      const finalImage = await generateFinalStoryImage(data.story, data.storyParts, message.guild.id);
      const attachment = new AttachmentBuilder(finalImage, { name: 'final-story.png' });

      const completionEmbed = new EmbedBuilder()
        .setTitle('🎉 تمت كتابة القصة بنجاح!')
        .setColor('#4CAF50')
        .setDescription('إليكم القصة النهائية المكتملة:')
        .addFields({
          name: '📊 إحصائيات القصة',
          value: `الكلمات: ${data.story.split(/\s+/).length}\nالجولات: ${data.roundNumber - 1}\nالمساهمون: ${data.players.filter(p => p.contributions > 0).length}`,
          inline: false
        })
        .setFooter({ text: 'بدء التصويت النهائي خلال 5 ثوان...' });

      await message.channel.send({
        embeds: [completionEmbed],
        files: [attachment]
      });


      for (const player of data.players) {
        if (player.contributions > 0) {
          await givePoints(message.guild.id, player.id, 5);
        }
      }

      has_play.set(message.guild.id, data);


      setTimeout(() => {
        startFinalVoting(message);
      }, 5000);

    } catch (error) {
      console.error('Error finishing story:', error);
      await showGameResults(message);
    }
  }


  async function startFinalVoting(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      const contributors = data.players.filter(p => p.contributions > 0);
      
      if (contributors.length === 0) {
        await showGameResults(message);
        return;
      }

      if (contributors.length === 1) {

        await announceDirectWinner(message, contributors[0]);
        await showGameResults(message);
        return;
      }


      const embed = new EmbedBuilder()
        .setTitle('🗳️ التصويت النهائي - أفضل مساهم في القصة')
        .setColor('#FF6B35')
        .setDescription('اختر اللاعب الذي قدم أفضل مساهمات في القصة')
        .setFooter({ text: 'لديكم 45 ثانية للتصويت | لا يمكن التصويت لنفسك' });


      contributors.forEach((contributor, index) => {
        const playerContributions = data.playerContributions[contributor.id] || [];
        const contributionTexts = playerContributions.map(c => `"${c.text}"`).join(' • ');
        
        embed.addFields({
          name: `${index + 1}. ${contributor.displayName}`,
          value: `**المساهمات:** ${contributor.contributions} | **الإبداع:** ${contributor.creativityScore}\n**النصوص:** ${contributionTexts || 'لا توجد مساهمات مسجلة'}`,
          inline: false
        });
      });


      const voteButtons = contributors.map((contributor, index) => 
        createButton("SECONDARY", `vote_final_${contributor.id}`, `${index + 1}. ${contributor.displayName}`, '🗳️')
      );


      const rows = [];
      for (let i = 0; i < voteButtons.length; i += 4) {
        rows.push(new ActionRowBuilder().addComponents(voteButtons.slice(i, i + 4)));
      }

      const voteMsg = await message.channel.send({
        embeds: [embed],
        components: rows
      });


      const votes = {};
      const voters = new Set();


      contributors.forEach(contributor => {
        votes[contributor.id] = 0;
      });

      const collector = voteMsg.createMessageComponentCollector({ 
        filter: i => i.customId.startsWith('vote_final_') && data.players.some(p => p.id === i.user.id),
        time: 45000 
      });

      collector.on('collect', async inter => {
        if (voters.has(inter.user.id)) {
          return inter.reply({ content: '❌ لقد صوتت بالفعل!', ephemeral: true });
        }

        const votedPlayerId = inter.customId.replace('vote_final_', '');
        const votedPlayer = contributors.find(p => p.id === votedPlayerId);


        if (inter.user.id === votedPlayerId) {
          return inter.reply({ content: '❌ لا يمكنك التصويت لنفسك!', ephemeral: true });
        }

        voters.add(inter.user.id);
        votes[votedPlayerId]++;

        await inter.reply({ 
          content: `✅ تم تسجيل صوتك لـ **${votedPlayer.displayName}**!`, 
          ephemeral: true 
        });
      });

      collector.on('end', async () => {
        await processVotingResults(message, voteMsg, contributors, votes);
      });

    } catch (error) {
      console.error('Error in final voting:', error);
      await showGameResults(message);
    }
  }


  async function processVotingResults(message, voteMsg, contributors, votes) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      let maxVotes = Math.max(...Object.values(votes));
      let winners = Object.entries(votes)
        .filter(([playerId, voteCount]) => voteCount === maxVotes && voteCount > 0)
        .map(([playerId]) => playerId);

      let votingWinner;
      if (winners.length === 0 || maxVotes === 0) {

        votingWinner = contributors.sort((a, b) => {
          const scoreA = a.contributions * 3 + a.creativityScore;
          const scoreB = b.contributions * 3 + b.creativityScore;
          return scoreB - scoreA;
        })[0];
      } else if (winners.length === 1) {
        votingWinner = contributors.find(p => p.id === winners[0]);
      } else {

        const randomWinnerId = winners[Math.floor(Math.random() * winners.length)];
        votingWinner = contributors.find(p => p.id === randomWinnerId);
      }


      const resultsEmbed = new EmbedBuilder()
        .setTitle('📊 نتائج التصويت النهائي')
        .setColor('#4CAF50')
        .setDescription(`🏆 **الفائز بالتصويت:** ${votingWinner.displayName}`)
        .setTimestamp();


      const sortedByVotes = contributors
        .map(contributor => ({
          ...contributor,
          votes: votes[contributor.id] || 0
        }))
        .sort((a, b) => b.votes - a.votes);

      let resultsText = '';
      sortedByVotes.forEach((contributor, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔸';
        const isVotingWinner = contributor.id === votingWinner.id;
        const winnerMark = isVotingWinner ? ' 👑' : '';
        
        resultsText += `${medal} **${contributor.displayName}**: ${contributor.votes} ${contributor.votes === 1 ? 'صوت' : 'أصوات'}${winnerMark}\n`;
      });

      resultsEmbed.addFields({
        name: '🗳️ تفصيل الأصوات',
        value: resultsText,
        inline: false
      });


      await voteMsg.edit({
        embeds: [resultsEmbed],
        components: []
      });


      await givePoints(message.guild.id, votingWinner.id, 10);


      data.votingWinner = votingWinner;
      has_play.set(message.guild.id, data);

      setTimeout(() => {
        showGameResults(message);
      }, 4000);

    } catch (error) {
      console.error('Error processing voting results:', error);
      await showGameResults(message);
    }
  }


  async function announceDirectWinner(message, winner) {
    try {
      const directWinEmbed = new EmbedBuilder()
        .setTitle('🏆 فائز بلا منازع!')
        .setColor('#FFD700')
        .setDescription(`**${winner.displayName}** هو المساهم الوحيد وبالتالي الفائز الطبيعي!`)
        .addFields({
          name: '📊 إحصائياته',
          value: `مساهمات: ${winner.contributions}\nكلمات: ${winner.totalWords}\nنقاط الإبداع: ${winner.creativityScore}`,
          inline: false
        });

      await message.channel.send({ embeds: [directWinEmbed] });
      

      await givePoints(message.guild.id, winner.id, 10);

      const data = has_play.get(message.guild.id);
      if (data) {
        data.votingWinner = winner;
        has_play.set(message.guild.id, data);
      }

    } catch (error) {
      console.error('Error announcing direct winner:', error);
    }
  }


  async function showGameResults(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      const sortedPlayers = [...data.players].sort((a, b) => {
        const scoreA = a.contributions * 3 + a.creativityScore + (a.totalWords * 0.5);
        const scoreB = b.contributions * 3 + b.creativityScore + (b.totalWords * 0.5);
        return scoreB - scoreA;
      });


      const finalEmbed = new EmbedBuilder()
        .setTitle('🏆 نتائج لعبة "أكمل القصة"')
        .setColor('#4FC3F7')
        .setTimestamp();


      const storyStats = `📖 **إحصائيات القصة:**
• الكلمات الكلية: ${data.story.split(/\s+/).length}
• الجولات المكتملة: ${data.roundNumber - 1}/${data.maxRounds}
• عدد المشاركين: ${data.players.filter(p => p.contributions > 0).length}
• مدة اللعبة: ${Math.round((Date.now() - data.createdAt) / 60000)} دقيقة`;

      finalEmbed.setDescription(storyStats);


      let leaderboard = '🏅 **ترتيب اللاعبين:**\n';
      sortedPlayers.forEach((player, index) => {
        if (player.contributions === 0) return;
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const totalScore = player.contributions * 3 + player.creativityScore + Math.round(player.totalWords * 0.5);
        
        leaderboard += `${medal} **${player.displayName}**\n`;
        leaderboard += `   مساهمات: ${player.contributions} | إبداع: ${player.creativityScore} | كلمات: ${player.totalWords}\n`;
      });

      finalEmbed.addFields({
        name: 'الترتيب النهائي',
        value: leaderboard,
        inline: false
      });


      const rankingRewards = [
        { rank: 1, points: 8, name: 'المركز الأول' },
        { rank: 2, points: 5, name: 'المركز الثاني' },
        { rank: 3, points: 3, name: 'المركز الثالث' }
      ];

      let rewardsText = '🎮 **مكافآت المراكز:**\n';
      for (const reward of rankingRewards) {
        if (sortedPlayers.length >= reward.rank && sortedPlayers[reward.rank - 1].contributions > 0) {
          const player = sortedPlayers[reward.rank - 1];
          await givePoints(message.guild.id, player.id, reward.points);
          rewardsText += `${reward.name}: +${reward.points} نقاط\n`;
        }
      }

      finalEmbed.addFields({
        name: 'المكافآت',
        value: rewardsText,
        inline: false
      });

      await message.channel.send({ embeds: [finalEmbed] });


      if (sortedPlayers.length > 0 && sortedPlayers[0].contributions > 0) {
        const winner = sortedPlayers[0];
        try {
          const winnerImage = await generateWinnerImage(
            winner.displayName, 
            winner.avatar, 
            message.guild.id, 
            winner.contributions,
            winner.creativityScore
          );
          const attachment = new AttachmentBuilder(winnerImage, { name: 'winner.png' });

          const row = new ActionRowBuilder()
            .addComponents(
              createButton("SECONDARY", "general_points", `🎮 +8 نقاط`, null, true)
            );

          await message.channel.send({ 
            files: [attachment],
            components: [row]
          });
        } catch (error) {
          console.error('Error generating winner image:', error);
        }
      }

      has_play.delete(message.guild.id);

    } catch (error) {
      console.error('Error showing game results:', error);
      has_play.delete(message.guild.id);
    }
  }


  async function generateStoryImage(story, round, maxRounds, guildId) {
    try {
      const canvas = createCanvas(1200, 800);
      const ctx = canvas.getContext('2d');


      let background;
      const customBg = `./imager/storyboard_${guildId}.png`;
      
      try {
        if (fs.existsSync(customBg)) {
          background = await loadImage(customBg);
          ctx.drawImage(background, 0, 0, 1200, 800);
        } else {
          throw new Error('Custom background not found');
        }
      } catch (error) {

        const gradient = ctx.createLinearGradient(0, 0, 0, 800);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#f093fb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 800);
        

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * 1200, Math.random() * 800, Math.random() * 30 + 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }


      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px cairo';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('📚 أكمل القصة', 600, 70);
      ctx.fillText('📚 أكمل القصة', 600, 70);


      const progressWidth = 800;
      const progressHeight = 20;
      const progressX = (1200 - progressWidth) / 2;
      const progressY = 90;
      const progress = Math.min(round / maxRounds, 1);
      

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
      

      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);
      

      ctx.font = 'bold 24px cairo';
      ctx.fillStyle = '#ffffff';
      ctx.strokeText(`الجولة ${round}/${maxRounds}`, 600, 135);
      ctx.fillText(`الجولة ${round}/${maxRounds}`, 600, 135);


      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(50, 160, 1100, 580);
      

      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 5;
      ctx.strokeRect(50, 160, 1100, 580);
      

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 165, 1090, 570);


      ctx.fillStyle = '#2c3e50';
      ctx.font = '28px cairo';
      ctx.textAlign = 'right';
      
      const maxWidth = 1050;
      const lineHeight = 45;
      let y = 210;
      

      const words = story.split(' ');
      let line = '';
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {

          ctx.fillText(line.trim(), 1120, y);
          line = word + ' ';
          y += lineHeight;
          
          if (y > 700) break;
        } else {
          line = testLine;
        }
      }
      
      if (line.trim() !== '' && y <= 700) {
        ctx.fillText(line.trim(), 1120, y);
      }


      ctx.fillStyle = '#FF5722';
      ctx.font = 'bold 42px cairo';
      ctx.textAlign = 'center';
      

      ctx.shadowColor = '#FF5722';
      ctx.shadowBlur = 15;
      ctx.fillText('...', 600, 720);
      ctx.shadowBlur = 0;

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating story image:', error);
      return await createEmergencyStoryImage();
    }
  }


  async function generateFinalStoryImage(story, storyParts, guildId) {
    try {
      const canvas = createCanvas(1400, 1000);
      const ctx = canvas.getContext('2d');


      let background;
      const customBg = `./imager/finalstory_${guildId}.png`;
      
      try {
        if (fs.existsSync(customBg)) {
          background = await loadImage(customBg);
          ctx.drawImage(background, 0, 0, 1400, 1000);
        } else {
          throw new Error('Custom background not found');
        }
      } catch (error) {

        const gradient = ctx.createRadialGradient(700, 500, 0, 700, 500, 800);
        gradient.addColorStop(0, '#ffecd2');
        gradient.addColorStop(0.5, '#fcb69f');
        gradient.addColorStop(1, '#ff9a9e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1400, 1000);
      }


      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px cairo';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 4;
      

      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      ctx.strokeText('📚 القصة مكتملة!', 700, 70);
      ctx.fillText('📚 القصة مكتملة!', 700, 70);
      

      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;


      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.fillRect(50, 120, 1300, 820);
      

      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 6;
      ctx.strokeRect(50, 120, 1300, 820);
      
      ctx.strokeStyle = '#81C784';
      ctx.lineWidth = 3;
      ctx.strokeRect(55, 125, 1290, 810);
      
      ctx.strokeStyle = '#C8E6C9';
      ctx.lineWidth = 1;
      ctx.strokeRect(60, 130, 1280, 800);


      ctx.textAlign = 'right';
      let y = 170;
      const maxWidth = 1250;
      const lineHeight = 40;


      ctx.fillStyle = '#2196F3';
      ctx.font = 'bold 24px cairo';
      ctx.fillText('🤖 البوت:', 1320, y);
      y += 30;

      ctx.fillStyle = '#37474F';
      ctx.font = '24px cairo';
      const starterWords = storyParts[0].text.split(' ');
      let line = '';
      
      for (const word of starterWords) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line.trim(), 1320, y);
          line = word + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      
      if (line.trim() !== '') {
        ctx.fillText(line.trim(), 1320, y);
        y += lineHeight + 15;
      }


      for (let i = 1; i < storyParts.length && y < 880; i++) {
        const part = storyParts[i];
        

        const hue = (i * 137.5) % 360;
        ctx.fillStyle = `hsl(${hue}, 60%, 45%)`;
        ctx.font = 'bold 22px cairo';
        ctx.fillText(`👤 ${part.author}:`, 1320, y);
        y += 28;
        

        ctx.fillStyle = '#37474F';
        ctx.font = '24px cairo';
        const partWords = part.text.split(' ');
        line = '';
        
        for (const word of partWords) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line.trim(), 1320, y);
            line = word + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        
        if (line.trim() !== '') {
          ctx.fillText(line.trim(), 1320, y);
          y += lineHeight + 18;
        }
      }


      ctx.fillStyle = '#666666';
      ctx.font = 'bold 22px cairo';
      ctx.textAlign = 'center';
      const wordCount = story.split(/\s+/).length;
      const contributorCount = storyParts.length - 1;
      
      ctx.fillText(`📊 ${wordCount} كلمة • ${contributorCount} مساهم • قصة كاملة ✨`, 700, 970);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating final story image:', error);
      return await createEmergencyStoryImage();
    }
  }


  async function generateWinnerImage(playerName, avatarURL, guildId, contributions, creativityScore = 0) {
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
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      } catch (error) {

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.3, '#764ba2');
        gradient.addColorStop(0.7, '#f093fb');
        gradient.addColorStop(1, '#ffecd2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const size = Math.random() * 3 + 1;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }


      let avatar;
      try {
        avatar = await loadImage(avatarURL);
      } catch (error) {
        avatar = await createDefaultAvatar();
      }


      const avatarSize = 720;
      const avatarX = (canvas.width - avatarSize) / 2;
      const avatarY = 68;
      

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 10;
      
      drawCircularImageWithBorder(ctx, avatar, avatarX, avatarY, avatarSize);
      

      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;


      ctx.font = 'bold 96px cairo';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const textName = playerName || 'البطل';
      const textY = avatarY + avatarSize + 40;


      ctx.shadowColor = '#4FC3F7';
      ctx.shadowBlur = 20;
      
      ctx.strokeText(textName, canvas.width / 2, textY);
      ctx.fillText(textName, canvas.width / 2, textY);


      ctx.font = 'bold 48px cairo';
      ctx.shadowBlur = 10;
      const achievementText = `🏆 أفضل مساهم في القصة`;
      ctx.strokeText(achievementText, canvas.width / 2, textY + 120);
      ctx.fillText(achievementText, canvas.width / 2, textY + 120);


      ctx.font = 'bold 36px cairo';
      ctx.shadowBlur = 5;
      const statsText = `📝 ${contributions} مساهمة • ✨ ${creativityScore} نقطة إبداع`;
      ctx.strokeText(statsText, canvas.width / 2, textY + 180);
      ctx.fillText(statsText, canvas.width / 2, textY + 180);
      
      ctx.shadowBlur = 0;

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating winner image:', error);
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
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 15, 0, Math.PI * 2, true);
      const goldGradient = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size / 2 + 15);
      goldGradient.addColorStop(0, '#FFD700');
      goldGradient.addColorStop(0.7, '#FFA000');
      goldGradient.addColorStop(1, '#FF6F00');
      ctx.fillStyle = goldGradient;
      ctx.fill();
      ctx.restore();
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 8, 0, Math.PI * 2, true);
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
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(x, y, size, size);
      }
      
      ctx.restore();
      
    } catch (error) {
      console.error('Error drawing circular image:', error);

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.fillStyle = '#4FC3F7';
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 120px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏆', x + size / 2, y + size / 2);
      
      ctx.restore();
    }
  }

  async function createDefaultAvatar() {
    const canvas = createCanvas(720, 720);
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(360, 360, 0, 360, 360, 360);
    gradient.addColorStop(0, '#4fc3f7');
    gradient.addColorStop(0.5, '#29b6f6');
    gradient.addColorStop(1, '#0288d1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 720, 720);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 200px cairo';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📝', 360, 360);
    
    return canvas;
  }

  async function createEmergencyStoryImage() {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#4fc3f7';
    ctx.fillRect(0, 0, 800, 400);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px cairo';
    ctx.textAlign = 'center';
    ctx.fillText('📚 أكمل القصة', 400, 200);
    
    return canvas.toBuffer();
  }

  async function createEmergencyWinnerImage(playerName) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FF8C00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px cairo';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 أفضل مساهم 🏆', 400, 150);
    
    ctx.font = 'bold 28px cairo';
    ctx.fillText(playerName || 'اللاعب', 400, 250);
    
    return canvas.toBuffer();
  }


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    const args = message.content.split(" ");
    
    if (args[0] === prefix + "كلمة") {
      if (!owners.includes(message.author.id)) {
        return message.reply("❌ هذا الأمر للمطورين فقط.");
      }

      if (!args[1]) {
        return message.reply("❌ يرجى كتابة الكلمة المراد حظرها.");
      }

      const wordToBan = args[1].toLowerCase().trim();
      if (!BANNED_WORDS.includes(wordToBan)) {
        BANNED_WORDS.push(wordToBan);
        await message.reply(`✅ تم إضافة الكلمة "${wordToBan}" لقائمة الكلمات المحظورة.`);
      } else {
        await message.reply(`⚠️ الكلمة "${wordToBan}" محظورة بالفعل.`);
      }
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    const args = message.content.split(" ");
    
    if (args[0] === prefix + "اكمل_احصائيات") {
      const userId = args[1] ? args[1].replace(/[<@!>]/g, '') : message.author.id;
      
      try {
        const user = await client.users.fetch(userId);
        const generalPoints = await dbq.get(`points_${message.guild.id}.${userId}`) || 0;
        const completePoints = await dbq.get(`completepoints_${message.guild.id}.${userId}`) || 0;
        
        const statsEmbed = new EmbedBuilder()
          .setTitle(`📊 إحصائيات ${user.displayName || user.username}`)
          .setColor('#4FC3F7')
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '🎮 النقاط العامة', value: generalPoints.toString(), inline: true },
            { name: '📝 نقاط الإكمال', value: completePoints.toString(), inline: true },
            { name: '🏆 المجموع', value: (generalPoints + completePoints).toString(), inline: true }
          )
          .setTimestamp();

        await message.reply({ embeds: [statsEmbed] });
      } catch (error) {
        await message.reply('❌ لم أتمكن من العثور على هذا المستخدم.');
      }
    }
  });
}

module.exports = { execute };
