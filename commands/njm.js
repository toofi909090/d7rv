const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas');

/**
 * نظام الخصائص والإيموجيات للروليت - Enhanced NJM Items System
 * يحتوي على جميع وظائف المتجر والحقيبة والخصائص المحسنة مع نظام الإيموجيات الجديد
 * محدث لاستخدام نقاط الروليت المنفصلة مع القدرات الجديدة ونظام الإيموجيات
 * مع إضافة صورة مخصصة للمتجر
 */





const SHOP_ITEMS = [
  { 
    id: 'bomb', 
    name: 'القنبلة', 
    setEmoji: '<:metrics:1399028793808781383>',
    price: 15, 
    description: 'تقوم بإخراج 3 لاعبين عشوائيين من الروليت',
    cooldown: 40 * 60 * 1000
  },
  { 
    id: 'shield', 
    name: 'الحماية', 
    setEmoji: '<:protect:1320524597367410788>',
    price: 10, 
    description: 'تحميك من الطرد مرة واحدة',
    cooldown: 40 * 60 * 1000
  },
  { 
    id: 'swap', 
    name: 'التبديل',
    setEmoji: '<:exchange:1304155528255111230>', 
    price: 12, 
    description: 'إذا حاول أحد طردك، ستقوم بطرده بدلاً منك',
    cooldown: 40 * 60 * 1000
  },
  { 
    id: 'revive', 
    name: 'الإنعاش',
    setEmoji: '<:revive:1399028791233216523>',
    price: 11, 
    description: 'تقوم بإنعاش شخص مطرود من اللعبة',
    cooldown: 40 * 60 * 1000
  },
  { 
    id: 'counter_attack', 
    name: 'الهجمة المرتدة', 
    setEmoji: '<:sword:1399028788230099055>',
    price: 14, 
    description: 'إذا حاول أحد طردك، سيطرد نفسه بدلاً منك',
    cooldown: 40 * 60 * 1000
  },

  { 
    id: 'snipe', 
    name: 'القنص', 
    setEmoji: '<:target:1399549613710508187>',
    price: 18, 
    description: 'تقتل لاعب مباشرة دون انتظار التصويت',
    cooldown: 60 * 60 * 1000
  },
  { 
    id: 'hack', 
    name: 'التهكير', 
    setEmoji: '<:padlock:1399549619431673938>',
    price: 16, 
    description: 'تسرق قدرة خاصة من لاعب آخر',
    cooldown: 45 * 60 * 1000
  },
  { 
    id: 'stealth', 
    name: 'الإخفاء', 
    setEmoji: '<:hidden:1399549621839331460>',
    price: 18, 
    description: 'تختفي من لوحة التصويت لجولة واحدة',
    cooldown: 50 * 60 * 1000
  },
  { 
    id: 'link', 
    name: 'الربط', 
    setEmoji: '<:link:1399549611563159572>',
    price: 22, 
    description: 'تربط مصير شخص مع شخص آخر',
    cooldown: 55 * 60 * 1000
  },
  { 
    id: 'reveal', 
    name: 'الكشف', 
    setEmoji: '<:knowhow:1399549609981776043>',
    price: 15, 
    description: 'تكشف خصائص اللاعبين النشطة',
    cooldown: 35 * 60 * 1000
  },
  { 
    id: 'disable', 
    name: 'المنع', 
    setEmoji: '<:disabled:1399549617389178930>',
    price: 23, 
    description: 'تمنع شخص من استخدام قدراته لجولتين',
    cooldown: 70 * 60 * 1000
  }
];





const EMOJI_SHOP = [
  {
    id: 'fire_emoji',
    name: 'نار',
    emoji: '🔥',
    price: 5,
    description: '.'
  },
  {
    id: 'star_emoji',
    name: 'نجمة',
    emoji: '⭐',
    price: 4,
    description: '.'
  },
  {
    id: 'diamond_emoji',
    name: 'فيونكه',
    emoji: '🎀',
    price: 8,
    description: '.'
  },
  {
    id: 'crown_emoji',
    name: 'تاج',
    emoji: '👑',
    price: 12,
    description: '.'
  },
  {
    id: 'lightning_emoji',
    name: 'برق',
    emoji: '⚡',
    price: 6,
    description: '.'
  },
  {
    id: 'rocket_emoji',
    name: 'صاروخ',
    emoji: '🚀',
    price: 7,
    description: '.'
  },
  {
    id: 'heart_emoji',
    name: 'نرد',
    emoji: '🎲',
    price: 3,
    description: '.'
  },
  {
    id: 'magic_emoji',
    name: 'سحر',
    emoji: '✨',
    price: 5,
    description: '.'
  },
  {
    id: 'skull_emoji',
    name: 'جمجمة',
    emoji: '💀',
    price: 9,
    description: '.'
  },
  {
    id: 'sword_emoji',
    name: 'سيف',
    emoji: '⚔️',
    price: 10,
    description: '.'
  },
  {
    id: 'shield_emoji',
    name: 'درع',
    emoji: '🛡️',
    price: 8,
    description: '.'
  },
  {
    id: 'gem_emoji',
    name: 'جوهرة',
    emoji: '💍',
    price: 11,
    description: '.'
  },
  {
    id: 'trophy_emoji',
    name: 'كأس',
    emoji: '🏆',
    price: 15,
    description: '.'
  }
];

const ITEM_NAMES = {
  'bomb': 'القنبلة',
  'shield': 'الحماية', 
  'swap': 'التبديل',
  'revive': 'الإنعاش',
  'counter_attack': 'الهجمة المرتدة',
  'snipe': 'القنص',
  'hack': 'التهكير',
  'stealth': 'الإخفاء',
  'link': 'الربط',
  'reveal': 'الكشف',
  'disable': 'المنع'
};

const EMOJI_NAMES = {
  'fire_emoji': 'نار',
  'star_emoji': 'نجمة',
  'diamond_emoji': 'ماسة',
  'crown_emoji': 'تاج',
  'lightning_emoji': 'برق',
  'rocket_emoji': 'صاروخ',
  'heart_emoji': 'قلب',
  'magic_emoji': 'سحر',
  'skull_emoji': 'جمجمة',
  'sword_emoji': 'سيف',
  'shield_emoji': 'درع',
  'gem_emoji': 'جوهرة',
  'trophy_emoji': 'كأس'
};


if (typeof CanvasRenderingContext2D !== 'undefined') {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + width, y, x + width, y + height, radius);
    this.arcTo(x + width, y + height, x, y + height, radius);
    this.arcTo(x, y + height, x, y, radius);
    this.arcTo(x, y, x + width, y, radius);
    this.closePath();
    return this;
  };
}


