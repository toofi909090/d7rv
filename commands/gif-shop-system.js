const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { gifShopData, gifShopUtils } = require('./gif.js');
const fs = require('fs');

class GifShopSystem {
  constructor(dbq) {
    this.dbq = dbq;
    this.currentPage = new Map();
    this.previewCache = new Map();
    this.bagViewMode = new Map();
    this.activeInteractions = new Map();
  }


  isValidInteraction(interaction) {
    try {

      if (!interaction) {
        console.warn('Interaction is null or undefined');
        return false;
      }
      

      const now = Date.now();
      const interactionTime = interaction.createdTimestamp;
      const maxAge = 3 * 60 * 1000;
      
      if (now - interactionTime > maxAge) {
        console.warn(`Interaction expired: ${now - interactionTime}ms old`);
        return false;
      }
      

      if (interaction.replied && interaction.deferred) {
        console.warn('Interaction is both replied and deferred - invalid state');
        return false;
      }
      

      const interactionId = `${interaction.id}_${interaction.user.id}`;
      if (this.activeInteractions.has(interactionId)) {
        console.warn('Interaction already being processed');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking interaction validity:', error);
      return false;
    }
  }


  markInteractionActive(interaction) {
    const interactionId = `${interaction.id}_${interaction.user.id}`;
    this.activeInteractions.set(interactionId, Date.now());
    

    setTimeout(() => {
      this.activeInteractions.delete(interactionId);
    }, 5 * 60 * 1000);
  }


  async safeReply(interaction, options) {
    try {

      if (!this.isValidInteraction(interaction)) {
        console.error('Invalid interaction in safeReply');
        return null;
      }


      this.markInteractionActive(interaction);


      const now = Date.now();
      const interactionTime = interaction.createdTimestamp;
      const maxAge = 2 * 60 * 1000;
      
      if (now - interactionTime > maxAge) {
        console.warn('Interaction too old for reply');
        return null;
      }


      if (!interaction.replied && !interaction.deferred) {
       
        return await interaction.reply(options);
      } else if (interaction.deferred && !interaction.replied) {
       
        return await interaction.editReply(options);
      } else if (interaction.replied) {
        console.log('Editing existing reply');
        return await interaction.editReply(options);
      } else {
        console.warn('Cannot respond to interaction - unknown state');
        return null;
      }
    } catch (error) {
      
      

      try {
        if (!interaction.replied && !interaction.deferred) {
          console.log('Attempting followUp as fallback');
          return await interaction.followUp({ ...options, ephemeral: true });
        }
      } catch (followUpError) {
        console.error('FollowUp also failed:', followUpError);
      }
      
      return null;
    }
  }


  async safeUpdate(interaction, options) {
    try {
      if (!this.isValidInteraction(interaction)) {
        console.error('Invalid interaction in safeUpdate');
        return null;
      }
      
      const now = Date.now();
      const interactionTime = interaction.createdTimestamp;
      const maxAge = 2 * 60 * 1000;
      
      if (now - interactionTime > maxAge) {
        console.warn('Interaction too old for update');
        return null;
      }
      

      this.markInteractionActive(interaction);

      if (interaction.replied || interaction.deferred) {
        console.log('Using editReply for update');
        return await interaction.editReply(options);
      } else {
        console.log('Using update for fresh interaction');
        return await interaction.update(options);
      }
    } catch (error) {
      console.error('Safe update error:', error);
      return null;
    }
  }


  async safeDeferUpdate(interaction) {
    try {
      if (!this.isValidInteraction(interaction)) {
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


  async showGifShop(interaction, page = 0) {
    try {

      if (!this.isValidInteraction(interaction)) {
        console.warn('Invalid interaction in showGifShop');
        return null;
      }

      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      

      const userRoulettePoints = await this.dbq.get(`roulette_points_${guildId}.${userId}`) || 0;
      const userVipStatus = await this.dbq.get(`vip_${guildId}.${userId}`) || false;
      const userFirstTime = await this.dbq.get(`firstTimeGifShop_${userId}`) === null;
      

      this.currentPage.set(userId, page);
      

      const itemsPerPage = gifShopData.settings.itemsPerPage;
      const startIndex = page * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageGifs = gifShopData.gifs.slice(startIndex, endIndex);
      
      if (currentPageGifs.length === 0) {
        return await this.safeReply(interaction, {
          content: '❌ لا توجد صور في هذه الصفحة!',
          ephemeral: true
        });
      }


      const previewCanvas = await this.createGifPreviewCanvas(currentPageGifs, userRoulettePoints, userVipStatus, userFirstTime);
      const attachment = new AttachmentBuilder(previewCanvas.toBuffer(), { name: 'gif_shop_preview.png' });


      const components = await this.createShopButtons(currentPageGifs, page, userRoulettePoints);


      const embed = new EmbedBuilder()
        .setTitle(gifShopData.settings.shopTitle)
        .setDescription(`${gifShopData.settings.shopDescription}\n\n🕹 **نقاط الروليت:** ${userRoulettePoints}\n📄 **الصفحة:** ${page + 1}/${Math.ceil(gifShopData.gifs.length / itemsPerPage)}`)
        .setImage('attachment://gif_shop_preview.png')
        .setColor('#FFFFFF')
        .setFooter({ text: 'اختر الصوره التي تضهر عندما تطرد شخص من الروليت | يمكن الشراء بنقاط الروليت فقط' });

      const response = {
        embeds: [embed],
        files: [attachment],
        components,
        ephemeral: true
      };

      return await this.safeReply(interaction, response);

    } catch (error) {
      console.error('Error in showGifShop:', error);
      
      try {
        return await this.safeReply(interaction, {
          content: '❌ حدث خطأ في عرض متجر الصور!',
          ephemeral: true
        });
      } catch (responseError) {
        console.error('Error sending error response:', responseError);
        return null;
      }
    }
  }




  async createGifPreviewCanvas(gifs, userPoints, isVip, isNewUser) {
    const settings = gifShopData.settings;
    const canvas = createCanvas(settings.canvasWidth, settings.canvasHeight);
    const ctx = canvas.getContext('2d');


    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 28px cairo`;
    ctx.textAlign = 'center';
    ctx.fillText(settings.shopTitle, canvas.width / 2, 40);
    ctx.restore();


    const itemWidth = settings.previewSize;
    const itemHeight = settings.previewSize + 90;
    const padding = 20;
    const totalWidth = (4 * itemWidth) + (3 * padding);
    const startX = (canvas.width - totalWidth) / 2;
    const startY = 70;


    for (let i = 0; i < gifs.length && i < 4; i++) {
      const gif = gifs[i];
      const x = startX + i * (itemWidth + padding);
      const y = startY;

      await this.drawGifPreview(ctx, gif, x, y, itemWidth, userPoints, isVip, isNewUser);
    }

    return canvas;
  }

  async drawGifPreview(ctx, gif, x, y, size, userPoints, isVip, isNewUser) {
    const settings = gifShopData.settings;
    const gifInfo = gifShopUtils.formatGifInfo(gif, userPoints, isVip, isNewUser);

    try {

      const gifPath = gifShopUtils.getGifPath(gif.fileName);
      let image;
      
      if (fs.existsSync(gifPath)) {
        image = await loadImage(gifPath);
      } else {

        image = await this.createPlaceholderImage(gif.name);
      }


      const gradient = ctx.createLinearGradient(x, y, x, y + size + 80);
      gradient.addColorStop(0, '#2C3E50');
      gradient.addColorStop(0.3, '#34495E');
      gradient.addColorStop(1, '#2C3E50');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 5, y - 5, size + 10, size + 90);


      ctx.strokeStyle = gifInfo.canAfford ? '#3498DB' : '#E74C3C';
      ctx.lineWidth = 4;
      ctx.strokeRect(x - 5, y - 5, size + 10, size + 90);


      ctx.strokeStyle = gifInfo.rarityColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, size, size);


      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.drawImage(image, x + 2, y + 2, size - 4, size - 4);
      ctx.restore();


      ctx.fillStyle = gifInfo.rarityColor;
      ctx.beginPath();
      this.roundRect(ctx, x + 5, y + 5, 35, 25, 5);
      ctx.fill();


      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 18px cairo`;
      ctx.textAlign = 'center';
      ctx.fillText(`${gif.id}`, x + 22, y + 22);


      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 16px cairo`;
      ctx.textAlign = 'center';
      const nameY = y + size + 20;
      this.wrapText(ctx, gif.name, x + size / 2, nameY, size - 10, 18);


      ctx.fillStyle = gifInfo.canAfford ? '#27AE60' : '#E74C3C';
      ctx.font = `bold 18px cairo`;
      ctx.fillText(`${gifInfo.displayPrice}$`, x + size / 2, y + size + 45);


      ctx.fillStyle = '#F39C12';
      ctx.font = '24px cairo';
      ctx.fillText(`${gifInfo.rarityEmoji}${gifInfo.categoryEmoji}`, x + size / 2, y + size + 70);

    } catch (error) {
      console.error(`Error drawing gif preview for ${gif.fileName}:`, error);

      const gradient = ctx.createLinearGradient(x, y, x, y + size);
      gradient.addColorStop(0, '#E74C3C');
      gradient.addColorStop(1, '#C0392B');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, size, size);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('❌', x + size / 2, y + size / 2 - 10);
      ctx.fillText('خطأ في التحميل', x + size / 2, y + size / 2 + 10);
    }
  }

  async createPlaceholderImage(name) {
    const canvas = createCanvas(180, 180);
    const ctx = canvas.getContext('2d');
    

    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, '#34495E');
    gradient.addColorStop(0.5, '#2C3E50');
    gradient.addColorStop(1, '#34495E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 180, 180);
    

    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 176, 176);
    

    ctx.fillStyle = '#BDC3C7';
    ctx.font = 'bold 40px cairo';
    ctx.textAlign = 'center';
    ctx.fillText('🖼️', 90, 70);
    

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px cairo';
    ctx.fillText('صورة غير متاحة', 90, 100);
    
    ctx.font = '12px cairo';
    this.wrapText(ctx, name, 90, 120, 160, 14);
    
    return canvas;
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  async createShopButtons(gifs, currentPage, userPoints) {
    const components = [];
    

    const buyButtons = [];
    for (let i = 0; i < gifs.length && i < 4; i++) {
      const gif = gifs[i];
      const gifInfo = gifShopUtils.formatGifInfo(gif, userPoints);
      
      buyButtons.push(
        new ButtonBuilder()
          .setCustomId(`buy_gif_${gif.id}`)
          .setLabel(`${gif.id} - ${gifInfo.displayPrice}`)
          .setEmoji('<:buy:1399026947954184253>')
          .setStyle(gifInfo.canAfford ? ButtonStyle.Secondary : ButtonStyle.Danger)
          .setDisabled(!gifInfo.canAfford)
      );
    }
    
    if (buyButtons.length > 0) {
      components.push(new ActionRowBuilder().addComponents(buyButtons));
    }


    const navigationButtons = [];
    

    if (currentPage > 0) {
      navigationButtons.push(
        new ButtonBuilder()
          .setCustomId(`gif_shop_page_${currentPage - 1}`)
          .setLabel('السابق')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('<:arrow_extra1:1394370839964815362>')
      );
    }


    const totalPages = Math.ceil(gifShopData.gifs.length / gifShopData.settings.itemsPerPage);
    navigationButtons.push(
      new ButtonBuilder()
        .setCustomId('current_page_info')
        .setLabel(`${currentPage + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );


    if (currentPage < totalPages - 1) {
      navigationButtons.push(
        new ButtonBuilder()
          .setCustomId(`gif_shop_page_${currentPage + 1}`)
          .setLabel('التالي')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('<:arrow_extra:1394370838664446134>')
      );
    }

    if (navigationButtons.length > 0) {
      components.push(new ActionRowBuilder().addComponents(navigationButtons));
    }


    const extraButtons = [
      new ButtonBuilder()
        .setCustomId('my_gif_bag')
        .setLabel('حقيبتي')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:backpack:1399026940094185563>'),
      new ButtonBuilder()
        .setCustomId('close_gif_shop')
        .setLabel('إغلاق')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('<:cross:1399031457028247713>')
    ];

    components.push(new ActionRowBuilder().addComponents(extraButtons));

    return components;
  }


  async buyGif(interaction, gifId) {
    try {
      if (!this.isValidInteraction(interaction)) {
        return null;
      }

      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      
      const gif = gifShopUtils.getGifById(gifId);
      if (!gif) {
        return await this.safeReply(interaction, {
          content: gifShopData.messages.gifNotFound,
          ephemeral: true
        });
      }


      const userRoulettePoints = await this.dbq.get(`roulette_points_${guildId}.${userId}`) || 0;
      const userVipStatus = await this.dbq.get(`vip_${guildId}.${userId}`) || false;
      const userFirstTime = await this.dbq.get(`firstTimeGifShop_${userId}`) === null;
      
      const priceInfo = gifShopUtils.calculatePrice(gifId, userId, userVipStatus, userFirstTime);
      
      if (userRoulettePoints < priceInfo.finalPrice) {
        return await this.safeReply(interaction, {
          content: `${gifShopData.messages.insufficientFunds}\n🕹 تحتاج إلى ${priceInfo.finalPrice} نقطة روليت، لديك ${userRoulettePoints} نقطة فقط.\n\n💡 **ملاحظة:** يمكن الشراء بنقاط الروليت فقط!`,
          ephemeral: true
        });
      }


      const ownedGifs = await this.dbq.get(`owned_gifs_${guildId}.${userId}`) || [];
      if (ownedGifs.includes(gifId)) {
        return await this.safeReply(interaction, {
          content: gifShopData.messages.alreadyOwned,
          ephemeral: true
        });
      }


      await this.dbq.set(`roulette_points_${guildId}.${userId}`, userRoulettePoints - priceInfo.finalPrice);
      ownedGifs.push(gifId);
      await this.dbq.set(`owned_gifs_${guildId}.${userId}`, ownedGifs);


      const equippedGif = await this.dbq.get(`equipped_gif_${guildId}.${userId}`);
      if (!equippedGif) {
        await this.dbq.set(`equipped_gif_${guildId}.${userId}`, gifId);
      }


      if (userFirstTime) {
        await this.dbq.set(`firstTimeGifShop_${userId}`, false);
      }


      const successEmbed = new EmbedBuilder()
        .setTitle('✅ تم الشراء بنجاح!')
        .setDescription(`تم شراء **${gif.name}** بنجاح!`)
        .addFields(
          { name: '🕹 السعر المدفوع', value: `${priceInfo.finalPrice} نقطة روليت`, inline: true },
          { name: '🕹 نقاط الروليت المتبقية', value: `${userRoulettePoints - priceInfo.finalPrice} نقطة`, inline: true }
        )
        .setColor('#f7fff9')
        .setTimestamp()
        .setFooter({ text: 'تم الشراء باستخدام نقاط الروليت' });

      if (priceInfo.appliedDiscounts.length > 0) {
        successEmbed.addFields({
          name: '🎉 الخصومات المطبقة',
          value: priceInfo.appliedDiscounts.join('\n'),
          inline: false
        });
      }

      return await this.safeReply(interaction, {
        embeds: [successEmbed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in buyGif:', error);
      return await this.safeReply(interaction, {
        content: '❌ حدث خطأ أثناء الشراء!',
        ephemeral: true
      });
    }
  }

  async showMyGifBag(interaction) {
    try {
      if (!this.isValidInteraction(interaction)) {
        return null;
      }

      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      

      const ownedGifs = await this.dbq.get(`owned_gifs_${guildId}.${userId}`) || [];
      const ownedItems = await this.dbq.get(`owned_items_${guildId}.${userId}`) || [];


      const embed = new EmbedBuilder()
        .setTitle('🎒 حقيبتي')
        .setDescription('اختر ما تريد عرضه من حقيبتك:')
        .addFields(
          { name: 'الصور المتحركة', value: `${ownedGifs.length} صورة`, inline: true },
          { name: 'الخصائص والعناصر', value: `${ownedItems.length} خاصية`, inline: true }
        )
        .setColor('#f7fff9')
        .setTimestamp();


      const components = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('bag_view_gifs')
            .setLabel('الصور')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:gifs:1400205436422062140>'),
          new ButtonBuilder()
            .setCustomId('bag_view_items')
            .setLabel('الخصائص')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:blur:1377868573715726396>'),
          new ButtonBuilder()
            .setCustomId('back_to_gif_shop')
            .setLabel('العودة للمتجر')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:shoppingbag:1399026957902938323>'),
          new ButtonBuilder()
            .setCustomId('close_gif_shop')
            .setLabel('إغلاق')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('<:cross:1398678334573117531>')
        )
      ];

      return await this.safeReply(interaction, {
        embeds: [embed],
        components,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in showMyGifBag:', error);
      return await this.safeReply(interaction, {
        content: '❌ حدث خطأ في عرض الحقيبة!',
        ephemeral: true
      });
    }
  }

  async showGifsInBag(interaction) {
    try {
      if (!this.isValidInteraction(interaction)) {
        return null;
      }

      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      
      const ownedGifs = await this.dbq.get(`owned_gifs_${guildId}.${userId}`) || [];
      const equippedGif = await this.dbq.get(`equipped_gif_${guildId}.${userId}`);
      
      if (ownedGifs.length === 0) {
        return await this.safeReply(interaction, {
          content: '❌ لا تملك أي صور متحركة حالياً!\n🕹 يمكنك شراء صور من المتجر باستخدام نقاط الروليت.',
          ephemeral: true
        });
      }


      const embed = new EmbedBuilder()
        .setTitle('🎨 الصور')
        .setDescription('الصور المتحركة التي تملكها:')
        .setColor('#f7fff9')
        .setTimestamp();


      let description = '';
      for (const gifId of ownedGifs) {
        const gif = gifShopUtils.getGifById(gifId);
        if (gif) {
          const isEquipped = equippedGif === gifId;
          const status = isEquipped ? '✅ مُجهزة' : ' غير مُجهزة';
          description += `**${gif.id}.** ${gif.name} ${gif.rarityEmoji || ''} - ${status}\n`;
        }
      }

      embed.setDescription(`الصور المتحركة التي تملكها:\n\n${description}`);


      const components = [];
      const equipButtons = [];
      
      for (let i = 0; i < ownedGifs.length && i < 5; i++) {
        const gifId = ownedGifs[i];
        const gif = gifShopUtils.getGifById(gifId);
        if (gif) {
          equipButtons.push(
            new ButtonBuilder()
              .setCustomId(`equip_gif_${gifId}`)
              .setLabel(`${gif.id}`)
              .setStyle(equippedGif === gifId ? ButtonStyle.Success : ButtonStyle.Secondary)
              .setDisabled(equippedGif === gifId)
          );
        }
      }

      if (equipButtons.length > 0) {
        components.push(new ActionRowBuilder().addComponents(equipButtons));
      }


      if (ownedGifs.length > 5) {
        const equipButtons2 = [];
        for (let i = 5; i < ownedGifs.length && i < 10; i++) {
          const gifId = ownedGifs[i];
          const gif = gifShopUtils.getGifById(gifId);
          if (gif) {
            equipButtons2.push(
              new ButtonBuilder()
                .setCustomId(`equip_gif_${gifId}`)
                .setLabel(`${gif.id}`)
                .setStyle(equippedGif === gifId ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(equippedGif === gifId)
            );
          }
        }
        if (equipButtons2.length > 0) {
          components.push(new ActionRowBuilder().addComponents(equipButtons2));
        }
      }


      components.push(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('my_gif_bag')
            .setLabel('العودة للحقيبة')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:backpack:1399026940094185563>'),
          new ButtonBuilder()
            .setCustomId('back_to_gif_shop')
            .setLabel('العودة للمتجر')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:shoppingbag:1399026957902938323>'),
          new ButtonBuilder()
            .setCustomId('close_gif_shop')
            .setLabel('إغلاق')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        )
      );

      return await this.safeReply(interaction, {
        embeds: [embed],
        components,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in showGifsInBag:', error);
      return await this.safeReply(interaction, {
        content: '❌ حدث خطأ في عرض الصور!',
        ephemeral: true
      });
    }
  }

  async showItemsInBag(interaction) {
    try {
      if (!this.isValidInteraction(interaction)) {
        return null;
      }

      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      

      const ownedItems = await this.dbq.get(`owned_items_${guildId}.${userId}`) || [];
      

      const availableItems = [
        { id: 'shield', name: '🛡️ الحماية', description: 'يحميك من الطرد مرة واحدة' },
        { id: 'counter_attack', name: '⚔️ الهجمة المرتدة', description: 'يعيد الطرد لمن حاول طردك' },
        { id: 'swap', name: '🔄 التبديل', description: 'يبدل مكانك مع شخص آخر' },
        { id: 'revive', name: '🩹 الإنعاش', description: 'يعيد لاعب مطرود للعبة' },
        { id: 'bomb', name: '💣 القنبلة', description: 'يطرد 3 لاعبين عشوائياً' },
      ];

      if (ownedItems.length === 0) {
        return await this.safeReply(interaction, {
          content: '❌ لا تملك أي خصائص أو عناصر حالياً!\n🕹 يمكنك الحصول عليها من متجر العناصر باستخدام نقاط الروليت أو كمكافآت.',
          ephemeral: true
        });
      }


      const embed = new EmbedBuilder()
        .setTitle('⚡ خصائصي وعناصري')
        .setDescription('الخصائص والعناصر التي تملكها:')
        .setColor('#dfe1dc')
        .setTimestamp();


      let description = '';
      for (const itemId of ownedItems) {
        const item = availableItems.find(i => i.id === itemId);
        if (item) {
          const count = await this.dbq.get(`item_count_${guildId}.${userId}.${itemId}`) || 1;
          description += `${item.name} x${count}\n${item.description}\n\n`;
        }
      }

      embed.setDescription(`الخصائص والعناصر التي تملكها:\n\n${description}`);


      const components = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('my_gif_bag')
            .setLabel('العودة للحقيبة')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:backpack:1399026940094185563>'),
          new ButtonBuilder()
            .setCustomId('back_to_gif_shop')
            .setLabel('العودة للمتجر')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:shoppingbag:1352911774105735199>'),
          new ButtonBuilder()
            .setCustomId('close_gif_shop')
            .setLabel('إغلاق')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('<:cross:1399031457028247713>')
        )
      ];

      return await this.safeReply(interaction, {
        embeds: [embed],
        components,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in showItemsInBag:', error);
      return await this.safeReply(interaction, {
        content: '❌ حدث خطأ في عرض الخصائص!',
        ephemeral: true
      });
    }
  }

  async equipGif(interaction, gifId) {
    try {
      if (!this.isValidInteraction(interaction)) {
        return null;
      }

      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      
      const ownedGifs = await this.dbq.get(`owned_gifs_${guildId}.${userId}`) || [];
      
      if (!ownedGifs.includes(gifId)) {
        return await this.safeReply(interaction, {
          content: '❌ لا تملك هذه الصورة!',
          ephemeral: true
        });
      }

      await this.dbq.set(`equipped_gif_${guildId}.${userId}`, gifId);
      
      const gif = gifShopUtils.getGifById(gifId);
      return await this.safeReply(interaction, {
        content: `✅ تم تجهيز صورة **${gif.name}** بنجاح! ستظهر عند طرد اللاعبين.`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in equipGif:', error);
      return await this.safeReply(interaction, {
        content: '❌ حدث خطأ في تجهيز الصورة!',
        ephemeral: true
      });
    }
  }

  async getEquippedGif(userId, guildId) {
    try {
      const equippedGifId = await this.dbq.get(`equipped_gif_${guildId}.${userId}`);
      if (!equippedGifId) return null;

      const gif = gifShopUtils.getGifById(equippedGifId);
      if (!gif) return null;

      const gifPath = gifShopUtils.getGifPath(gif.fileName);
      if (fs.existsSync(gifPath)) {
        return {
          path: gifPath,
          name: gif.fileName,
          gifData: gif
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting equipped gif:', error);
      return null;
    }
  }


  async handleButtonInteraction(interaction) {
    const customId = interaction.customId;

    try {

      if (!this.isValidInteraction(interaction)) {
        console.warn('Invalid interaction, skipping handleButtonInteraction');
        return;
      }


      await new Promise(resolve => setTimeout(resolve, 100));

      if (customId.startsWith('buy_gif_')) {
        const gifId = parseInt(customId.replace('buy_gif_', ''));
        await this.buyGif(interaction, gifId);
      } 
      else if (customId.startsWith('gif_shop_page_')) {
        const page = parseInt(customId.replace('gif_shop_page_', ''));
        await this.showGifShop(interaction, page);
      }
      else if (customId === 'my_gif_bag') {
        await this.showMyGifBag(interaction);
      }
      else if (customId === 'bag_view_gifs') {
        this.bagViewMode.set(interaction.user.id, 'gifs');
        await this.showGifsInBag(interaction);
      }
      else if (customId === 'bag_view_items') {
        this.bagViewMode.set(interaction.user.id, 'items');
        await this.showItemsInBag(interaction);
      }
      else if (customId === 'back_to_gif_shop') {
        const currentPage = this.currentPage.get(interaction.user.id) || 0;
        await this.showGifShop(interaction, currentPage);
      }
      else if (customId.startsWith('equip_gif_')) {
        const gifId = parseInt(customId.replace('equip_gif_', ''));
        await this.equipGif(interaction, gifId);
        

        setTimeout(async () => {
          try {
            if (this.isValidInteraction(interaction)) {
              await this.showGifsInBag(interaction);
            }
          } catch (error) {
            console.error('Error refreshing gifs page after equip:', error);
          }
        }, 1500);
      }
      else if (customId === 'current_page_info') {

        if (this.isValidInteraction(interaction)) {
          try {
            await this.safeDeferUpdate(interaction);
          } catch (error) {
            console.error('Error deferring page info update:', error);
          }
        }
      }
      else if (customId === 'close_gif_shop') {

        this.currentPage.delete(interaction.user.id);
        this.bagViewMode.delete(interaction.user.id);
        
        try {
          if (this.isValidInteraction(interaction)) {
            await this.safeUpdate(interaction, {
              content: '✅ تم إغلاق المتجر.',
              embeds: [],
              components: [],
              files: []
            });
          }
        } catch (error) {
          console.error('Error closing shop:', error);

          try {
            await interaction.followUp({
              content: '✅ تم إغلاق المتجر.',
              ephemeral: true
            });
          } catch (followError) {
            console.error('Error with followUp close:', followError);
          }
        }
      }
    } catch (error) {
      console.error('Error handling button interaction:', error);
      

      if (this.isValidInteraction(interaction)) {
        try {
          await this.safeReply(interaction, {
            content: '❌ حدث خطأ في معالجة طلبك!',
            ephemeral: true
          });
        } catch (replyError) {
          console.error('Error sending error reply:', replyError);

          try {
            await interaction.followUp({
              content: '❌ حدث خطأ في معالجة طلبك!',
              ephemeral: true
            });
          } catch (followError) {
            console.error('Error with followUp error message:', followError);
          }
        }
      }
    }
  }


  static integratWithRouletteShop(client, dbq, has_play, config, utils) {
    const gifShop = new GifShopSystem(dbq);

    client.on('interactionCreate', async interaction => {
      if (!interaction.isButton()) return;


      if (!gifShop.isValidInteraction(interaction)) {
        console.warn('Invalid interaction in roulette integration');
        return;
      }


      await new Promise(resolve => setTimeout(resolve, 50));

      try {

        if (interaction.customId === 'gif_shop_roulette') {
          await gifShop.showGifShop(interaction);
        }

        else if (interaction.customId.startsWith('buy_gif_') || 
                 interaction.customId.startsWith('gif_shop_page_') ||
                 interaction.customId === 'my_gif_bag' || 
                 interaction.customId === 'bag_view_gifs' ||
                 interaction.customId === 'bag_view_items' ||
                 interaction.customId === 'back_to_gif_shop' ||
                 interaction.customId.startsWith('equip_gif_') ||
                 interaction.customId === 'current_page_info' ||
                 interaction.customId === 'close_gif_shop') {
          await gifShop.handleButtonInteraction(interaction);
        }
      } catch (error) {
        console.error('Error in integration event handler:', error);
      }
    });

    return gifShop;
  }

  static async sendKickGif(message, kickedUserId, kickerUserId, dbq) {
    try {
      const gifShop = new GifShopSystem(dbq);
      const kickerGif = await gifShop.getEquippedGif(kickerUserId, message.guild.id);
      
      if (kickerGif) {
        const attachment = new AttachmentBuilder(kickerGif.path, { name: kickerGif.name });
        

        await message.channel.send({
          content: `💥 **تأثير خاص من <@${kickerUserId}>!**`,
          files: [attachment]
        });
      }
    } catch (error) {
      console.error('Error sending kick gif:', error);
    }
  }

  async addItemToPlayer(userId, guildId, itemId, count = 1) {
    try {
      const ownedItems = await this.dbq.get(`owned_items_${guildId}.${userId}`) || [];
      

      if (!ownedItems.includes(itemId)) {
        ownedItems.push(itemId);
        await this.dbq.set(`owned_items_${guildId}.${userId}`, ownedItems);
      }
      

      const currentCount = await this.dbq.get(`item_count_${guildId}.${userId}.${itemId}`) || 0;
      await this.dbq.set(`item_count_${guildId}.${userId}.${itemId}`, currentCount + count);
      
      return true;
    } catch (error) {
      console.error('Error adding item to player:', error);
      return false;
    }
  }

  async removeItemFromPlayer(userId, guildId, itemId, count = 1) {
    try {
      const currentCount = await this.dbq.get(`item_count_${guildId}.${userId}.${itemId}`) || 0;
      
      if (currentCount <= 0) {
        return false;
      }
      
      const newCount = Math.max(0, currentCount - count);
      await this.dbq.set(`item_count_${guildId}.${userId}.${itemId}`, newCount);
      

      if (newCount === 0) {
        const ownedItems = await this.dbq.get(`owned_items_${guildId}.${userId}`) || [];
        const updatedItems = ownedItems.filter(item => item !== itemId);
        await this.dbq.set(`owned_items_${guildId}.${userId}`, updatedItems);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing item from player:', error);
      return false;
    }
  }

  async hasItem(userId, guildId, itemId) {
    try {
      const count = await this.dbq.get(`item_count_${guildId}.${userId}.${itemId}`) || 0;
      return count > 0;
    } catch (error) {
      console.error('Error checking item:', error);
      return false;
    }
  }
}

function addGifShopButtonToRoulette() {
  return new ButtonBuilder()
    .setCustomId('gif_shop_roulette')
    .setLabel('متجر الصور')
    .setEmoji('<:gifs:1400205436422062140>')
    .setStyle(ButtonStyle.Secondary);
}

function setupGifShopCommands(client, dbq, utils) {
  const { prefix, owners } = utils;

  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");


    if (args[0] === prefix + "متجر_الصور") {
      const gifShop = new GifShopSystem(dbq);
      

      const fakeInteraction = {
        user: message.author,
        guild: message.guild,
        createdTimestamp: Date.now(),
        id: `fake_${Date.now()}_${Math.random()}`,
        replied: false,
        deferred: false,
        isRepliable: () => true,
        reply: async (options) => {
          return await message.channel.send(options);
        },
        editReply: async (options) => {
          return await message.channel.send(options);
        }
      };
      
      await gifShop.showGifShop(fakeInteraction);
    }


    if (args[0] === prefix + "حقيبة_الصور") {
      const gifShop = new GifShopSystem(dbq);
      
      const fakeInteraction = {
        user: message.author,
        guild: message.guild,
        createdTimestamp: Date.now(),
        id: `fake_${Date.now()}_${Math.random()}`,
        replied: false,
        deferred: false,
        isRepliable: () => true,
        reply: async (options) => {
          return await message.channel.send(options);
        },
        editReply: async (options) => {
          return await message.channel.send(options);
        }
      };
      
      await gifShop.showMyGifBag(fakeInteraction);
    }
  });
}

module.exports = {
  GifShopSystem,
  addGifShopButtonToRoulette,
  setupGifShopCommands
};
