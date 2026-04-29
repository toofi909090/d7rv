const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const { Canvas } = require("canvas-constructor/napi-rs");


const GAME_EMOJI_SHOP = [
  {
    id: 'fire_game_emoji',
    name: 'نار',
    emoji: '🔥',
    price: 8,
     description: '.'
  },
  {
    id: 'star_game_emoji',
    name: 'نجمة',
    emoji: '⭐',
    price: 6,
     description: '.'
  },
  {
    id: 'diamond_game_emoji',
    name: 'فيونكه',
    emoji: '🎀',
    price: 12,
     description: '.'
  },
  {
    id: 'crown_game_emoji',
    name: 'تاج',
    emoji: '👑',
    price: 20,
     description: '.'
  },
  {
    id: 'lightning_game_emoji',
    name: 'برق',
    emoji: '⚡',
    price: 10,
     description: '.'
  },
  {
    id: 'rocket_game_emoji',
    name: 'صاروخ',
    emoji: '🚀',
    price: 11,
     description: '.'
  },
  {
    id: 'heart_game_emoji',
    name: 'قلب',
    emoji: '❤️',
    price: 5,
     description: '.'
  },
  {
    id: 'magic_game_emoji',
    name: 'سحر',
    emoji: '✨',
    price: 9,
     description: '.'
  },
  {
    id: 'skull_game_emoji',
    name: 'جمجمة',
    emoji: '💀',
    price: 14,
     description: '.'
  },
  {
    id: 'sword_game_emoji',
    name: 'سيف',
    emoji: '⚔️',
    price: 16,
     description: '.'

  },
  {
    id: 'shield_game_emoji',
    name: 'درع',
    emoji: '🛡️',
    price: 13,
     description: '.'

  },
  {
    id: 'gem_game_emoji',
    name: 'جوهرة',
    emoji: '💍',
    price: 18,
     description: '.'
  },
  {
    id: 'trophy_game_emoji',
    name: 'كأس',
    emoji: '🏆',
    price: 25,
     description: '.'
  }
];