async function createShopWelcomeImage(user, roulettePoints) {
  try {
   
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

 
    let backgroundImage;
    try {
      backgroundImage = await loadImage('./photo/shop.png');
      
      ctx.drawImage(backgroundImage, 0, 0, 800, 400);
    } catch (error) {
      console.log('Could not load background image, using transparent background');
     
      ctx.clearRect(0, 0, 800, 400);
    }

    
    let avatarImage;
    try {
      avatarImage = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
    } catch (error) {
      console.log('Could not load user avatar, using default');
      avatarImage = null;
    }


    if (avatarImage) {
      const avatarSize = 120;
      const avatarX = 400 - avatarSize / 2;
      const avatarY = 140;


      ctx.save();
      ctx.beginPath();
      ctx.arc(400, 200, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();


      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(400, 200, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(400, 200, 60, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('👤', 400, 215);
    }


    let rpointEmoji;
    try {
      rpointEmoji = await loadImage('./photo/rpoint.png');
      

      const pointsText = `${roulettePoints}`;
      ctx.font = 'bold 32px cairo';
      const textWidth = ctx.measureText(pointsText).width;
      const emojiSize = 30;
      const spacing = 10;
      const totalWidth = emojiSize + spacing + textWidth;
      

      const startX = 400 - (totalWidth / 2);
      

      const emojiX = startX;
      const emojiY = 295;
      ctx.drawImage(rpointEmoji, emojiX, emojiY, emojiSize, emojiSize);
      

      ctx.fillStyle = '#ffffffff';
      ctx.textAlign = 'left';
      const textX = emojiX + emojiSize + spacing;
      ctx.strokeText(pointsText, textX, 320);
      ctx.fillText(pointsText, textX, 320);
      
    } catch (error) {
      console.log('Could not load custom emoji, using default text emoji');

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px cairo';
      ctx.textAlign = 'center';
      ctx.strokeText(`🧩 ${roulettePoints}`, 400, 320);
      ctx.fillText(`🧩 ${roulettePoints}`, 400, 320);
    }

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error creating shop welcome image:', error);
    return null;
  }
}

/**
 * عرض المتجر الرئيسي مع خيار الإيموجيات والصورة المخصصة
 */
async function showShop(interaction, dbq) {
  try {
    const roulettePoints = await dbq.get(`roulette_points_${interaction.guild.id}.${interaction.user.id}`) || 0;
    

    const shopImageBuffer = await createShopWelcomeImage(interaction.user, roulettePoints);
    
    const embed = new EmbedBuilder()
      .setTitle('🛒 متجر الروليت')
      .setDescription(`**اختر من الأقسام التالية:**`)
      .addFields(
        { name: '⚔️ الخصائص', value: 'قدرات خاصة للاستخدام في الروليت', inline: false },
        { name: '🎨 الإيموجيات', value: 'إيموجيات مميزة لتخصيص عرض نقاطك', inline: false }
      )
      .setColor('#FFFFFF')
      .setFooter({ text: 'اختر القسم الذي تريد التسوق منه' });


    if (shopImageBuffer) {
      const attachment = new AttachmentBuilder(shopImageBuffer, { name: 'shop-welcome.png' });
      embed.setImage('attachment://shop-welcome.png');
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('shop_items')
            .setLabel('الخصائص')
            .setEmoji('<:collage:1400198900660306092>')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('shop_emojis')
            .setLabel('الإيموجيات')
            .setEmoji('<:wink:1400198902422048818>')
            .setStyle(ButtonStyle.Secondary)
        );

      const shopMessage = await interaction.reply({ 
        embeds: [embed], 
        components: [row], 
        files: [attachment],
        ephemeral: true, 
        fetchReply: true 
      });

      const filter = (i) => (i.customId === 'shop_items' || i.customId === 'shop_emojis') && i.user.id === interaction.user.id;
      const collector = shopMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        if (i.customId === 'shop_items') {
          await showItemsShop(i, dbq);
        } else if (i.customId === 'shop_emojis') {
          await showEmojiShop(i, dbq);
        }
      });

      collector.on('end', () => {
        interaction.editReply({ components: [] }).catch(() => {});
      });
    } else {

      embed.setThumbnail('https://i.ibb.co/1Yz0h71S/online-shop.png');
      embed.setDescription(`**🧩 نقاط الروليت الحالية: ${roulettePoints} نقطة**\n\n**اختر من الأقسام التالية:**`);
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('shop_items')
            .setLabel('الخصائص')
            .setEmoji('<:collage:1400198900660306092>')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('shop_emojis')
            .setLabel('الإيموجيات')
            .setEmoji('<:wink:1400198902422048818>')
            .setStyle(ButtonStyle.Secondary)
        );

      const shopMessage = await interaction.reply({ 
        embeds: [embed], 
        components: [row], 
        ephemeral: true, 
        fetchReply: true 
      });

      const filter = (i) => (i.customId === 'shop_items' || i.customId === 'shop_emojis') && i.user.id === interaction.user.id;
      const collector = shopMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        if (i.customId === 'shop_items') {
          await showItemsShop(i, dbq);
        } else if (i.customId === 'shop_emojis') {
          await showEmojiShop(i, dbq);
        }
      });

      collector.on('end', () => {
        interaction.editReply({ components: [] }).catch(() => {});
      });
    }

  } catch (error) {
    console.error('Error in showShop:', error);
    await interaction.reply({ content: '❌ حدث خطأ في عرض المتجر.', ephemeral: true });
  }
}

/**
 * عرض متجر الخصائص
 */
async function showItemsShop(interaction, dbq) {
  try {
    const roulettePoints = await dbq.get(`roulette_points_${interaction.guild.id}.${interaction.user.id}`) || 0;
    
    const embed = new EmbedBuilder()
      .setTitle('⚔️ متجر الخصائص')
      .setThumbnail('https://i.ibb.co/1Yz0h71S/online-shop.png')
      .setDescription(`**🧩 نقاط الروليت الحالية: ${roulettePoints} نقطة**\n\n**الخصائص المتاحة:**`)
      .addFields(
        SHOP_ITEMS.map(item => ({
          name: `${item.name} - ${item.price} نقاط`,
          value: item.description,
          inline: false
        }))
      )
      .setColor('#dfe1dc')
      .setFooter({ text: 'جميع العناصر لها كول داون بعد الشراء | يمكن الشراء بنقاط الروليت فقط' });

    const buttons = SHOP_ITEMS.map(item => 
      new ButtonBuilder()
        .setCustomId(`buy_item_${item.id}`)
        .setLabel(`${item.name} - ${item.price}`)
        .setStyle(ButtonStyle.Secondary)
    );


    buttons.push(
      new ButtonBuilder()
        .setCustomId('back_to_main_shop')
        .setLabel('🔙 العودة للمتجر الرئيسي')
        .setStyle(ButtonStyle.Primary)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 4) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 4)));
    }

    const itemsMessage = await interaction.update({ 
      embeds: [embed], 
      components: rows,
      files: [],
      fetchReply: true 
    });

    const filter = (i) => (i.customId.startsWith('buy_item_') || i.customId === 'back_to_main_shop') && i.user.id === interaction.user.id;
    const collector = itemsMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (i) => {
      if (i.customId === 'back_to_main_shop') {
        await showShop(i, dbq);
      } else {
        await handleItemPurchase(i, dbq);
      }
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });

  } catch (error) {
    console.error('Error in showItemsShop:', error);
    await interaction.update({ content: '❌ حدث خطأ في عرض متجر العناصر.', embeds: [], components: [] });
  }
}

/**
 * عرض متجر الإيموجيات
 */
async function showEmojiShop(interaction, dbq) {
  try {
    const roulettePoints = await dbq.get(`roulette_points_${interaction.guild.id}.${interaction.user.id}`) || 0;
    
    const embed = new EmbedBuilder()
      .setTitle('🎨 متجر الإيموجيات')
      .setThumbnail('https://i.ibb.co/1Yz0h71S/online-shop.png')
      .setDescription(`**🧩 نقاط الروليت الحالية: ${roulettePoints} نقطة**\n\n**الإيموجيات المتاحة:**`)
      .addFields(
        EMOJI_SHOP.map(emoji => ({
          name: `${emoji.emoji} ${emoji.name} - ${emoji.price} نقاط`,
          value: emoji.description,
          inline: true
        }))
      )
      .setColor('#FFD700')
      .setFooter({ text: 'الإيموجيات ستظهر بدلاً من رمز النقاط العادي | يمكن الشراء بنقاط الروليت فقط' });

    const buttons = EMOJI_SHOP.map(emoji => 
      new ButtonBuilder()
        .setCustomId(`buy_emoji_${emoji.id}`)
        .setLabel(`${emoji.emoji} ${emoji.name} - ${emoji.price}`)
        .setStyle(ButtonStyle.Secondary)
    );


    buttons.push(
      new ButtonBuilder()
        .setCustomId('back_to_main_shop')
        .setLabel('🔙 العودة للمتجر ')
        .setStyle(ButtonStyle.Primary)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 4) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 4)));
    }

    const emojiMessage = await interaction.update({ 
      embeds: [embed], 
      components: rows,
      files: [],
      fetchReply: true 
    });

    const filter = (i) => (i.customId.startsWith('buy_emoji_') || i.customId === 'back_to_main_shop') && i.user.id === interaction.user.id;
    const collector = emojiMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (i) => {
      if (i.customId === 'back_to_main_shop') {
        await showShop(i, dbq);
      } else {
        await handleEmojiPurchase(i, dbq);
      }
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });

  } catch (error) {
    console.error('Error in showEmojiShop:', error);
    await interaction.update({ content: '❌ حدث خطأ في عرض متجر الإيموجيات.', embeds: [], components: [] });
  }
}

/**
 * معالجة شراء العناصر
 */
async function handleItemPurchase(interaction, dbq) {
  try {
    const itemId = interaction.customId.replace('buy_item_', '');
    const selectedItem = SHOP_ITEMS.find(item => item.id === itemId);
    
    if (!selectedItem) {
      await interaction.update({ content: '❌ عنصر غير صالح.', embeds: [], components: [], files: [] });
      return;
    }

    const currentRoulettePoints = await dbq.get(`roulette_points_${interaction.guild.id}.${interaction.user.id}`) || 0;

    if (currentRoulettePoints < selectedItem.price) {
      await interaction.update({ 
        content: `❌ ليس لديك نقاط روليت كافية لشراء ${selectedItem.name}.\n🧩 تحتاج ${selectedItem.price} نقطة ولديك ${currentRoulettePoints} نقطة.\n\n💡 **ملاحظة:** يمكن الشراء بنقاط الروليت فقط!`,
        embeds: [], 
        components: [],
        files: []
      });
      return;
    }

    const cooldownKey = `item_cooldown_${interaction.guild.id}.${interaction.user.id}.${itemId}`;
    const lastUsed = await dbq.get(cooldownKey) || 0;
    const timeLeft = (lastUsed + selectedItem.cooldown) - Date.now();

    if (timeLeft > 0) {
      const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
      await interaction.update({
        content: `⏳ لا يمكنك شراء ${selectedItem.name} الآن.\nيجب الانتظار ${minutesLeft} دقيقة أخرى.`,
        embeds: [],
        components: [],
        files: []
      });
      return;
    }

    await dbq.set(`roulette_points_${interaction.guild.id}.${interaction.user.id}`, currentRoulettePoints - selectedItem.price);
    
    let userBag = await dbq.get(`bag_${interaction.guild.id}.${interaction.user.id}`) || {};
    userBag[selectedItem.id] = (userBag[selectedItem.id] || 0) + 1;
    await dbq.set(`bag_${interaction.guild.id}.${interaction.user.id}`, userBag);

    await dbq.set(cooldownKey, Date.now());

    await interaction.update({
      content: `✅ تم شراء ${selectedItem.name} بنجاح!\n🧩 تم خصم ${selectedItem.price} نقطة روليت من رصيدك.\n⏳ لا يمكنك شراء هذا العنصر مرة أخرى لمدة ${Math.ceil(selectedItem.cooldown / (60 * 1000))} دقيقة.`,
      embeds: [],
      components: [],
      files: []
    });

  } catch (error) {
    console.error('Error in handleItemPurchase:', error);
    await interaction.update({ content: '❌ حدث خطأ في عملية الشراء.', embeds: [], components: [], files: [] });
  }
}

