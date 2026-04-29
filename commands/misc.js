const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');


function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
}

function validateHexColor(color) {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(color);
}


async function createColorPreview(baseColor, lightColor, darkColor) {
  try {
    const canvas = createCanvas(300, 120);
    const ctx = canvas.getContext('2d');
    

    ctx.clearRect(0, 0, 300, 120);
    

    ctx.fillStyle = baseColor;
    ctx.fillRect(10, 10, 90, 100);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 90, 100);
    

    ctx.fillStyle = lightColor;
    ctx.fillRect(105, 10, 90, 100);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(105, 10, 90, 100);
    

    ctx.fillStyle = darkColor;
    ctx.fillRect(200, 10, 90, 100);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 10, 90, 100);
    

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px cairo';
    ctx.textAlign = 'center';
    

    ctx.fillText('الأساسي', 55, 90);
    
 
    ctx.fillText('الفاتح', 150, 90);
    

    ctx.fillText('الغامق', 245, 90);
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('خطأ في إنشاء صورة الألوان:', error);
    return null;
  }
}


class PointsImageGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 400;
    this.height = 550; 
  }

 
  async loadFonts() {
    try {
      const fontPath = path.join(__dirname, 'fonts', 'cairo.ttf');
      if (fs.existsSync(fontPath)) {
        registerFont(fontPath, { family: 'cairo' });
      }
    } catch (error) {
      console.warn('تعذر تحميل الخط العربي، سيتم استخدام الخط الافتراضي');
    }
  }

  
  createGradient(x1, y1, x2, y2, colors) {
    const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
  }

  
  async drawBackground(guildId, dbq) {
    let baseColor = '#1e3c72';
    let lightColor = '#2a5298';
    
    try {
     
      const customColor = await dbq.get(`custom_color_${guildId}`);
      if (customColor) {
        baseColor = customColor;
        lightColor = lightenColor(customColor, 15);
      }
    } catch (error) {
      console.warn('استخدام الألوان الافتراضية');
    }

    const bgGradient = this.createGradient(0, 0, 0, this.height, [
      baseColor, lightColor, baseColor
    ]);
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const overlayGradient = this.createGradient(0, 0, this.width, 0, [
      'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)'
    ]);
    this.ctx.fillStyle = overlayGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const radius = Math.random() * 3 + 1;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  
  async drawAvatar(avatarUrl, x, y, radius) {
    try {
      const avatar = await loadImage(avatarUrl);
      
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.clip();
      this.ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
      this.ctx.restore();
      
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      this.ctx.stroke();
      
    } catch (error) {
      this.ctx.fillStyle = '#4a5568';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '24px cairo';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('👤', x, y + 8);
    }
  }


   
  async drawCustomIcon(imagePath, x, y, size) {
    try {
      const icon = await loadImage(imagePath);
      this.ctx.drawImage(icon, x, y, size, size);
      return true;
    } catch (error) {
      console.warn(`تعذر تحميل الأيقونة من: ${imagePath}`);
      return false;
    }
  }

 
  drawUserInfo(username, rank) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px cairo';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(username, this.width / 2, 180);
    
    this.ctx.fillStyle = '#a0aec0';
    this.ctx.font = '16px cairo';
    this.ctx.fillText(`Rank #${rank}`, this.width / 2, 200);
  }

  
  async drawPointsCard(title, points, iconPath, yPosition, color, isRouletteIcon = false) {
    const cardX = 30;
    const cardY = yPosition;
    const cardWidth = this.width - 60;
    const cardHeight = 50;
    const borderRadius = 15;
    const iconSize = 24;
    

    this.drawRoundedRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
    

    const cardGradient = this.createGradient(cardX, cardY, cardX + cardWidth, cardY, [
      'rgba(255, 255, 255, 0.15)',
      'rgba(255, 255, 255, 0.05)'
    ]);
    
    this.ctx.fillStyle = cardGradient;
    this.ctx.fill();
    

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    

    const iconDrawn = await this.drawCustomIcon(
      iconPath, 
      cardX + cardWidth - 45, 
      cardY + 13, 
      iconSize
    );
    
    
    if (!iconDrawn) {
      this.ctx.fillStyle = '#ffffff'; 
      this.ctx.font = '20px cairo';
      this.ctx.textAlign = 'right';
      const fallbackEmoji = isRouletteIcon ? '💎' : '🎮';
      this.ctx.fillText(fallbackEmoji, cardX + cardWidth - 20, cardY + 32);
    }
    

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px cairo';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(title, cardX + cardWidth - 55, cardY + 32);
    

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px cairo';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(points.toString(), cardX + 20, cardY + 32);
  }

 
  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  
  async generatePointsImage(userData, guildId, dbq) {
    const {
      username,
      avatarUrl,
      roulettePoints = 0,
      generalPoints = 0,
      individualPoints = 0,
      rank = 37
    } = userData;

    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    
    await this.loadFonts();
    await this.drawBackground(guildId, dbq);
    await this.drawAvatar(avatarUrl, this.width / 2, 100, 50);
    this.drawUserInfo(username, rank);
    

    await this.drawPointsCard('نقاط الألعاب الجماعية', generalPoints, './photo/point.png', 240, '#ffffff', false);
    await this.drawPointsCard('نقاط الألعاب الفردية', individualPoints, './photo/point.png', 300, '#ffffff', false);
    await this.drawPointsCard('نقاط شراء الروليت', roulettePoints, './photo/rpoint.png', 360, '#ffffff', false);
    await this.drawPointsCard('مجموع النقاط الكلي', generalPoints + individualPoints + roulettePoints, './photo/point.png', 420, '#ffa726', true);
    
    return this.canvas.toBuffer('image/png');
  }
}

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;

 
  client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    const args = message.content.split(' ');
    const command = args[0];
    
    if (command === prefix + 'setcolor') {

      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');
      }

   
      const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

  
      if (args.length < 2) {
        const embed = new EmbedBuilder()
          .setTitle('🎨 أمر تغيير الألوان')
          .setDescription('**الاستخدام الصحيح:**')
          .addFields(
            { 
              name: `\`${prefix}setcolor #33a5de\``, 
              value: 'تغيير لون الخلفيات إلى اللون المحدد', 
              inline: false 
            },
            { 
              name: 'ملاحظة مهمة:', 
              value: 'يجب أن يكون اللون بصيغة Hex (مثل: #33a5de أو #ff0000)', 
              inline: false 
            }
          )
          .setColor('#33a5de')
          .setFooter({ text: 'مثال: #33a5de للون الأزرق' });

        return message.channel.send({ embeds: [embed] });
      }

      let color = args[1];
      
 
      if (!color.startsWith('#')) {
        color = '#' + color;
      }


      if (!validateHexColor(color)) {
        return message.channel.send('❌ اللون المدخل غير صحيح! يجب أن يكون بصيغة Hex مثل: #33a5de');
      }

      try {
      
        await dbq.set(`custom_color_${message.guild.id}`, color);
        
       
        const lightColor = lightenColor(color, 30);
        await dbq.set(`custom_light_color_${message.guild.id}`, lightColor);
        
       
        const darkColor = darkenColor(color, 20);
        await dbq.set(`custom_dark_color_${message.guild.id}`, darkColor);

       
        const colorPreviewBuffer = await createColorPreview(color, lightColor, darkColor);
        
        if (colorPreviewBuffer) {
          const attachment = new AttachmentBuilder(colorPreviewBuffer, { 
            name: 'color_preview.png' 
          });

          const embed = new EmbedBuilder()
            .setTitle('✅ تم تغيير ألوان الخلفيات بنجاح!')
            .setDescription(`**تم تطبيق اللون الجديد:** ${color}`)
            .addFields(
              { 
                name: '📝 ملاحظة', 
                value: '**في حال تبي الون يكون افتح من كذا اختار لون اغمق من الي اخترته**', 
                inline: false 
              }
            )
            .setColor(color)
            .setImage('attachment://color_preview.png')
            .setTimestamp();

          await message.channel.send({ 
            embeds: [embed], 
            files: [attachment] 
          });
        } else {

          const embed = new EmbedBuilder()
            .setTitle('✅ تم تغيير ألوان الخلفيات بنجاح!')
            .setDescription(`**اللون الجديد:** ${color}`)
            .addFields(
              { 
                name: '📝 ملاحظة', 
                value: '**في حال تبي الون يكون افتح من كذا اختار لون اغمق من الي اخترته**', 
                inline: false 
              }
            )
            .setColor(color)
            .setTimestamp();

          await message.channel.send({ embeds: [embed] });
        }

      } catch (error) {
        console.error('خطأ في حفظ الألوان:', error);
        message.channel.send('❌ حدث خطأ أثناء حفظ الألوان الجديدة.');
      }
    }


    if (command === prefix + 'resetcolor') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');
      }

      const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

      try {

        await dbq.delete(`custom_color_${message.guild.id}`);
        await dbq.delete(`custom_light_color_${message.guild.id}`);
        await dbq.delete(`custom_dark_color_${message.guild.id}`);

        const embed = new EmbedBuilder()
          .setTitle('🔄 تم إعادة تعيين الألوان')
          .setDescription('تم إعادة تعيين جميع الألوان إلى الألوان الافتراضية.')
          .setColor('#4a9ebb')
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });

      } catch (error) {
        console.error('خطأ في إعادة تعيين الألوان:', error);
        message.channel.send('❌ حدث خطأ أثناء إعادة تعيين الألوان.');
      }
    }
  });


  client.on('messageCreate', async message => {
    try {
      if (message.author.bot) return;

      const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;

   
      if (message.content.startsWith(prefix + 'تصفير')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        
        dbq.delete(`points_${message.guild.id}`);
        dbq.delete(`roulette_points_${message.guild.id}`);
        dbq.delete(`individual_points_${message.guild.id}`);
        message.channel.send("** ✅: - تم حذف جميع الأعضاء والنقاط (`العامة، الفردية، ونقاط الروليت`) بنجاح.**");
        

      } else if (message.content.startsWith(prefix + 'addpoint') || message.content.startsWith(prefix + 'addp')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        const args = message.content.split(' ').slice(1);
        if (args.length < 2) {
          const commandUsed = message.content.startsWith(prefix + 'addpoint') ? 'addpoint' : 'addp';
          return message.channel.send("❌ الاستخدام الصحيح: `" + prefix + commandUsed + " @user عدد_النقاط`");
        }

        const userId = args[0].replace(/[<@!>]/g, '');
        const pointsToAdd = parseInt(args[1], 10);

        if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
          return message.channel.send("❌ يرجى تحديد عدد النقاط بشكل صحيح (رقم موجب).");
        }

        const targetUser = await client.users.fetch(userId).catch(() => null);
        if (!targetUser) {
          return message.channel.send("❌ لم يتم العثور على المستخدم.");
        }

        const rouletteButton = new ButtonBuilder()
          .setCustomId(`add_roulette_${userId}_${pointsToAdd}`)
          .setLabel(`🕹 إعطاء نقاط روليت`)
          .setStyle(ButtonStyle.Secondary);

        const generalButton = new ButtonBuilder()
          .setCustomId(`add_general_${userId}_${pointsToAdd}`)
          .setLabel(`🎮 إعطاء نقاط عامة`)
          .setStyle(ButtonStyle.Secondary);

        const individualButton = new ButtonBuilder()
          .setCustomId(`add_individual_${userId}_${pointsToAdd}`)
          .setLabel(`🎯 إعطاء نقاط فردية`)
          .setStyle(ButtonStyle.Secondary);

        const row1 = new ActionRowBuilder().addComponents(rouletteButton, generalButton);
        const row2 = new ActionRowBuilder().addComponents(individualButton);

        const embed = new EmbedBuilder()
          .setTitle("🎯 إضافة النقاط")
          .setDescription(`**المستخدم:** ${targetUser.username}\n**عدد النقاط:** ${pointsToAdd}\n\n**اختر نوع النقاط:**`)
          .addFields(
            { name: '🕹 نقاط الروليت', value: 'لشراء الخصائص والصور من الروليت', inline: true },
            { name: '🎮 النقاط الجماعيه', value: 'من الألعاب الجماعية والمتجر', inline: true },
            { name: '🎯 النقاط الفردية', value: 'من الألعاب  الفردية', inline: true }
          )
          .setColor("#FFFFFF")
          .setThumbnail('https://i.ibb.co/Z6svHQj2/user.png');

        const pointMessage = await message.channel.send({ embeds: [embed], components: [row1, row2] });

        const collector = pointMessage.createMessageComponentCollector({
          filter: i => i.user.id === message.author.id,
          time: 30000,
          max: 1
        });

        collector.on('collect', async interaction => {
          await interaction.deferUpdate();

          if (interaction.customId.startsWith('add_roulette_')) {
            let roulettePoints = await dbq.get(`roulette_points_${message.guild.id}.${userId}`) || 0;
            roulettePoints += pointsToAdd;
            await dbq.set(`roulette_points_${message.guild.id}.${userId}`, roulettePoints);

            const successEmbed = new EmbedBuilder()
              .setTitle("🕹 تم إضافة نقاط الروليت")
              .setDescription(`تم إضافة **${pointsToAdd}** نقطة روليت لـ ${targetUser.username}\n**إجمالي نقاط الروليت:** ${roulettePoints}`)
              .setColor("#FFFFFF");

            await pointMessage.edit({ embeds: [successEmbed], components: [] });

          } else if (interaction.customId.startsWith('add_general_')) {
            let generalPoints = await dbq.get(`points_${message.guild.id}.${userId}`) || 0;
            generalPoints += pointsToAdd;
            await dbq.set(`points_${message.guild.id}.${userId}`, generalPoints);

            const successEmbed = new EmbedBuilder()
              .setTitle("🎮 تم إضافة النقاط العامة")
              .setDescription(`تم إضافة **${pointsToAdd}** نقطة عامة لـ ${targetUser.username}\n**إجمالي النقاط العامة:** ${generalPoints}`)
              .setColor("#FFFFFF");

            await pointMessage.edit({ embeds: [successEmbed], components: [] });

          } else if (interaction.customId.startsWith('add_individual_')) {
            let individualPoints = await dbq.get(`individual_points_${message.guild.id}.${userId}`) || 0;
            individualPoints += pointsToAdd;
            await dbq.set(`individual_points_${message.guild.id}.${userId}`, individualPoints);

            const successEmbed = new EmbedBuilder()
              .setTitle("🎯 تم إضافة النقاط الفردية")
              .setDescription(`تم إضافة **${pointsToAdd}** نقطة فردية لـ ${targetUser.username}\n**إجمالي النقاط الفردية:** ${individualPoints}`)
              .setColor("#FFFFFF");

            await pointMessage.edit({ embeds: [successEmbed], components: [] });
          }
        });

        collector.on('end', (collected) => {
          if (collected.size === 0) {
            pointMessage.edit({ 
              content: "⏰ انتهت مهلة الاختيار.", 
              embeds: [], 
              components: [] 
            }).catch(() => {});
          }
        });

     
      } else if (message.content.startsWith(prefix + 'removepoint') || message.content.startsWith(prefix + 'removep')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        const args = message.content.split(' ').slice(1);
        if (args.length < 2) {
          const commandUsed = message.content.startsWith(prefix + 'removepoint') ? 'removepoint' : 'removep';
          return message.channel.send("❌ الاستخدام الصحيح: `" + prefix + commandUsed + " @المستخدم عدد_النقاط`");
        }

        const userId = args[0].replace(/[<@!>]/g, '');
        const pointsToRemove = parseInt(args[1], 10);

        if (isNaN(pointsToRemove) || pointsToRemove <= 0) {
          return message.channel.send("❌ يرجى تحديد عدد النقاط بشكل صحيح (رقم موجب).");
        }

        const targetUser = await client.users.fetch(userId).catch(() => null);
        if (!targetUser) {
          return message.channel.send("❌ لم يتم العثور على المستخدم.");
        }

        const rouletteButton = new ButtonBuilder()
          .setCustomId(`remove_roulette_${userId}_${pointsToRemove}`)
          .setLabel(`🕹 إزالة نقاط روليت`)
          .setStyle(ButtonStyle.Danger);

        const generalButton = new ButtonBuilder()
          .setCustomId(`remove_general_${userId}_${pointsToRemove}`)
          .setLabel(`🎮 إزالة نقاط عامة`)
          .setStyle(ButtonStyle.Secondary);

        const individualButton = new ButtonBuilder()
          .setCustomId(`remove_individual_${userId}_${pointsToRemove}`)
          .setLabel(`🎯 إزالة نقاط فردية`)
          .setStyle(ButtonStyle.Success);

        const row1 = new ActionRowBuilder().addComponents(rouletteButton, generalButton);
        const row2 = new ActionRowBuilder().addComponents(individualButton);

        const currentRoulettePoints = await dbq.get(`roulette_points_${message.guild.id}.${userId}`) || 0;
        const currentGeneralPoints = await dbq.get(`points_${message.guild.id}.${userId}`) || 0;
        const currentIndividualPoints = await dbq.get(`individual_points_${message.guild.id}.${userId}`) || 0;

        const embed = new EmbedBuilder()
          .setTitle("⚠️ إزالة النقاط")
          .setDescription(`**المستخدم:** ${targetUser.username}\n**عدد النقاط المراد إزالتها:** ${pointsToRemove}\n\n**النقاط الحالية:**\n🕹 نقاط الروليت: ${currentRoulettePoints}\n🎮 النقاط العامة: ${currentGeneralPoints}\n🎯 النقاط الفردية: ${currentIndividualPoints}\n\n**اختر نوع النقاط:**`)
          .setColor("#FFFFFF")
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

        const pointMessage = await message.channel.send({ embeds: [embed], components: [row1, row2] });

        const collector = pointMessage.createMessageComponentCollector({
          filter: i => i.user.id === message.author.id,
          time: 30000,
          max: 1
        });

        collector.on('collect', async interaction => {
          await interaction.deferUpdate();

          if (interaction.customId.startsWith('remove_roulette_')) {
            let roulettePoints = await dbq.get(`roulette_points_${message.guild.id}.${userId}`) || 0;
            
            if (roulettePoints < pointsToRemove) {
              const errorEmbed = new EmbedBuilder()
                .setTitle("❌ خطأ في إزالة نقاط الروليت")
                .setDescription(`لا يمكن إزالة ${pointsToRemove} نقطة لأن ${targetUser.username} لديه ${roulettePoints} نقطة روليت فقط.`)
                .setColor("#ff0000");

              await pointMessage.edit({ embeds: [errorEmbed], components: [] });
              return;
            }

            roulettePoints -= pointsToRemove;
            await dbq.set(`roulette_points_${message.guild.id}.${userId}`, roulettePoints);

            const successEmbed = new EmbedBuilder()
              .setTitle("🕹 تم إزالة نقاط الروليت")
              .setDescription(`تم إزالة **${pointsToRemove}** نقطة روليت من ${targetUser.username}\n**نقاط الروليت المتبقية:** ${roulettePoints}`)
              .setColor("#FFFFFF");

            await pointMessage.edit({ embeds: [successEmbed], components: [] });

          } else if (interaction.customId.startsWith('remove_general_')) {
            let generalPoints = await dbq.get(`points_${message.guild.id}.${userId}`) || 0;
            
            if (generalPoints < pointsToRemove) {
              const errorEmbed = new EmbedBuilder()
                .setTitle("❌ خطأ في إزالة النقاط العامة")
                .setDescription(`لا يمكن إزالة ${pointsToRemove} نقطة لأن ${targetUser.username} لديه ${generalPoints} نقطة عامة فقط.`)
                .setColor("#ff0000");

              await pointMessage.edit({ embeds: [errorEmbed], components: [] });
              return;
            }

            generalPoints -= pointsToRemove;
            await dbq.set(`points_${message.guild.id}.${userId}`, generalPoints);

            const successEmbed = new EmbedBuilder()
              .setTitle("🎮 تم إزالة النقاط العامة")
              .setDescription(`تم إزالة **${pointsToRemove}** نقطة عامة من ${targetUser.username}\n**النقاط العامة المتبقية:** ${generalPoints}`)
              .setColor("#FFFFFF");

            await pointMessage.edit({ embeds: [successEmbed], components: [] });

          } else if (interaction.customId.startsWith('remove_individual_')) {
            let individualPoints = await dbq.get(`individual_points_${message.guild.id}.${userId}`) || 0;
            
            if (individualPoints < pointsToRemove) {
              const errorEmbed = new EmbedBuilder()
                .setTitle("❌ خطأ في إزالة النقاط الفردية")
                .setDescription(`لا يمكن إزالة ${pointsToRemove} نقطة لأن ${targetUser.username} لديه ${individualPoints} نقطة فردية فقط.`)
                .setColor("#ff0000");

              await pointMessage.edit({ embeds: [errorEmbed], components: [] });
              return;
            }

            individualPoints -= pointsToRemove;
            await dbq.set(`individual_points_${message.guild.id}.${userId}`, individualPoints);

            const successEmbed = new EmbedBuilder()
              .setTitle("🎯 تم إزالة النقاط الفردية")
              .setDescription(`تم إزالة **${pointsToRemove}** نقطة فردية من ${targetUser.username}\n**النقاط الفردية المتبقية:** ${individualPoints}`)
              .setColor("#4CAF50");

            await pointMessage.edit({ embeds: [successEmbed], components: [] });
          }
        });

        collector.on('end', (collected) => {
          if (collected.size === 0) {
            pointMessage.edit({ 
              content: "⏰ انتهت مهلة الاختيار.", 
              embeds: [], 
              components: [] 
            }).catch(() => {});
          }
        });

    
      } else if (message.content.startsWith(prefix + 'points') || 
                 message.content.startsWith(prefix + 'نقاطي') ||
                 message.content.startsWith(prefix + 'p')) {
        
        const args = message.content.split(' ').slice(1);
        let targetUserId = message.author.id;
        let targetUser = message.author;

        if (args.length > 0 && args[0].includes('<@')) {
          if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send("❌ ليس لديك صلاحية لعرض نقاط الآخرين.");
          }
          targetUserId = args[0].replace(/[<@!>]/g, '');
          targetUser = await client.users.fetch(targetUserId).catch(() => null);
          if (!targetUser) {
            return message.channel.send("❌ لم يتم العثور على المستخدم.");
          }
        }

        try {
          const roulettePoints = await dbq.get(`roulette_points_${message.guild.id}.${targetUserId}`) || 0;
          const generalPoints = await dbq.get(`points_${message.guild.id}.${targetUserId}`) || 0;
          const individualPoints = await dbq.get(`individual_points_${message.guild.id}.${targetUserId}`) || 0;
          const rank = Math.floor(Math.random() * 100) + 1;

          const pointsGenerator = new PointsImageGenerator();
          
          const imageBuffer = await pointsGenerator.generatePointsImage({
            username: targetUser.displayName || targetUser.username,
            avatarUrl: targetUser.displayAvatarURL({ extension: 'png', size: 256 }),
            roulettePoints: roulettePoints,
            generalPoints: generalPoints,
            individualPoints: individualPoints,
            rank: rank
          }, message.guild.id, dbq);

          const attachment = new AttachmentBuilder(imageBuffer, { 
            name: `points_${targetUser.id}.png` 
          });

          await message.channel.send({ 
            files: [attachment],
            content: `**نقاط **<@${targetUser.id}>\n\n**> Rank #${rank}.**`
            
          });

        } catch (error) {
          console.error('خطأ في إنشاء صورة النقاط:', error);
          
          const roulettePoints = await dbq.get(`roulette_points_${message.guild.id}.${targetUserId}`) || 0;
          const generalPoints = await dbq.get(`points_${message.guild.id}.${targetUserId}`) || 0;
          const individualPoints = await dbq.get(`individual_points_${message.guild.id}.${targetUserId}`) || 0;

          const embed = new EmbedBuilder()
            .setTitle(`💰 نقاط ${targetUser.username}`)
            .addFields(
              { name: '🎮 النقاط العامة', value: `${generalPoints}`, inline: true },
              { name: '🎯 النقاط الفردية', value: `${individualPoints}`, inline: true },
              { name: '🕹 نقاط الروليت', value: `${roulettePoints}`, inline: true },
              { name: '📊 إجمالي النقاط', value: `${roulettePoints + generalPoints + individualPoints}`, inline: false }
            )
            .setColor("#dfe1dc")
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'النقاط الفردية من الألعاب البسيطة | نقاط الروليت للشراء من الروليت فقط' });

          message.channel.send({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error(error);
    }
  });


  client.on("messageCreate", async message => {
    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;
    
    if (message.content == prefix + "زر") {
      const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) return;
      
      const wait = require('node:timers/promises').setTimeout;
      const embed = new EmbedBuilder()
        .setTitle("**اسرع شخص يضغط الزر : ⚡**")
        .setDescription("**معكم 10 ثواني تضغطون الزر**\n**اسرع واحد يضغط الزر يفوز**")
        .setTimestamp()
        .setColor("#363636");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("r1").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r2").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r3").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r4").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r5").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("r6").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r7").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r8").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r9").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r10").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
      );
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("r11").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r12").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r13").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r14").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r15").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
      );
      const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("r16").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r17").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r18").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r19").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("r20").setLabel("»").setDisabled(true).setStyle(ButtonStyle.Secondary),
      );

      message.channel.send({ components: [row, row2, row3, row4], embeds: [embed] }).then(async m => {
        await new Promise(resolve => setTimeout(resolve, 3500));
        const all = [...row.components, ...row2.components, ...row3.components, ...row4.components];
        const r = Math.floor(Math.random() * all.length);
        const button = all[r];
        button.setStyle(ButtonStyle.Success);
        button.setDisabled(false);
        
        const embed2 = new EmbedBuilder()
          .setTitle("**اسرع شخص يضغط الزر : ⚡**")
          .setDescription("**معكم 10 ثواني تضغطون الزر**\n**اضغط على الزر الأخضر 🟢**")
          .setTimestamp()
          .setColor("#FFFFFF");
          
        m.edit({ components: [row, row2, row3, row4], embeds: [embed2] });
        
        const time = setTimeout(() => {
          all.forEach(btn => btn.setDisabled(true));
          button.setStyle(ButtonStyle.Danger);
          const embed3 = new EmbedBuilder()
            .setTitle("**اسرع شخص يضغط الزر : ⚡**")
            .setDescription("**انتهى الوقت**\n**🔴 لا يوجد اي فائز**")
            .setTimestamp()
            .setColor("#810001");
          m.edit({ components: [row, row2, row3, row4], embeds: [embed3] });
        }, 10000);
        
        let buttonClicked = false;
        client.on("interactionCreate", async interaction => {
          if (interaction.isButton()) {
            if (interaction.customId.startsWith("r") && !buttonClicked) {
              all.forEach(btn => btn.setDisabled(true));
              button.setStyle(ButtonStyle.Success).setDisabled(true);
              
         
              let generalPoints = await dbq.get(`points_${message.guild.id}.${interaction.user.id}`) || 0;
              generalPoints += 1;
              await dbq.set(`points_${message.guild.id}.${interaction.user.id}`, generalPoints);
              
              const embed4 = new EmbedBuilder()
                .setTitle("**اسرع شخص يضغط الزر : ⚡**")
                .setDescription(`**👑 | ${interaction.user}**\n**🎮 +1 نقطة عامة**`)
                .setTimestamp()
                .setColor("#FFFFFF");
              interaction.message.edit({
                components: [row, row2, row3, row4],
                embeds: [embed4]
              });
              interaction.channel.send(`👑 - فاز ${interaction.user} في اللعبة وحصل على نقطة عامة!`);
              interaction.deferUpdate();
              clearTimeout(time);
              buttonClicked = true;
            }
          }
        });
      });
    }
  });


  client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    if (message.content.startsWith(prefix + `help`) && owners.includes(message.author.id)) {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
      
      let embed = new EmbedBuilder()
        .setTitle(` أوامر البوت:`)
        .setThumbnail('https://i.ibb.co/GvqmLNHp/emo.png')
        .setColor('#123444')
        .setDescription(`
        ${prefix}vip: اوامر الاونر
        ${prefix}تصفير : حذف جميع النقاط ⚠ 
        ${prefix}addpoint (${prefix}addp): إضافة نقاط للمستخدمين
        ${prefix}removepoint (${prefix}removep): إزالة نقاط من المستخدمين 
        ${prefix}points (${prefix}p) (${prefix}نقاطي)
        ${prefix}setcolor: تغيير ألوان الخلفيات 🎨
        ${prefix}resetcolor: إعادة تعيين الألوان الافتراضية 🔄
        ${prefix}setprefix: تغيير بادئة البوت
        ${prefix}settings: تعديل اعدادات البوت ⚠ 
        ${prefix}edit: تعديل اعدادات البوت [قائمه فيها العاب ثانيه] ⚠ 
        **اوامر الالعاب**
        **${prefix}سالفة
          ${prefix}روليت
          ${prefix}مافيا
          ${prefix}كت
          ${prefix}زر
          ${prefix}بومب
          ${prefix}تصويت
          ${prefix}ايفنت
          ${prefix}اعلام
          ${prefix}فكك
          ${prefix}ترتيب
          ${prefix}صحح
          ${prefix}جمع
          ${prefix}مفرد
          ${prefix}حيوانات
          ${prefix}شركة
          ${prefix}ضرب
          ${prefix}طرح
          ${prefix}ترجمة
          ${prefix}عواصم
          ${prefix}اعكس
          ${prefix}اسرع
          ${prefix}حرف
          ${prefix}ادمج
          ${prefix}توب
          ${prefix}توب [اسم اللعبة]
          ${prefix}هايد
          ${prefix}فخ - لغم
          ${prefix}حجره
          ${prefix}uxo - اكس
          ${prefix}المتجر
          ${prefix}تحويل
          ${prefix}ايقاف
          ${prefix}points (${prefix}p) (${prefix}نقاطي): عرض نقاطك**
        `);
        
      message.author.send({ embeds: [embed] })
        .then(() => {
          message.react("🎮");
        })
        .catch(() => {
          message.react('❌');
        });
    }
  });


        
      const button = new ButtonBuilder()
        .setLabel('Support')
        .setEmoji("<:emo:1393774513183002767>")
        .setURL('https://discord.gg/Njjm')
        .setStyle(ButtonStyle.Link);
      const row = new ActionRowBuilder().addComponents(button);
      



  client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'setprefix') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

      if (args.length < 1) return message.reply(":rolling_eyes: **الرجاء وضع بيرفكس صحيح**");

      const newPrefix = args[0];
      await dbq.set(`prefix_${client.user.id}`, newPrefix);
      message.channel.send(`✅ تم تغيير البرفكس إلى ${newPrefix}`);
    }
  });


  const activeEvents = new Map();