function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, isGameRunning, setGameRunning, times, setTimes } = utils;
  const canvass = require("canvas-constructor/napi-rs");

  /**
   * الحصول على إيموجي النقاط للمستخدم في الألعاب
   */
  async function getUserGameEmoji(userId, guildId, dbq) {
    try {
      const selectedEmoji = await dbq.get(`selected_game_emoji_${guildId}.${userId}`);
      if (!selectedEmoji) return '🧩';
      
      const userEmojis = await dbq.get(`game_emojis_${guildId}.${userId}`) || {};
      const emojiData = userEmojis[selectedEmoji];
      
      return emojiData ? emojiData.emoji : '🧩';
    } catch (error) {
      console.error('Error in getUserGameEmoji:', error);
      return '🧩';
    }
  }

  /**
   * عرض المتجر الرئيسي للألعاب
   */
  async function showGameShop(interaction, dbq) {
    try {
      const generalPoints = await dbq.get(`points_${interaction.guild.id}.${interaction.user.id}`) || 0;
      
      const embed = new EmbedBuilder()
        .setTitle('🛒 متجر الألعاب')
        .setThumbnail('https://i.ibb.co/1Yz0h71S/online-shop.png')
        .setDescription(`**🧩 النقاط العامة الحالية: ${generalPoints} نقطة**\n\n**مرحباً بك في متجر الألعاب!**\nيمكنك شراء إيموجيات مميزة لتخصيص عرض نقاطك في جميع الألعاب البسيطة.`)
        .addFields(
          { name: '🎨 الإيموجيات المتاحة', value: 'إيموجيات مميزة لتخصيص عرض نقاطك', inline: false },
          { name: '💰 العملة المستخدمة', value: 'النقاط العامة من الألعاب', inline: false }
        )
        .setColor('#FFFFFF')
        .setFooter({ text: 'اختر ما تريد فعله' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('open_game_shop')
            .setLabel('فتح المتجر')
            .setEmoji('🛒')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('open_game_bag')
            .setLabel('حقيبتي')
            .setEmoji('🎒')
            .setStyle(ButtonStyle.Secondary)
        );

      const shopMessage = await interaction.reply({ 
        embeds: [embed], 
        components: [row], 
        ephemeral: true, 
        fetchReply: true 
      });

      const filter = (i) => (i.customId === 'open_game_shop' || i.customId === 'open_game_bag') && i.user.id === interaction.user.id;
      const collector = shopMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        if (i.customId === 'open_game_shop') {
          await showGameEmojiShop(i, dbq);
        } else if (i.customId === 'open_game_bag') {
          await showGameBag(i, dbq);
        }
      });

      collector.on('end', () => {
        interaction.editReply({ components: [] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error in showGameShop:', error);
      await interaction.reply({ content: '❌ حدث خطأ في عرض المتجر.', ephemeral: true });
    }
  }

  /**
   * عرض متجر الإيموجيات للألعاب
   */
  async function showGameEmojiShop(interaction, dbq) {
    try {
      const generalPoints = await dbq.get(`points_${interaction.guild.id}.${interaction.user.id}`) || 0;
      
      const embed = new EmbedBuilder()
        .setTitle('🎨 متجر الإيموجيات')
        .setThumbnail('https://i.ibb.co/1Yz0h71S/online-shop.png')
        .setDescription(`**🧩 النقاط العامة الحالية: ${generalPoints} نقطة**\n\n**الإيموجيات المتاحة:**`)
        .addFields(
          GAME_EMOJI_SHOP.map(emoji => ({
            name: `${emoji.emoji} ${emoji.name} - ${emoji.price} نقاط`,
            value: emoji.description,
            inline: true
          }))
        )
        .setColor('#FFFFFF')
        .setFooter({ text: 'الإيموجيات ستظهر بدلاً من 🧩 في جميع الألعاب | يمكن الشراء بالنقاط العامة فقط' });

      const buttons = GAME_EMOJI_SHOP.map(emoji => 
        new ButtonBuilder()
          .setCustomId(`buy_game_emoji_${emoji.id}`)
          .setLabel(`${emoji.emoji} ${emoji.name} - ${emoji.price}`)
          .setStyle(ButtonStyle.Secondary)
      );


      buttons.push(
        new ButtonBuilder()
          .setCustomId('back_to_main_game_shop')
          .setLabel('🔙 العودة للمتجر الرئيسي')
          .setStyle(ButtonStyle.Primary)
      );

      const rows = [];
      for (let i = 0; i < buttons.length; i += 4) {
        rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 4)));
      }

      const emojiMessage = await interaction.update({ 
        embeds: [embed], 
        components: rows, 
        fetchReply: true 
      });

      const filter = (i) => (i.customId.startsWith('buy_game_emoji_') || i.customId === 'back_to_main_game_shop') && i.user.id === interaction.user.id;
      const collector = emojiMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        if (i.customId === 'back_to_main_game_shop') {
          await showGameShop(i, dbq);
        } else {
          await handleGameEmojiPurchase(i, dbq);
        }
      });

      collector.on('end', () => {
        interaction.editReply({ components: [] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error in showGameEmojiShop:', error);
      await interaction.update({ content: '❌ حدث خطأ في عرض متجر الإيموجيات.', embeds: [], components: [] });
    }
  }

  /**
   * معالجة شراء الإيموجيات
   */
  async function handleGameEmojiPurchase(interaction, dbq) {
    try {
      const emojiId = interaction.customId.replace('buy_game_emoji_', '');
      const selectedEmoji = GAME_EMOJI_SHOP.find(emoji => emoji.id === emojiId);
      
      if (!selectedEmoji) {
        await interaction.update({ content: '❌ إيموجي غير صالح.', embeds: [], components: [] });
        return;
      }

      const currentGeneralPoints = await dbq.get(`points_${interaction.guild.id}.${interaction.user.id}`) || 0;

      if (currentGeneralPoints < selectedEmoji.price) {
        await interaction.update({ 
          content: `❌ ليس لديك نقاط كافية لشراء ${selectedEmoji.emoji} ${selectedEmoji.name}.\n🧩 تحتاج ${selectedEmoji.price} نقطة ولديك ${currentGeneralPoints} نقطة.\n\n💡 **ملاحظة:** احصل على المزيد من النقاط بالفوز في الألعاب!`,
          embeds: [], 
          components: [] 
        });
        return;
      }


      let userEmojis = await dbq.get(`game_emojis_${interaction.guild.id}.${interaction.user.id}`) || {};
      if (userEmojis[emojiId]) {
        await interaction.update({
          content: `❌ تملك بالفعل إيموجي ${selectedEmoji.emoji} ${selectedEmoji.name}!`,
          embeds: [],
          components: []
        });
        return;
      }

      await dbq.set(`points_${interaction.guild.id}.${interaction.user.id}`, currentGeneralPoints - selectedEmoji.price);
      
      userEmojis[emojiId] = {
        name: selectedEmoji.name,
        emoji: selectedEmoji.emoji,
        purchaseDate: Date.now()
      };
      await dbq.set(`game_emojis_${interaction.guild.id}.${interaction.user.id}`, userEmojis);

      await interaction.update({
        content: `✅ تم شراء ${selectedEmoji.emoji} ${selectedEmoji.name} بنجاح!\n🧩 تم خصم ${selectedEmoji.price} نقطة من رصيدك.\n💡 يمكنك تفعيله من الحقيبة ليظهر بدلاً من الإيموجي العادي في جميع الألعاب.`,
        embeds: [],
        components: []
      });

    } catch (error) {
      console.error('Error in handleGameEmojiPurchase:', error);
      await interaction.update({ content: '❌ حدث خطأ في عملية شراء الإيموجي.', embeds: [], components: [] });
    }
  }

  /**
   * عرض حقيبة الإيموجيات للألعاب
   */
  async function showGameBag(interaction, dbq) {
    try {
      const userEmojis = await dbq.get(`game_emojis_${interaction.guild.id}.${interaction.user.id}`) || {};
      const selectedEmoji = await dbq.get(`selected_game_emoji_${interaction.guild.id}.${interaction.user.id}`) || null;

      const availableEmojis = Object.entries(userEmojis);

      if (availableEmojis.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🎒 حقيبة الإيموجيات')
          .setDescription('📦 لا تملك أي إيموجيات حالياً!\n🛒 قم بشراء إيموجيات من المتجر أولاً باستخدام النقاط العامة.')
          .setColor('#FFFFFF');

        const backButton = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('back_to_main_game_shop')
              .setLabel('🔙 العودة للمتجر الرئيسي')
              .setStyle(ButtonStyle.Primary)
          );

        await interaction.update({ 
          embeds: [embed], 
          components: [backButton]
        });
        return;
      }

      const selectedEmojiInfo = selectedEmoji ? userEmojis[selectedEmoji] : null;
      const currentEmojiDisplay = selectedEmojiInfo ? selectedEmojiInfo.emoji : '🧩';

      const embed = new EmbedBuilder()
        .setTitle('🎒 حقيبة الإيموجيات')
        .setDescription(`**الإيموجي المحدد حالياً:** ${currentEmojiDisplay}\n\n**إيموجياتك:**`)
        .addFields(
          availableEmojis.map(([emojiId, emojiData]) => ({
            name: `${emojiData.emoji} ${emojiData.name}`,
            value: `${selectedEmoji === emojiId ? '✅ محدد حالياً' : '⚪ غير محدد'}`,
            inline: true
          }))
        )
        .setColor('#FFFFFF')
        .setFooter({ text: 'يمكنك تحديد إيموجي واحد فقط ليظهر بدلاً من 🧩 في جميع الألعاب' });

      const buttons = availableEmojis.map(([emojiId, emojiData]) => 
        new ButtonBuilder()
          .setCustomId(`select_game_emoji_${emojiId}`)
          .setLabel(`${emojiData.emoji} ${emojiData.name}`)
          .setStyle(selectedEmoji === emojiId ? ButtonStyle.Success : ButtonStyle.Secondary)
      );

      if (selectedEmoji) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId("unselect_game_emoji")
            .setLabel("❌ إلغاء التحديد")
            .setStyle(ButtonStyle.Danger)
        );
      }


      buttons.push(
        new ButtonBuilder()
          .setCustomId('back_to_main_game_shop')
          .setLabel('🔙 العودة للمتجر الرئيسي')
          .setStyle(ButtonStyle.Primary)
      );

      const rows = [];
      for (let i = 0; i < buttons.length; i += 4) {
        rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 4)));
      }

      const bagMessage = await interaction.update({ 
        embeds: [embed], 
        components: rows, 
        fetchReply: true 
      });

      const filter = (i) => (i.customId.startsWith('select_game_emoji_') || i.customId === 'unselect_game_emoji' || i.customId === 'back_to_main_game_shop') && i.user.id === interaction.user.id;
      const collector = bagMessage.createMessageComponentCollector({ filter, time: 30000 });

      collector.on('collect', async (i) => {
        if (i.customId === 'back_to_main_game_shop') {
          await showGameShop(i, dbq);
        } else {
          await handleGameEmojiSelection(i, dbq);
        }
      });

      collector.on('end', () => {
        interaction.editReply({ components: [] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error in showGameBag:', error);
      await interaction.update({ content: '❌ حدث خطأ في عرض الحقيبة.', embeds: [], components: [] });
    }
  }

  /**
   * معالجة تحديد الإيموجيات من الحقيبة
   */
  async function handleGameEmojiSelection(interaction, dbq) {
    try {
      if (interaction.customId === 'unselect_game_emoji') {
        await dbq.delete(`selected_game_emoji_${interaction.guild.id}.${interaction.user.id}`);
        await interaction.update({
          content: '❌ تم إلغاء تحديد الإيموجي. سيتم عرض الإيموجي العادي 🧩 بدلاً منه في جميع الألعاب.',
          embeds: [],
          components: []
        });
      } else {
        const emojiId = interaction.customId.replace('select_game_emoji_', '');
        const userEmojis = await dbq.get(`game_emojis_${interaction.guild.id}.${interaction.user.id}`) || {};
        const selectedEmojiData = userEmojis[emojiId];
        
        if (selectedEmojiData) {
          await dbq.set(`selected_game_emoji_${interaction.guild.id}.${interaction.user.id}`, emojiId);
          await interaction.update({
            content: `✅ تم تحديد ${selectedEmojiData.emoji} ${selectedEmojiData.name}!\n🎨 سيظهر هذا الإيموجي بدلاً من 🧩 في جميع الألعاب عند الفوز.`,
            embeds: [],
            components: []
          });
        } else {
          await interaction.update({
            content: '❌ حدث خطأ في تحديد الإيموجي.',
            embeds: [],
            components: []
          });
        }
      }
    } catch (error) {
      console.error('Error in handleGameEmojiSelection:', error);
      await interaction.update({ content: '❌ حدث خطأ في تحديد الإيموجي.', embeds: [], components: [] });
    }
  }


  async function createSimpleGame(message, gameType, gameFile, questionText, backgroundPath, useAnswerField = false) {
    if (isGameRunning()) {
      message.reply("**عذرا , يوجد لعبة قيد التشغيل الان - 🛑**");
      return;
    }
    setGameRunning(true);

    const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
    if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) return;
    
    if (times) {
      message.reply("❌ هناك بالفعل لعبة فعاله في هذا الروم!");
      return;
    }

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
        .pngAsync();

      return timeCanvas;
    }
    
    let attachment = new AttachmentBuilder(await createCanvas(), {
      name: "Njm-Store.png"
    });

    message.channel.send({ files: [attachment] })
      .then(() => {
        message.channel.awaitMessages({ filter, max: 1, time: 15 * 1000, errors: ['time'] })
          .then(async collected => {
            const winner = collected.first().author;
            let userPoints = await dbq.get(`points_${message.guild.id}.${winner}`);

            if (userPoints === null || userPoints === undefined) {
              userPoints = 0;
            }

            userPoints += 1;
            await dbq.set(`points_${message.guild.id}.${winner}`, userPoints);
            

            let individualPoints = await dbq.get(`individual_points_${message.guild.id}.${winner.id}`) || 0;
            individualPoints += 1;
            await dbq.set(`individual_points_${message.guild.id}.${winner.id}`, individualPoints);

            setTimes(false);
            setGameRunning(false);


            const userEmoji = await getUserGameEmoji(winner.id, message.guild.id, dbq);

            const row_2 = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('points_button')
                  .setLabel(`${userEmoji} ${userPoints}`)
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true)
              );
            message.channel.send({ content: `<@${winner.id}> , قام بالاجابة قبل انتهاء الوقت :partying_face: .`, components: [row_2] });
          })
          .catch(collected => {
            setTimes(false);
            setGameRunning(false);
            message.channel.send(`**❌ لا يوجد اي فائز , الاجابه كانت ${selectedItem.jwab}**`);
          });
      });
  }


  client.on('messageCreate', async message => {
    if (message.author.bot) return;


    if (message.content.startsWith(prefix + 'المتجر')) {
      const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      const generalPoints = await dbq.get(`points_${message.guild.id}.${message.author.id}`) || 0;
      const selectedEmoji = await dbq.get(`selected_game_emoji_${message.guild.id}.${message.author.id}`) || null;
      const userEmojis = await dbq.get(`game_emojis_${message.guild.id}.${message.author.id}`) || {};
      
      const selectedEmojiInfo = selectedEmoji ? userEmojis[selectedEmoji] : null;
      const currentEmojiDisplay = selectedEmojiInfo ? selectedEmojiInfo.emoji : '🧩';

      const embed = new EmbedBuilder()
        .setTitle('🛒 متجر الألعاب')
        .setThumbnail('https://i.ibb.co/1Yz0h71S/online-shop.png')
        .setDescription(`**${currentEmojiDisplay} النقاط العامة الحالية: ${generalPoints} نقطة**\n**الإيموجي المحدد حالياً:** ${currentEmojiDisplay}\n\n**مرحباً بك في متجر الألعاب!**\nيمكنك شراء إيموجيات مميزة لتخصيص عرض نقاطك في جميع الألعاب البسيطة.`)
        .addFields(
          { name: '🛒 فتح المتجر', value: 'تسوق واشتري إيموجيات جديدة', inline: true },
          { name: '🎒 حقيبتي', value: 'إدارة الإيموجيات التي تملكها', inline: true }
        )
        .setColor('#FFFFFF')
        .setFooter({ text: 'اختر ما تريد فعله' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('open_game_shop')
            .setLabel('فتح المتجر')
            .setEmoji('🛒')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('open_game_bag')
            .setLabel('حقيبتي')
            .setEmoji('🎒')
            .setStyle(ButtonStyle.Secondary)
        );

      const shopMessage = await message.reply({ 
        embeds: [embed], 
        components: [row], 
        fetchReply: true 
      });

      const filter = (i) => (i.customId === 'open_game_shop' || i.customId === 'open_game_bag') && i.user.id === message.author.id;
      const collector = shopMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        if (i.customId === 'open_game_shop') {
          await showGameEmojiShop(i, dbq);
        } else if (i.customId === 'open_game_bag') {
          await showGameBag(i, dbq);
        }
      });

      collector.on('end', () => {
        shopMessage.edit({ components: [] }).catch(() => {});
      });
      return;
    }

    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;
    

    if (message.content.startsWith(prefix + 'شركة')) {
      const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) return;
      
      if (times) {
        message.reply("❌ هناك بالفعل لعبة فعاله في هذا الروم!");
        return;
      }

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
      
      let attachment = new AttachmentBuilder(await createCanvas(), {
        name: "Njm-Store.png"
      });

      message.channel.send({ files: [attachment] })
        .then(() => {
          message.channel.awaitMessages({ filter, max: 1, time: 15 * 1000, errors: ['time'] })
            .then(async collected => {
              const winner = collected.first().author;
              let userPoints = await dbq.get(`points_${message.guild.id}.${winner}`);

              if (userPoints === null || userPoints === undefined) {
                userPoints = 0;
              }

              userPoints += 1;
              await dbq.set(`points_${message.guild.id}.${winner}`, userPoints);

              setTimes(false);
              setGameRunning(false);


              const userEmoji = await getUserGameEmoji(winner.id, message.guild.id, dbq);

              const row_2 = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('points_button')
                    .setLabel(`${userEmoji} ${userPoints}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
                );
              message.channel.send({ content: `<@${winner.id}> , قام بالاجابة قبل انتهاء الوقت :partying_face: .`, components: [row_2] });
            })
            .catch(collected => {
              setTimes(false);
              setGameRunning(false);
              message.channel.send(`**❌ لا يوجد اي فائز , الاجابه كانت ${selectedFlag.jwab}**`);
            });
        });
    }
    

    else if (message.content.startsWith(prefix + `فكك`)) {
      await createSimpleGame(message, 'فكك', 'Break.json', 'اسرع شخص يفكك الاسم', './photo/question.png');
    }
    else if (message.content.startsWith(prefix + `ترتيب`)) {
      await createSimpleGame(message, 'ترتيب', 'trteb.json', 'اسرع شخص يرتب الارقام', './photo/question.png');
    }
    else if (message.content.startsWith(prefix + `صحح`)) {
      await createSimpleGame(message, 'صحح', 'sheh.json', 'اسرع شخص يصحح الاسم', './photo/question.png');
    }
    else if (message.content.startsWith(prefix + `اعكس`)) {
      await createSimpleGame(message, 'اعكس', 'opposite.json', 'اسرع شخص يعكس الاسم', './photo/question.png');
    }
    else if (message.content.startsWith(prefix + `اسرع`)) {
      await createSimpleGame(message, 'اسرع', 'fast.json', 'اسرع شخص يكتب الاسم', './photo/question.png');
    }
    else if (message.content.startsWith(prefix + `حرف`)) {
      await createSimpleGame(message, 'حرف', 'Letter.json', 'اسرع شخص يركب الكلمة', './photo/question.png');
    }
    else if (message.content.startsWith(prefix + `ادمج`)) {
      await createSimpleGame(message, 'ادمج', 'integrate.json', 'اسرع شخص يدمج الكلمة', './photo/question.png');
    }
    else if (message.content.startsWith(prefix + `جمع`)) {
      await createSimpleGame(message, 'جمع', 'plural.json', 'ماهي جمع الكلمة', './photo/question.png', true);
    }
    else if (message.content.startsWith(prefix + `ضرب`)) {
      await createSimpleGame(message, 'ضرب', 'Multiply.json', 'ماهو ضرب التالي', './photo/question.png', true);
    }
    else if (message.content.startsWith(prefix + `طرح`)) {
      await createSimpleGame(message, 'طرح', 'Subtract.json', 'ماهو طرح التالي', './photo/question.png', true);
    }
    else if (message.content.startsWith(prefix + `ترجمة`)) {
      await createSimpleGame(message, 'ترجمة', 'translation.json', 'ماهو ترجمة النص', './photo/question.png', true);
    }
    else if (message.content.startsWith(prefix + `مفرد`)) {
      await createSimpleGame(message, 'مفرد', 'individual.json', 'ماهو مفرد الكلمة', './photo/question.png', true);
    }
    

    else if (message.content.startsWith(prefix + `عواصم`)) {
      if (isGameRunning()) {
        message.reply("**عذرا , يوجد لعبة قيد التشغيل الان - 🛑**");
        return;
      }
      setGameRunning(true);

      const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) return;
      
      if (times) {
        message.reply("❌ هناك بالفعل لعبة فعاله في هذا الروم!");
        return;
      }

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
      
      let attachment = new AttachmentBuilder(await createCanvas(), {
        name: "Njm-Store.png"
      });

      message.reply({ files: [attachment] })
        .then(() => {
          message.channel.awaitMessages({ filter, max: 1, time: 15 * 1000, errors: ['time'] })
            .then(async collected => {
              const winner = collected.first().author;
              let userPoints = await dbq.get(`points_${message.guild.id}.${winner}`);

              if (userPoints === null || userPoints === undefined) {
                userPoints = 0;
              }

              userPoints += 1;
              await dbq.set(`points_${message.guild.id}.${winner}`, userPoints);

              setTimes(false);
              setGameRunning(false);


              const userEmoji = await getUserGameEmoji(winner.id, message.guild.id, dbq);

              const row_2 = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('points_button')
                    .setLabel(`${userEmoji} ${userPoints}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
                );
              message.channel.send({ content: `<@${winner.id}> , قام بالاجابة قبل انتهاء الوقت :partying_face: .`, components: [row_2] });
            })
            .catch(collected => {
              setTimes(false);
              setGameRunning(false);
              message.channel.send(`**❌ لا يوجد اي فائز , الاجابه كانت ${selectedFlag.jwab}**`);
            });
        });
    }
  });
}

module.exports = { execute };