/**
 * معالجة شراء الإيموجيات
 */
async function handleEmojiPurchase(interaction, dbq) {
  try {
    const emojiId = interaction.customId.replace('buy_emoji_', '');
    const selectedEmoji = EMOJI_SHOP.find(emoji => emoji.id === emojiId);
    
    if (!selectedEmoji) {
      await interaction.update({ content: '❌ إيموجي غير صالح.', embeds: [], components: [], files: [] });
      return;
    }

    const currentRoulettePoints = await dbq.get(`roulette_points_${interaction.guild.id}.${interaction.user.id}`) || 0;

    if (currentRoulettePoints < selectedEmoji.price) {
      await interaction.update({ 
        content: `❌ ليس لديك نقاط روليت كافية لشراء ${selectedEmoji.emoji} ${selectedEmoji.name}.\n🧩 تحتاج ${selectedEmoji.price} نقطة ولديك ${currentRoulettePoints} نقطة.`,
        embeds: [], 
        components: [],
        files: []
      });
      return;
    }


    let userEmojis = await dbq.get(`emojis_${interaction.guild.id}.${interaction.user.id}`) || {};
    if (userEmojis[emojiId]) {
      await interaction.update({
        content: `❌ تملك بالفعل إيموجي ${selectedEmoji.emoji} ${selectedEmoji.name}!`,
        embeds: [],
        components: [],
        files: []
      });
      return;
    }

    await dbq.set(`roulette_points_${interaction.guild.id}.${interaction.user.id}`, currentRoulettePoints - selectedEmoji.price);
    
    userEmojis[emojiId] = {
      name: selectedEmoji.name,
      emoji: selectedEmoji.emoji,
      purchaseDate: Date.now()
    };
    await dbq.set(`emojis_${interaction.guild.id}.${interaction.user.id}`, userEmojis);

    await interaction.update({
      content: `✅ تم شراء ${selectedEmoji.emoji} ${selectedEmoji.name} بنجاح!\n🧩 تم خصم ${selectedEmoji.price} نقطة روليت من رصيدك.\n💡 يمكنك تفعيله من الحقيبة ليظهر بدلاً من رمز النقاط العادي.`,
      embeds: [],
      components: [],
      files: []
    });

  } catch (error) {
    console.error('Error in handleEmojiPurchase:', error);
    await interaction.update({ content: '❌ حدث خطأ في عملية شراء الإيموجي.', embeds: [], components: [], files: [] });
  }
}

/**
 * عرض الحقيبة مع خيار الإيموجيات
 */
async function showBag(interaction, dbq) {
  try {
    const userBag = await dbq.get(`bag_${interaction.guild.id}.${interaction.user.id}`) || {};
    const userEmojis = await dbq.get(`emojis_${interaction.guild.id}.${interaction.user.id}`) || {};
    const selectedItem = await dbq.get(`selected_item_${interaction.guild.id}.${interaction.user.id}`) || null;
    const selectedEmoji = await dbq.get(`selected_emoji_${interaction.guild.id}.${interaction.user.id}`) || null;

    if (Object.keys(userBag).length === 0 && Object.keys(userEmojis).length === 0) {
      return await interaction.reply({ 
        content: '🎒 حقيبتك فارغة!\n🛒 قم بشراء عناصر أو إيموجيات من المتجر أولاً باستخدام نقاط الروليت.', 
        ephemeral: true 
      });
    }

    const selectedEmojiInfo = selectedEmoji ? userEmojis[selectedEmoji] : null;
    const currentEmojiDisplay = selectedEmojiInfo ? selectedEmojiInfo.emoji : '🧩';

    const embed = new EmbedBuilder()
      .setTitle('🎒 حقيبتك')
      .setDescription(`**العنصر المحدد حالياً:** ${selectedItem ? ITEM_NAMES[selectedItem] : 'لا يوجد'}\n**الإيموجي المحدد حالياً:** ${currentEmojiDisplay}\n\n**اختر من الأقسام التالية:**`)
      .addFields(
        { name: '⚔️ الخصائص', value: `لديك ${Object.keys(userBag).filter(item => userBag[item] > 0).length} عنصر`, inline: true },
        { name: '🎨 الإيموجيات', value: `لديك ${Object.keys(userEmojis).length} إيموجي`, inline: true }
      )
      .setColor('#FFFFFF')
      .setFooter({ text: 'اختر القسم الذي تريد إدارته' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('bag_items')
          .setLabel('الخصائص')
           .setEmoji('<:collage:1400198900660306092>')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('bag_emojis')
          .setLabel('الإيموجيات')
          .setEmoji('<:wink:1400198902422048818>')
          .setStyle(ButtonStyle.Secondary)
      );

    const bagMessage = await interaction.reply({ 
      embeds: [embed], 
      components: [row], 
      ephemeral: true, 
      fetchReply: true 
    });

    const filter = (i) => (i.customId === 'bag_items' || i.customId === 'bag_emojis') && i.user.id === interaction.user.id;
    const collector = bagMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (i) => {
      if (i.customId === 'bag_items') {
        await showItemsBag(i, dbq);
      } else if (i.customId === 'bag_emojis') {
        await showEmojisBag(i, dbq);
      }
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });

  } catch (error) {
    console.error('Error in showBag:', error);
    await interaction.reply({ content: '❌ حدث خطأ في عرض الحقيبة.', ephemeral: true });
  }
}

/**
 * عرض حقيبة العناصر
 */
async function showItemsBag(interaction, dbq) {
  try {
    const userBag = await dbq.get(`bag_${interaction.guild.id}.${interaction.user.id}`) || {};
    const selectedItem = await dbq.get(`selected_item_${interaction.guild.id}.${interaction.user.id}`) || null;

    const availableItems = Object.entries(userBag).filter(([item, count]) => count > 0);

    if (availableItems.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('⚔️ الخصائص')
        .setDescription('📦 لا تملك أي عناصر حالياً!')
        .setColor('#FF6B6B');

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('back_to_main_bag')
            .setLabel('🔙 العودة للحقيبة الرئيسية')
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.update({ 
        embeds: [embed], 
        components: [backButton]
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('⚔️ الخصائص')
      .setDescription(`**العنصر المحدد حالياً:** ${selectedItem ? ITEM_NAMES[selectedItem] : 'لا يوجد'}\n\n**عناصرك:**`)
      .addFields(
        availableItems.map(([item, count]) => ({
          name: ITEM_NAMES[item],
          value: `العدد: ${count}${selectedItem === item ? ' ✅' : ''}`,
          inline: true
        }))
      )
      .setColor('#FFFFFF')
      .setFooter({ text: 'يمكنك تحديد عنصر واحد فقط للاستخدام في اللعبة' });

    const buttons = availableItems.map(([item, count]) => 
      new ButtonBuilder()
        .setCustomId(`select_item_${item}`)
        .setLabel(`${ITEM_NAMES[item]} (${count})`)
        .setStyle(selectedItem === item ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

    if (selectedItem) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId("unselect_item")
          .setLabel("❌ إلغاء التحديد")
          .setStyle(ButtonStyle.Danger)
      );
    }


    buttons.push(
      new ButtonBuilder()
        .setCustomId('back_to_main_bag')
        .setLabel('🔙 العودة للحقيبة الرئيسية')
        .setStyle(ButtonStyle.Primary)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 4) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 4)));
    }

    const itemsBagMessage = await interaction.update({ 
      embeds: [embed], 
      components: rows, 
      fetchReply: true 
    });

    const filter = (i) => (i.customId.startsWith('select_item_') || i.customId === 'unselect_item' || i.customId === 'back_to_main_bag') && i.user.id === interaction.user.id;
    const collector = itemsBagMessage.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async (i) => {
      if (i.customId === 'back_to_main_bag') {
        await showBag(i, dbq);
      } else {
        await handleItemSelection(i, dbq);
      }
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });

  } catch (error) {
    console.error('Error in showItemsBag:', error);
    await interaction.update({ content: '❌ حدث خطأ في عرض حقيبة العناصر.', embeds: [], components: [] });
  }
}

/**
 * عرض حقيبة الإيموجيات
 */