client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;
  let args = message.content.split(" ");
  
  if (args[0] === prefix + "ايقاف") {
    const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;

    const mgamess = await dbq.get(`managergames_${message.guild.id}`);
    if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) {
      return message.reply("❌ | ليس لديك الصلاحيات لإيقاف اللعبة.");
    }

    if (has_play.has(message.guild.id)) {

      const gameData = has_play.get(message.guild.id);
      const gameType = gameData ? gameData.type : 'غير محدد';
      
      has_play.delete(message.guild.id);

 
      try {
        const messages = await message.channel.messages.fetch({ limit: 50 });
        const gameMessage = messages.find(msg => 
          msg.author.id === client.user.id && 
          msg.components && 
          msg.components.length > 0 &&
          (msg.embeds.length > 0 || msg.attachments.size > 0)
        );

        if (gameMessage) {
          await gameMessage.edit({ 
            content: gameMessage.content,
            embeds: gameMessage.embeds,
            files: [],
            components: [] 
          }).catch(console.error);
        }
      } catch (error) {
        console.error('خطأ في إزالة أزرار اللعبة:', error);
      }

 
      let gameNameArabic = 'اللعبة';
      switch(gameType) {
        case 'hide': gameNameArabic = 'لعبة الاختباء'; break;
        case 'bomb': gameNameArabic = 'لعبة البومب'; break;
        case 'mafia': gameNameArabic = 'لعبة المافيا'; break;
        default: gameNameArabic = 'اللعبة'; break;
      }

      await message.reply(`🛑 | تم إيقاف ${gameNameArabic} بواسطة <@${message.author.id}>`);
    } else {
      message.reply('❌ | لا يوجد لعبة قيد التشغيل.');
    }
  }
});

  module.exports.activeEvents = activeEvents;


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "ايقاف_ايفنت" || args[0] === prefix + "stopevent") {
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
            await msg.edit({ 
              content: msg.content,
              embeds: msg.embeds,
              files: [],
              components: [] 
            }).catch(console.error);
          }
        } catch (error) {
          console.error('خطأ في إزالة أزرار الإيفنت:', error);
        }

        await message.reply(`🛑 | تم إيقاف الإيفنت بواسطة <@${message.author.id}>`);
      }
    }
  });


  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!owners.includes(message.author.id)) return;
    
    const args = message.content.trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === `<@${client.user.id}>leave`) {
      const guildId = args[0];
      const guild = client.guilds.cache.get(guildId);

      if (!guild) {
        return message.reply('لم يتم العثور على السيرفر المحدد!');
      }

      guild.leave();
      message.reply(`تم الخروج من السيرفر: ${guild.name}`);
    }
  });
}

module.exports = { execute };