async function showEmojisBag(interaction, dbq) {
  try {
    const userEmojis = await dbq.get(`emojis_${interaction.guild.id}.${interaction.user.id}`) || {};
    const selectedEmoji = await dbq.get(`selected_emoji_${interaction.guild.id}.${interaction.user.id}`) || null;

    const availableEmojis = Object.entries(userEmojis);

    if (availableEmojis.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('🎨 الإيموجيات')
        .setDescription('📦 لا تملك أي إيموجيات حالياً!')
        .setColor('#FF6B6B');

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('back_to_main_bag')
            .setLabel('🔙 العودة للحقيبة الرئيسية')
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
      .setTitle('🎨 الإيموجيات')
      .setDescription(`**الإيموجي المحدد حالياً:** ${currentEmojiDisplay}\n\n**إيموجياتك:**`)
      .addFields(
        availableEmojis.map(([emojiId, emojiData]) => ({
          name: `${emojiData.emoji} ${emojiData.name}`,
          value: `${selectedEmoji === emojiId ? '✅ محدد حالياً' : '⚪ غير محدد'}`,
          inline: true
        }))
      )
      .setColor('#FFD700')
      .setFooter({ text: 'يمكنك تحديد إيموجي واحد فقط ليظهر بدلاً من رمز النقاط' });

    const buttons = availableEmojis.map(([emojiId, emojiData]) => 
      new ButtonBuilder()
        .setCustomId(`select_emoji_${emojiId}`)
        .setLabel(`${emojiData.emoji} ${emojiData.name}`)
        .setStyle(selectedEmoji === emojiId ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

    if (selectedEmoji) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId("unselect_emoji")
          .setLabel("❌ إلغاء التحديد")
          .setStyle(ButtonStyle.Danger)
      );
    }


    buttons.push(
      new ButtonBuilder()
        .setCustomId('back_to_main_bag')
        .setLabel('🔙 العودة للحقيبة الرئيسية')
        .setStyle(ButtonStyle.Primary)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 4) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 4)));
    }

    const emojisBagMessage = await interaction.update({ 
      embeds: [embed], 
      components: rows, 
      fetchReply: true 
    });

    const filter = (i) => (i.customId.startsWith('select_emoji_') || i.customId === 'unselect_emoji' || i.customId === 'back_to_main_bag') && i.user.id === interaction.user.id;
    const collector = emojisBagMessage.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async (i) => {
      if (i.customId === 'back_to_main_bag') {
        await showBag(i, dbq);
      } else {
        await handleEmojiSelection(i, dbq);
      }
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });

  } catch (error) {
    console.error('Error in showEmojisBag:', error);
    await interaction.update({ content: '❌ حدث خطأ في عرض حقيبة الإيموجيات.', embeds: [], components: [] });
  }
}

/**
 * معالجة تحديد العناصر من الحقيبة
 */
async function handleItemSelection(interaction, dbq) {
  try {
    if (interaction.customId === 'unselect_item') {
      await dbq.delete(`selected_item_${interaction.guild.id}.${interaction.user.id}`);
      await interaction.update({
        content: '❌ تم إلغاء تحديد العنصر.',
        embeds: [],
        components: []
      });
    } else {
      const itemId = interaction.customId.replace('select_item_', '');
      await dbq.set(`selected_item_${interaction.guild.id}.${interaction.user.id}`, itemId);
      await interaction.update({
        content: `✅ تم تحديد ${ITEM_NAMES[itemId]} للاستخدام في اللعبة القادمة.\n🎮 سيتم استخدامه تلقائياً في الوقت المناسب أثناء اللعبة.`,
        embeds: [],
        components: []
      });
    }
  } catch (error) {
    console.error('Error in handleItemSelection:', error);
    await interaction.update({ content: '❌ حدث خطأ في تحديد العنصر.', embeds: [], components: [] });
  }
}

/**
 * معالجة تحديد الإيموجيات من الحقيبة
 */
async function handleEmojiSelection(interaction, dbq) {
  try {
    if (interaction.customId === 'unselect_emoji') {
      await dbq.delete(`selected_emoji_${interaction.guild.id}.${interaction.user.id}`);
      await interaction.update({
        content: '❌ تم إلغاء تحديد الإيموجي. سيتم عرض الرمز العادي 🧩 بدلاً منه.',
        embeds: [],
        components: []
      });
    } else {
      const emojiId = interaction.customId.replace('select_emoji_', '');
      const userEmojis = await dbq.get(`emojis_${interaction.guild.id}.${interaction.user.id}`) || {};
      const selectedEmojiData = userEmojis[emojiId];
      
      if (selectedEmojiData) {
        await dbq.set(`selected_emoji_${interaction.guild.id}.${interaction.user.id}`, emojiId);
        await interaction.update({
          content: `✅ تم تحديد ${selectedEmojiData.emoji} ${selectedEmojiData.name}!\n🎨 سيظهر هذا الإيموجي بدلاً من رمز النقاط العادي في جميع رسائل النقاط.`,
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
    console.error('Error in handleEmojiSelection:', error);
    await interaction.update({ content: '❌ حدث خطأ في تحديد الإيموجي.', embeds: [], components: [] });
  }
}

/**
 * الحصول على إيموجي النقاط للمستخدم
 */
async function getUserPointsEmoji(userId, guildId, dbq) {
  try {
    const selectedEmoji = await dbq.get(`selected_emoji_${guildId}.${userId}`);
    if (!selectedEmoji) return '🧩';
    
    const userEmojis = await dbq.get(`emojis_${guildId}.${userId}`) || {};
    const emojiData = userEmojis[selectedEmoji];
    
    return emojiData ? emojiData.emoji : '🧩';
  } catch (error) {
    console.error('Error in getUserPointsEmoji:', error);
    return '🧩';
  }
}

/**
 * عرض الإحصائيات للمستخدم مع الإيموجي المخصص
 */
async function showStats(interaction, dbq, guildId) {
  try {
    const userId = interaction.user.id;
    const stats = await dbq.get(`roulette_stats_${guildId}.${userId}`) || {
      kicks: 0,
      kicked: 0,
      wins: 0,
      withdrawals: 0
    };
    
    const roulettePoints = await dbq.get(`roulette_points_${guildId}.${userId}`) || 0;
    const generalPoints = await dbq.get(`points_${guildId}.${userId}`) || 0;
    const userEmoji = await getUserPointsEmoji(userId, guildId, dbq);
    
    const totalGames = stats.wins + stats.kicked + stats.withdrawals;

    const embed = new EmbedBuilder()
      .setTitle(`📊 إحصائيات ${interaction.user.displayName} في الروليت`)
      .addFields(
        { name: 'نقاط الروليت', value: `${userEmoji} ${roulettePoints}`, inline: false },
        { name: 'النقاط العامة', value: `${generalPoints}`, inline: false },
        { name: 'مرات الفوز', value: `${stats.wins}`, inline: false },
        { name: 'مرات الطرد', value: `${stats.kicks}`, inline: false },
        { name: 'مرات انطردت', value: `${stats.kicked}`, inline: false },
        { name: 'مرات الانسحاب', value: `${stats.withdrawals}`, inline: false },
        { name: 'إجمالي الألعاب', value: `${totalGames}`, inline: false },
        { name: 'إجمالي مرات الخروج', value: `${stats.kicked + stats.withdrawals}`, inline: false }
      )
      .setColor('#dfe1dc')
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'نقاط الروليت تُكتسب من الفوز في الروليت وتُستخدم لشراء الخصائص والإيموجيات' });

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Error in showStats:', error);
    await interaction.reply({ content: '❌ حدث خطأ في عرض الإحصائيات.', ephemeral: true });
  }
}

/**
 * استخدام العناصر في اللعبة - الدالة الرئيسية
 */
async function useSelectedItem(userId, guildId, dbq, type, data = null) {
  try {
    const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
    if (!selectedItem) return false;

    const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
    if (!userBag[selectedItem] || userBag[selectedItem] <= 0) {
      await dbq.delete(`selected_item_${guildId}.${userId}`);
      return false;
    }


    const disabledUntil = await dbq.get(`disabled_until_${guildId}.${userId}`) || 0;
    if (Date.now() < disabledUntil) {
      return 'disabled';
    }

    let result = false;

    switch (selectedItem) {

      case 'bomb':
        result = await useBomb(userId, guildId, dbq, type, data);
        break;
      case 'shield':
        result = await useShield(userId, guildId, dbq, type, data);
        break;
      case 'swap':
        result = await useSwap(userId, guildId, dbq, type, data);
        if (result && result !== false && result !== 'protected') {
          result = { type: 'swap', targetId: result };
        }
        break;
      case 'revive':
        result = await useRevive(userId, guildId, dbq, type, data);
        break;
      case 'counter_attack':
        result = await useCounterAttack(userId, guildId, dbq, type, data);
        if (result && result !== false && result !== 'protected') {
          result = { type: 'counter_attack', targetId: result };
        }
        break;
      

      case 'snipe':
        result = await useSnipe(userId, guildId, dbq, type, data);
        break;
      case 'hack':
        result = await useHack(userId, guildId, dbq, type, data);
        break;
      case 'stealth':
        result = await useStealth(userId, guildId, dbq, type, data);
        break;
      case 'link':
        result = await useLink(userId, guildId, dbq, type, data);
        break;
      case 'reveal':
        result = await useReveal(userId, guildId, dbq, type, data);
        break;
      case 'disable':
        result = await useDisable(userId, guildId, dbq, type, data);
        break;
    }

    return result;

  } catch (error) {
    console.error('Error in useSelectedItem:', error);
    return false;
  }
}

/**
 * باقي الدوال الخاصة بالقدرات - سأختصرها لتوفير المساحة
 */


async function useBomb(userId, guildId, dbq, type, data) {
  if (type === 'manual_bomb_check') {
    if (!data || data.players.length <= 3) return false;
    return 'can_bomb';
  }
   if (type === 'manual_bomb') {
    if (!data || data.players.length <= 3) return false;

    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'bomb') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['bomb'] || userBag['bomb'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      userBag['bomb']--;
      if (userBag['bomb'] <= 0) {
        delete userBag['bomb'];
      }
      await dbq.set(`bag_${guildId}.${userId}`, userBag);
      await dbq.delete(`selected_item_${guildId}.${userId}`);

      const availablePlayers = data.players.filter(p => p.id !== data.excludeUserId);
      if (availablePlayers.length === 0) return false;

      const removedCount = Math.min(3, availablePlayers.length);
      const removedPlayers = [];

      for (let i = 0; i < removedCount; i++) {
        if (availablePlayers.length === 0) break;
        
        const randomIndex = Math.floor(Math.random() * availablePlayers.length);
        const playerToRemove = availablePlayers.splice(randomIndex, 1)[0];
        const playerIndex = data.players.findIndex(p => p.id === playerToRemove.id);
        
        if (playerIndex !== -1) {
          const removedPlayer = data.players.splice(playerIndex, 1)[0];
          data.removedPlayers.push(removedPlayer);
          removedPlayers.push(removedPlayer);
        }
      }

      const userName = data.message.guild.members.cache.get(userId)?.displayName || 'مجهول';
      await data.message.channel.send(`💣 **${userName}** استخدم القنبلة وتم إخراج **${removedCount}** لاعبين عشوائيين من اللعبة!`);
      
      return true;

    } catch (error) {
      console.error('Error in useBomb manual:', error);
      return false;
    }
  }

  return false;
}

async function useShield(userId, guildId, dbq, type, data) {
  if (type === 'manual_shield_check') {
    return 'can_shield';
  }

  if (type === 'being_kicked' && data && data.targetId === userId) {
    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'shield') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['shield'] || userBag['shield'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      userBag['shield']--;
      if (userBag['shield'] <= 0) {
        delete userBag['shield'];
      }
      await dbq.set(`bag_${guildId}.${userId}`, userBag);
      await dbq.delete(`selected_item_${guildId}.${userId}`);

      return 'protected';

    } catch (error) {
      console.error('Error in useShield:', error);
      return false;
    }
  }

  return false;
}

async function useSwap(userId, guildId, dbq, type, data) {
  if (type === 'manual_swap_check') {
    return 'can_swap';
  }

  if (type === 'being_kicked' && data && data.targetId === userId) {
    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'swap') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['swap'] || userBag['swap'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      userBag['swap']--;
      if (userBag['swap'] <= 0) {
        delete userBag['swap'];
      }
      await dbq.set(`bag_${guildId}.${userId}`, userBag);
      await dbq.delete(`selected_item_${guildId}.${userId}`);
      
      return data.kickerId;

    } catch (error) {
      console.error('Error in useSwap:', error);
      return false;
    }
  }

  return false;
}

async function useRevive(userId, guildId, dbq, type, data) {
  if (type === 'manual_revive_check') {
    if (!data || data.removedPlayers.length === 0) return false;
    return 'can_revive';
  }

  if (type === 'manual_revive') {
    if (!data || data.removedPlayers.length === 0) return false;

    try {
      const removedPlayers = data.removedPlayers;
      
      const reviveButtons = [];
      for (let i = 0; i < Math.min(removedPlayers.length, 20); i++) {
        const removedPlayer = removedPlayers[i];
        const user = await data.message.guild.members.cache.get(removedPlayer.id);
        const displayName = user ? user.displayName : removedPlayer.username;
        
        reviveButtons.push({
          id: `revive_${removedPlayer.id}`,
          label: `${displayName}`,
          style: 'SUCCESS',
          disabled: false
        });
      }

      if (reviveButtons.length === 0) return false;

      const components = [];
      for (let i = 0; i < reviveButtons.length; i += 4) {
        const row = reviveButtons.slice(i, i + 4).map(btn => 
          new ButtonBuilder()
            .setCustomId(btn.id)
            .setLabel(btn.label)
            .setStyle(ButtonStyle.Success)
        );
        components.push(new ActionRowBuilder().addComponents(row));
      }

      const userName = data.message.guild.members.cache.get(userId)?.displayName || 'مجهول';
      const reviveMessage = await data.message.channel.send({
        content: `🩹 **${userName}** استخدم الإنعاش! اختر لاعباً لإنعاشه:`,
        components: components
      });

      const reviveCollector = reviveMessage.createMessageComponentCollector({
        filter: i => i.user.id === userId && i.customId.startsWith('revive_'),
        time: 15000,
        max: 1
      });

      return new Promise((resolve) => {
        reviveCollector.on('collect', async (interaction) => {
          try {
            await interaction.deferUpdate();
            
            const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
            if (selectedItem !== 'revive') {
              resolve(false);
              return;
            }

            const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
            if (!userBag['revive'] || userBag['revive'] <= 0) {
              await dbq.delete(`selected_item_${guildId}.${userId}`);
              resolve(false);
              return;
            }

            userBag['revive']--;
            if (userBag['revive'] <= 0) {
              delete userBag['revive'];
            }
            await dbq.set(`bag_${guildId}.${userId}`, userBag);
            await dbq.delete(`selected_item_${guildId}.${userId}`);
            
            const selectedPlayerId = interaction.customId.replace('revive_', '');
            const removedIndex = data.removedPlayers.findIndex(player => player.id === selectedPlayerId);
            
            if (removedIndex > -1) {
              const [removedPlayer] = data.removedPlayers.splice(removedIndex, 1);
              
              data.players.push({
                id: removedPlayer.id,
                username: removedPlayer.username,
                position: data.players.length,
                avatar: removedPlayer.avatar || `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`
              });
              
              const revivedUser = data.message.guild.members.cache.get(selectedPlayerId);
              const displayName = revivedUser ? revivedUser.displayName : removedPlayer.username;
              
              await reviveMessage.edit({
                content: `✅ تم إنعاش **${displayName}** بنجاح! سيتم بدء الجولة القادمة خلال ثواني.`,
                components: []
              });
              
              resolve(true);
            } else {
              await reviveMessage.edit({
                content: `❌ حدث خطأ في إنعاش اللاعب.`,
                components: []
              });
              resolve(false);
            }
          } catch (error) {
            console.error('Error in revive collector:', error);
            resolve(false);
          }
        });

        reviveCollector.on('end', (collected) => {
          if (collected.size === 0) {
            reviveMessage.edit({
              content: `⏰ انتهت مهلة الاختيار للإنعاش.`,
              components: []
            }).catch(() => {});
            resolve(false);
          }
        });
      });

    } catch (error) {
      console.error('Error in useRevive manual:', error);
      return false;
    }
  }

  return false;
}


async function useCounterAttack(userId, guildId, dbq, type, data) {
  if (type === 'manual_counter_attack_check') {
    return 'can_counter_attack';
  }

  if (type === 'being_kicked' && data && data.targetId === userId) {
    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'counter_attack') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['counter_attack'] || userBag['counter_attack'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      userBag['counter_attack']--;
      if (userBag['counter_attack'] <= 0) {
        delete userBag['counter_attack'];
      }
      await dbq.set(`bag_${guildId}.${userId}`, userBag);
      await dbq.delete(`selected_item_${guildId}.${userId}`);
      
      return data.kickerId;

    } catch (error) {
      console.error('Error in useCounterAttack:', error);
      return false;
    }
  }

  return false;
}



async function useSnipe(userId, guildId, dbq, type, data) {
  if (type === 'manual_snipe_check') {
    if (!data || data.players.length <= 2) return false;
    return 'can_snipe';
  }

  if (type === 'manual_snipe') {
    if (!data || data.players.length <= 2) return false;

    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'snipe') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['snipe'] || userBag['snipe'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      const availablePlayers = data.players.filter(p => p.id !== userId);
      const snipeButtons = availablePlayers.map(player => ({
        id: `snipe_${player.id}`,
        label: `${player.username}`,
        style: 'DANGER',
        disabled: false
      }));

      const components = [];
      for (let i = 0; i < snipeButtons.length; i += 4) {
        const row = snipeButtons.slice(i, i + 4).map(btn => 
          new ButtonBuilder()
            .setCustomId(btn.id)
            .setLabel(btn.label)
            .setStyle(ButtonStyle.Danger)
        );
        components.push(new ActionRowBuilder().addComponents(row));
      }

      const userName = data.message.guild.members.cache.get(userId)?.displayName || 'مجهول';
      const snipeMessage = await data.message.channel.send({
        content: `🎯 **${userName}** استخدم القنص! اختر هدفك:`,
        components: components
      });

      const snipeCollector = snipeMessage.createMessageComponentCollector({
        filter: i => i.user.id === userId && i.customId.startsWith('snipe_'),
        time: 15000,
        max: 1
      });

      return new Promise((resolve) => {
        snipeCollector.on('collect', async (interaction) => {
          try {
            await interaction.deferUpdate();
            
            userBag['snipe']--;
            if (userBag['snipe'] <= 0) {
              delete userBag['snipe'];
            }
            await dbq.set(`bag_${guildId}.${userId}`, userBag);
            await dbq.delete(`selected_item_${guildId}.${userId}`);
            
            const targetId = interaction.customId.replace('snipe_', '');
            const targetIndex = data.players.findIndex(p => p.id === targetId);
            
            if (targetIndex > -1) {
              const [targetPlayer] = data.players.splice(targetIndex, 1);
              data.removedPlayers.push(targetPlayer);
              
              const targetUser = data.message.guild.members.cache.get(targetId);
              const displayName = targetUser ? targetUser.displayName : targetPlayer.username;
              
              await snipeMessage.edit({
                content: `🎯 **${userName}** قنص **${displayName}** بنجاح! تم إقصاؤه فوراً من اللعبة!`,
                components: []
              });
              
              let sniperStats = await dbq.get(`roulette_stats_${guildId}.${userId}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
              sniperStats.kicks++;
              await dbq.set(`roulette_stats_${guildId}.${userId}`, sniperStats);
              
              let targetStats = await dbq.get(`roulette_stats_${guildId}.${targetId}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
              targetStats.kicked++;
              await dbq.set(`roulette_stats_${guildId}.${targetId}`, targetStats);
              
              resolve(true);
            } else {
              await snipeMessage.edit({
                content: `❌ حدث خطأ في عملية القنص.`,
                components: []
              });
              resolve(false);
            }
          } catch (error) {
            console.error('Error in snipe collector:', error);
            resolve(false);
          }
        });

        snipeCollector.on('end', (collected) => {
          if (collected.size === 0) {
            snipeMessage.edit({
              content: `⏰ انتهت مهلة القنص.`,
              components: []
            }).catch(() => {});
            resolve(false);
          }
        });
      });

    } catch (error) {
      console.error('Error in useSnipe manual:', error);
      return false;
    }
  }

  return false;
}

async function useHack(userId, guildId, dbq, type, data) {
  if (type === 'manual_hack_check') {
    return 'can_hack';
  }

  if (type === 'manual_hack') {
    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'hack') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['hack'] || userBag['hack'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      const playersWithItems = [];
      for (const player of data.players) {
        if (player.id === userId) continue;
        
        const targetSelectedItem = await dbq.get(`selected_item_${guildId}.${player.id}`);
        if (targetSelectedItem) {
          playersWithItems.push({
            id: player.id,
            username: player.username,
            item: targetSelectedItem
          });
        }
      }

      if (playersWithItems.length === 0) {
        const userName = data.message.guild.members.cache.get(userId)?.displayName || 'مجهول';
        await data.message.channel.send(`💻 **${userName}** حاول التهكير ولكن لا يوجد لاعبين لديهم عناصر نشطة!`);
        return false;
      }

      const hackButtons = playersWithItems.map(player => ({
        id: `hack_${player.id}`,
        label: `${player.username} (${ITEM_NAMES[player.item]})`,
        style: 'SECONDARY',
        disabled: false
      }));

      const components = [];
      for (let i = 0; i < hackButtons.length; i += 4) {
        const row = hackButtons.slice(i, i + 4).map(btn => 
          new ButtonBuilder()
            .setCustomId(btn.id)
            .setLabel(btn.label)
            .setStyle(ButtonStyle.Secondary)
        );
        components.push(new ActionRowBuilder().addComponents(row));
      }

      const userName = data.message.guild.members.cache.get(userId)?.displayName || 'مجهول';
      const hackMessage = await data.message.channel.send({
        content: `💻 **${userName}** استخدم التهكير! اختر هدفك لسرقة قدرته:`,
        components: components
      });

      const hackCollector = hackMessage.createMessageComponentCollector({
        filter: i => i.user.id === userId && i.customId.startsWith('hack_'),
        time: 15000,
        max: 1
      });

      return new Promise((resolve) => {
        hackCollector.on('collect', async (interaction) => {
          try {
            await interaction.deferUpdate();
            
            userBag['hack']--;
            if (userBag['hack'] <= 0) {
              delete userBag['hack'];
            }
            await dbq.set(`bag_${guildId}.${userId}`, userBag);
            await dbq.delete(`selected_item_${guildId}.${userId}`);
            
            const targetId = interaction.customId.replace('hack_', '');
            const targetSelectedItem = await dbq.get(`selected_item_${guildId}.${targetId}`);
            
            if (targetSelectedItem) {
              await dbq.set(`selected_item_${guildId}.${userId}`, targetSelectedItem);
              await dbq.delete(`selected_item_${guildId}.${targetId}`);
              
              const targetUser = data.message.guild.members.cache.get(targetId);
              const targetName = targetUser ? targetUser.displayName : 'مجهول';
              
              await hackMessage.edit({
                content: `💻 **${userName}** اخترق **${targetName}** وسرق منه ${ITEM_NAMES[targetSelectedItem]}!`,
                components: []
              });
              
              resolve(true);
            } else {
              await hackMessage.edit({
                content: `❌ فشل في التهكير - الهدف لا يملك عناصر نشطة.`,
                components: []
              });
              resolve(false);
            }
          } catch (error) {
            console.error('Error in hack collector:', error);
            resolve(false);
          }
        });

        hackCollector.on('end', (collected) => {
          if (collected.size === 0) {
            hackMessage.edit({
              content: `⏰ انتهت مهلة التهكير.`,
              components: []
            }).catch(() => {});
            resolve(false);
          }
        });
      });

    } catch (error) {
      console.error('Error in useHack manual:', error);
      return false;
    }
  }

  return false;
}
async function useStealth(userId, guildId, dbq, type, data) {
  if (type === 'manual_stealth_check') {
    return 'can_stealth';
  }

  if (type === 'manual_stealth') {
    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'stealth') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['stealth'] || userBag['stealth'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      userBag['stealth']--;
      if (userBag['stealth'] <= 0) {
        delete userBag['stealth'];
      }
      await dbq.set(`bag_${guildId}.${userId}`, userBag);
      await dbq.delete(`selected_item_${guildId}.${userId}`);

      await dbq.set(`stealth_active_${guildId}.${userId}`, Date.now() + (5 * 60 * 1000));

      const userName = data.message.guild.members.cache.get(userId)?.displayName || 'مجهول';
      await data.message.channel.send(`👻 **${userName}** استخدم الإخفاء وسيختفي من التصويت في الجولة القادمة!`);
      
      return true;

    } catch (error) {
      console.error('Error in useStealth manual:', error);
      return false;
    }
  }

  if (type === 'check_stealth') {
    const stealthUntil = await dbq.get(`stealth_active_${guildId}.${userId}`) || 0;
    return Date.now() < stealthUntil;
  }

  return false;
}

async function useLink(userId, guildId, dbq, type, data) {
  if (type === 'manual_link_check') {
    if (!data || data.players.length <= 3) return false;
    return 'can_link';
  }

  if (type === 'manual_link') {
    if (!data || data.players.length <= 3) return false;

    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'link') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['link'] || userBag['link'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      const availablePlayers = data.players.filter(p => p.id !== userId);
      const linkButtons = availablePlayers.map(player => ({
        id: `link_first_${player.id}`,
        label: `${player.username}`,
        style: 'SUCCESS',
        disabled: false
      }));

      const components = [];
      for (let i = 0; i < linkButtons.length; i += 4) {
        const row = linkButtons.slice(i, i + 4).map(btn => 
          new ButtonBuilder()
            .setCustomId(btn.id)
            .setLabel(btn.label)
            .setStyle(ButtonStyle.Success)
        );
        components.push(new ActionRowBuilder().addComponents(row));
      }

      const userName = data.message.guild.members.cache.get(userId)?.displayName || 'مجهول';
      const linkMessage = await data.message.channel.send({
        content: `🔗 **${userName}** استخدم الربط! اختر اللاعب الأول:`,
        components: components
      });

      const linkCollector = linkMessage.createMessageComponentCollector({
        filter: i => i.user.id === userId && i.customId.startsWith('link_'),
        time: 20000
      });

      let firstPlayerId = null;

      return new Promise((resolve) => {
        linkCollector.on('collect', async (interaction) => {
          try {
            await interaction.deferUpdate();
            
            if (interaction.customId.startsWith('link_first_')) {
              firstPlayerId = interaction.customId.replace('link_first_', '');
              
              const secondPlayerButtons = availablePlayers
                .filter(p => p.id !== firstPlayerId)
                .map(player => ({
                  id: `link_second_${player.id}`,
                  label: `${player.username}`,
                  style: 'SUCCESS',
                  disabled: false
                }));

              const secondComponents = [];
              for (let i = 0; i < secondPlayerButtons.length; i += 4) {
                const row = secondPlayerButtons.slice(i, i + 4).map(btn => 
                  new ButtonBuilder()
                    .setCustomId(btn.id)
                    .setLabel(btn.label)
                    .setStyle(ButtonStyle.Success)
                );
                secondComponents.push(new ActionRowBuilder().addComponents(row));
              }

              const firstPlayer = availablePlayers.find(p => p.id === firstPlayerId);
              await linkMessage.edit({
                content: `🔗 **${userName}** اختار **${firstPlayer.username}**. الآن اختر اللاعب الثاني للربط:`,
                components: secondComponents
              });
              
            } else if (interaction.customId.startsWith('link_second_')) {
              const secondPlayerId = interaction.customId.replace('link_second_', '');
              
              userBag['link']--;
              if (userBag['link'] <= 0) {
                delete userBag['link'];
              }
              await dbq.set(`bag_${guildId}.${userId}`, userBag);
              await dbq.delete(`selected_item_${guildId}.${userId}`);
              
              const linkId = `${Date.now()}_${Math.random()}`;
              await dbq.set(`link_${guildId}.${linkId}`, {
                player1: firstPlayerId,
                player2: secondPlayerId,
                createdBy: userId,
                createdAt: Date.now()
              });
              
              await dbq.set(`linked_to_${guildId}.${firstPlayerId}`, secondPlayerId);
              await dbq.set(`linked_to_${guildId}.${secondPlayerId}`, firstPlayerId);
              
              const firstPlayer = availablePlayers.find(p => p.id === firstPlayerId);
              const secondPlayer = availablePlayers.find(p => p.id === secondPlayerId);
              
              await linkMessage.edit({
                content: `🔗 **${userName}** ربط مصير **${firstPlayer.username}** مع **${secondPlayer.username}**!\n💀 إذا طُرد أحدهما، سيُطرد الآخر معه!`,
                components: []
              });
              
              resolve(true);
            }
          } catch (error) {
            console.error('Error in link collector:', error);
            resolve(false);
          }
        });

        linkCollector.on('end', (collected) => {
          if (collected.size === 0) {
            linkMessage.edit({
              content: `⏰ انتهت مهلة الربط.`,
              components: []
            }).catch(() => {});
            resolve(false);
          }
        });
      });

    } catch (error) {
      console.error('Error in useLink manual:', error);
      return false;
    }
  }

  if (type === 'check_linked') {
    const linkedTo = await dbq.get(`linked_to_${guildId}.${data.playerId}`);
    return linkedTo || null;
  }

  return false;
}

async function useReveal(userId, guildId, dbq, type, data) {
  if (type === 'manual_reveal_check') {
    return 'can_reveal';
  }

  if (type === 'manual_reveal') {
    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'reveal') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['reveal'] || userBag['reveal'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      userBag['reveal']--;
      if (userBag['reveal'] <= 0) {
        delete userBag['reveal'];
      }
      await dbq.set(`bag_${guildId}.${userId}`, userBag);
      await dbq.delete(`selected_item_${guildId}.${userId}`);

      const activeItems = [];
      const stealthPlayers = [];
      const disabledPlayers = [];
      const linkedPairs = [];

      for (const player of data.players) {
        const playerSelectedItem = await dbq.get(`selected_item_${guildId}.${player.id}`);
        if (playerSelectedItem) {
          activeItems.push({
            username: player.username,
            item: ITEM_NAMES[playerSelectedItem]
          });
        }

        const stealthUntil = await dbq.get(`stealth_active_${guildId}.${player.id}`) || 0;
        if (Date.now() < stealthUntil) {
          stealthPlayers.push(player.username);
        }

        const disabledUntil = await dbq.get(`disabled_until_${guildId}.${player.id}`) || 0;
        if (Date.now() < disabledUntil) {
          disabledPlayers.push(player.username);
        }

        const linkedTo = await dbq.get(`linked_to_${guildId}.${player.id}`);
        if (linkedTo) {
          const linkedPlayer = data.players.find(p => p.id === linkedTo);
          if (linkedPlayer && !linkedPairs.some(pair => 
            (pair.player1 === player.username && pair.player2 === linkedPlayer.username) ||
            (pair.player1 === linkedPlayer.username && pair.player2 === player.username)
          )) {
            linkedPairs.push({
              player1: player.username,
              player2: linkedPlayer.username
            });
          }
        }
      }

      let revealReport = `🔍 **تقرير الكشف:**\n\n`;
      
      if (activeItems.length > 0) {
        revealReport += `**العناصر النشطة:**\n`;
        activeItems.forEach(item => {
          revealReport += `• ${item.username}: ${item.item}\n`;
        });
        revealReport += `\n`;
      }

      if (stealthPlayers.length > 0) {
        revealReport += `**لاعبين مخفيين:**\n`;
        stealthPlayers.forEach(player => {
          revealReport += `• ${player} 👻\n`;
        });
        revealReport += `\n`;
      }

      if (disabledPlayers.length > 0) {
        revealReport += `**لاعبين معطلين:**\n`;
        disabledPlayers.forEach(player => {
          revealReport += `• ${player} 🚫\n`;
        });
        revealReport += `\n`;
      }

      if (linkedPairs.length > 0) {
        revealReport += `**الروابط النشطة:**\n`;
        linkedPairs.forEach(pair => {
          revealReport += `• ${pair.player1} 🔗 ${pair.player2}\n`;
        });
        revealReport += `\n`;
      }

      if (activeItems.length === 0 && stealthPlayers.length === 0 && 
          disabledPlayers.length === 0 && linkedPairs.length === 0) {
        revealReport += `**لا توجد حالات خاصة نشطة حالياً.**`;
      }

      const userName = data.message.guild.members.cache.get(userId)?.displayName || 'مجهول';
      await data.message.channel.send(`🔍 **${userName}** استخدم الكشف!\n\n${revealReport}`);
      
      return true;

    } catch (error) {
      console.error('Error in useReveal manual:', error);
      return false;
    }
  }

  return false;
}


async function useDisable(userId, guildId, dbq, type, data) {
  if (type === 'manual_disable_check') {
    if (!data || data.players.length <= 2) return false;
    return 'can_disable';
  }

  if (type === 'manual_disable') {
    if (!data || data.players.length <= 2) return false;

    try {
      const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
      if (selectedItem !== 'disable') return false;

      const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
      if (!userBag['disable'] || userBag['disable'] <= 0) {
        await dbq.delete(`selected_item_${guildId}.${userId}`);
        return false;
      }

      const availablePlayers = data.players.filter(p => p.id !== userId);
      const disableButtons = availablePlayers.map(player => ({
        id: `disable_${player.id}`,
        label: `${player.username}`,
        style: 'DANGER',
        disabled: false
      }));

      const components = [];
      for (let i = 0; i < disableButtons.length; i += 4) {
        const row = disableButtons.slice(i, i + 4).map(btn => 
          new ButtonBuilder()
            .setCustomId(btn.id)
            .setLabel(btn.label)
            .setStyle(ButtonStyle.Danger)
        );
        components.push(new ActionRowBuilder().addComponents(row));
      }

      const userName = data.message.guild.members.cache.get(userId)?.displayName || 'مجهول';
      const disableMessage = await data.message.channel.send({
        content: `🚫 **${userName}** استخدم المنع! اختر لاعباً لمنعه من استخدام قدراته:`,
        components: components
      });

      const disableCollector = disableMessage.createMessageComponentCollector({
        filter: i => i.user.id === userId && i.customId.startsWith('disable_'),
        time: 15000,
        max: 1
      });

      return new Promise((resolve) => {
        disableCollector.on('collect', async (interaction) => {
          try {
            await interaction.deferUpdate();
            
            userBag['disable']--;
            if (userBag['disable'] <= 0) {
              delete userBag['disable'];
            }
            await dbq.set(`bag_${guildId}.${userId}`, userBag);
            await dbq.delete(`selected_item_${guildId}.${userId}`);
            
            const targetId = interaction.customId.replace('disable_', '');
            
            const disableUntil = Date.now() + (10 * 60 * 1000);
            await dbq.set(`disabled_until_${guildId}.${targetId}`, disableUntil);
            
            await dbq.delete(`selected_item_${guildId}.${targetId}`);
            
            const targetUser = data.message.guild.members.cache.get(targetId);
            const targetName = targetUser ? targetUser.displayName : 'مجهول';
            
            await disableMessage.edit({
              content: `🚫 **${userName}** منع **${targetName}** من استخدام قدراته للجولتين القادمتين!`,
              components: []
            });
            
            resolve(true);
          } catch (error) {
            console.error('Error in disable collector:', error);
            resolve(false);
          }
        });

        disableCollector.on('end', (collected) => {
          if (collected.size === 0) {
            disableMessage.edit({
              content: `⏰ انتهت مهلة المنع.`,
              components: []
            }).catch(() => {});
            resolve(false);
          }
        });
      });

    } catch (error) {
      console.error('Error in useDisable manual:', error);
      return false;
    }
  }

  return false;
}


/**
 * دوال مساعدة
 */
async function hasSelectedItem(userId, guildId, dbq, itemId = null) {
  try {
    const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
    if (itemId) {
      return selectedItem === itemId;
    }
    return selectedItem !== null && selectedItem !== undefined;
  } catch (error) {
    console.error('Error in hasSelectedItem:', error);
    return false;
  }
}

async function getSelectedItemInfo(userId, guildId, dbq) {
  try {
    const selectedItem = await dbq.get(`selected_item_${guildId}.${userId}`);
    if (!selectedItem) return null;

    const itemInfo = SHOP_ITEMS.find(item => item.id === selectedItem);
    const userBag = await dbq.get(`bag_${guildId}.${userId}`) || {};
    const count = userBag[selectedItem] || 0;

    return {
      id: selectedItem,
      name: ITEM_NAMES[selectedItem],
      count: count,
      info: itemInfo
    };
  } catch (error) {
    console.error('Error in getSelectedItemInfo:', error);
    return null;
  }
}

async function checkStealth(userId, guildId, dbq) {
  try {
    const stealthUntil = await dbq.get(`stealth_active_${guildId}.${userId}`) || 0;
    return Date.now() < stealthUntil;
  } catch (error) {
    console.error('Error in checkStealth:', error);
    return false;
  }
}

async function checkLinked(userId, guildId, dbq) {
  try {
    const linkedTo = await dbq.get(`linked_to_${guildId}.${userId}`);
    return linkedTo || null;
  } catch (error) {
    console.error('Error in checkLinked:', error);
    return null;
  }
}

async function applyLinkEffect(kickedUserId, guildId, dbq, data) {
  try {
    const linkedTo = await checkLinked(kickedUserId, guildId, dbq);
    if (!linkedTo) return false;

    const linkedPlayerIndex = data.players.findIndex(p => p.id === linkedTo);
    if (linkedPlayerIndex === -1) return false;

    const [linkedPlayer] = data.players.splice(linkedPlayerIndex, 1);
    data.removedPlayers.push(linkedPlayer);

    await dbq.delete(`linked_to_${guildId}.${kickedUserId}`);
    await dbq.delete(`linked_to_${guildId}.${linkedTo}`);

    const linkedUser = data.message.guild.members.cache.get(linkedTo);
    const linkedName = linkedUser ? linkedUser.displayName : linkedPlayer.username;
    
    await data.message.channel.send(`🔗 **${linkedName}** كان مربوط المصير وتم طرده أيضاً!`);

    let linkedStats = await dbq.get(`roulette_stats_${guildId}.${linkedTo}`) || { kicks: 0, kicked: 0, wins: 0, withdrawals: 0 };
    linkedStats.kicked++;
    await dbq.set(`roulette_stats_${guildId}.${linkedTo}`, linkedStats);

    return true;
  } catch (error) {
    console.error('Error in applyLinkEffect:', error);
    return false;
  }
}

async function cleanupGameData(guildId, dbq) {
  try {
    const players = await dbq.get(`current_players_${guildId}`) || [];
    for (const playerId of players) {
      const stealthUntil = await dbq.get(`stealth_active_${guildId}.${playerId}`) || 0;
      if (Date.now() >= stealthUntil) {
        await dbq.delete(`stealth_active_${guildId}.${playerId}`);
      }

      const disabledUntil = await dbq.get(`disabled_until_${guildId}.${playerId}`) || 0;
      if (Date.now() >= disabledUntil) {
        await dbq.delete(`disabled_until_${guildId}.${playerId}`);
      }
    }

    const currentPlayers = players || [];
    for (const playerId of currentPlayers) {
      const linkedTo = await dbq.get(`linked_to_${guildId}.${playerId}`);
      if (linkedTo && !currentPlayers.includes(linkedTo)) {
        await dbq.delete(`linked_to_${guildId}.${playerId}`);
      }
    }
  } catch (error) {
    console.error('Error in cleanupGameData:', error);
  }
}

async function filterStealthPlayers(players, guildId, dbq, excludeUserId = null) {
  try {
    const visiblePlayers = [];
    
    for (const player of players) {
      if (player.id === excludeUserId) continue;
      
      const isHidden = await checkStealth(player.id, guildId, dbq);
      if (!isHidden) {
        visiblePlayers.push(player);
      }
    }
    
    return visiblePlayers;
  } catch (error) {
    console.error('Error in filterStealthPlayers:', error);
    return players.filter(p => p.id !== excludeUserId);
  }
}

async function addAbilityButtons(userId, guildId, dbq, data, existingButtons = []) {
  try {
    const abilityButtons = [];
    
    const canSnipe = await useSelectedItem(userId, guildId, dbq, 'manual_snipe_check', data);
    const canHack = await useSelectedItem(userId, guildId, dbq, 'manual_hack_check', data);
    const canStealth = await useSelectedItem(userId, guildId, dbq, 'manual_stealth_check', data);
    const canLink = await useSelectedItem(userId, guildId, dbq, 'manual_link_check', data);
    const canReveal = await useSelectedItem(userId, guildId, dbq, 'manual_reveal_check', data);
    const canDisable = await useSelectedItem(userId, guildId, dbq, 'manual_disable_check', data);
    const canBomb = await useSelectedItem(userId, guildId, dbq, 'manual_bomb_check', data);
    const canRevive = await useSelectedItem(userId, guildId, dbq, 'manual_revive_check', data);

    if (canSnipe === 'can_snipe') {
      abilityButtons.push({
        id: "ability_snipe",
        label: "قنص",
        setEmoji: "<:target:1399549613710508187>",
        style: ButtonStyle.Secondary,
        disabled: false
      });
    }

    if (canHack === 'can_hack') {
      abilityButtons.push({
        id: "ability_hack",
        label: "تهكير",
        setEmoji: "<:padlock:1399549619431673938>",
        style: ButtonStyle.Secondary,
        disabled: false
      });
    }

    if (canStealth === 'can_stealth') {
      abilityButtons.push({
        id: "ability_stealth",
        label: "إخفاء",
        setEmoji: "<:hidden:1399549621839331460>",
        style: ButtonStyle.Secondary,
        disabled: false
      });
    }

    if (canLink === 'can_link') {
      abilityButtons.push({
        id: "ability_link",
        label: "ربط",
        setEmoji: "<:link:1399549611563159572>",
        style: ButtonStyle.Secondary,
        disabled: false
      });
    }

    if (canReveal === 'can_reveal') {
      abilityButtons.push({
        id: "ability_reveal",
        label: "كشف",
        setEmoji: "<:knowhow:1399549609981776043>",
        style: ButtonStyle.Secondary,
        disabled: false
      });
    }

    if (canDisable === 'can_disable') {
      abilityButtons.push({
        id: "ability_disable",
        label: "منع",
        setEmoji: "<:disabled:1399549617389178930>",
        style: ButtonStyle.Secondary,
        disabled: false
      });
    }

    if (canBomb === 'can_bomb') {
      abilityButtons.push({
        id: "ability_bomb",
        label: "قنبلة",
        setEmoji: "<:metrics:1399028793808781383>",
        style: ButtonStyle.Secondary,
        disabled: false
      });
    }

    if (canRevive === 'can_revive') {
      abilityButtons.push({
        id: "ability_revive",
        label: "إنعاش",
        setEmoji: "<:revive:1399028791233216523>",
        style: ButtonStyle.Secondary,
        disabled: false
      });
    }

    return abilityButtons;
  } catch (error) {
    console.error('Error in addAbilityButtons:', error);
    return [];
  }
}

async function handleAbilityUsage(interaction, dbq, data) {
  try {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const abilityId = interaction.customId.replace('ability_', '');

    let result = false;

    switch (abilityId) {
      case 'snipe':
        result = await useSelectedItem(userId, guildId, dbq, 'manual_snipe', data);
        break;
      case 'hack':
        result = await useSelectedItem(userId, guildId, dbq, 'manual_hack', data);
        break;
      case 'stealth':
        result = await useSelectedItem(userId, guildId, dbq, 'manual_stealth', data);
        break;
      case 'link':
        result = await useSelectedItem(userId, guildId, dbq, 'manual_link', data);
        break;
      case 'reveal':
        result = await useSelectedItem(userId, guildId, dbq, 'manual_reveal', data);
        break;
      case 'disable':
        result = await useSelectedItem(userId, guildId, dbq, 'manual_disable', data);
        break;
      case 'bomb':
        result = await useSelectedItem(userId, guildId, dbq, 'manual_bomb', data);
        break;
      case 'revive':
        result = await useSelectedItem(userId, guildId, dbq, 'manual_revive', data);
        break;
    }

    if (result) {
      await interaction.deferUpdate();
      return true;
    } else {
      await interaction.reply({ 
        content: `❌ لا يمكن استخدام هذه القدرة الآن.`, 
        ephemeral: true 
      });
      return false;
    }

  } catch (error) {
    console.error('Error in handleAbilityUsage:', error);
    await interaction.reply({ 
      content: `❌ حدث خطأ في استخدام القدرة.`, 
      ephemeral: true 
    });
    return false;
  }
}


async function handlePurchase(interaction, dbq) {
  await handleItemPurchase(interaction, dbq);
}

async function handleBagSelection(interaction, dbq) {
  await handleItemSelection(interaction, dbq);
}


module.exports = {

  showShop,
  showBag,
  showStats,
  

  useSelectedItem,
  hasSelectedItem,
  getSelectedItemInfo,
  

  getUserPointsEmoji,
  

  checkStealth,
  checkLinked,
  applyLinkEffect,
  cleanupGameData,
  filterStealthPlayers,
  addAbilityButtons,
  handleAbilityUsage,
  

  SHOP_ITEMS,
  ITEM_NAMES,
  EMOJI_SHOP,
  EMOJI_NAMES,
  

  handlePurchase,
  handleBagSelection,
  

  showItemsShop,
  showEmojiShop,
  handleItemPurchase,
  handleEmojiPurchase,
  

  showItemsBag,
  showEmojisBag,
  handleItemSelection,
  handleEmojiSelection,
  

  useBomb,
  useShield,
  useSwap,
  useRevive,
  useCounterAttack,
  useSnipe,
  useHack,
  useStealth,
  useLink,
  useReveal,
  useDisable,
  

  createShopWelcomeImage
};
