const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require('fs');
const path = require('path');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, ms } = utils;





  client.on('messageCreate', async message => {
    if (message.content.startsWith(prefix + 'settings')) {
      if (!owners.includes(message.author.id)) return;
      
      const embed = new EmbedBuilder()
        .setTitle('⚙️ لوحة التحكم الإدارية')
        .setThumbnail('https://cdn.discordapp.com/attachments/1301600906135212106/1321636274217549824/filter.png')
        .setColor('#ffffff')
        .setFooter({
          text: 'Njm Control Panel',
          iconURL: 'https://cdn.discordapp.com/attachments/1297338870681043004/1299408268917084201/njm.png'
        })
         .addFields(
            { name: '🔧 الإعدادات العامة', value: '**إعدادات أساسية للبوت', inline: true },
            { name: '🎯 إعدادات الروليت', value: 'التحكم في لعبة الروليت', inline: true },
            { name: '🕵️ إعدادات المافيا', value: 'التحكم في لعبة المافيا', inline: true },
            { name: '💬 إعدادات برا السالفة', value: 'التحكم في لعبة برا السالفة', inline: true },
            { name: '💣 إعدادات البومب', value: 'التحكم في لعبة البومب', inline: true },
            { name: '🛒 إعدادات الخصائص', value: 'إدارة متجر الخصائص والقدرات', inline: true },
            { name: '🔄 إعدادات التحويل', value: 'التحكم في نظام تحويل النقاط', inline: true },
          )
          .setColor("#FFFFFF")
          .setThumbnail('https://i.ibb.co/Z6svHQj2/user.png');

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('category_select')
        .setPlaceholder('اختر فئة الإعدادات')
        .addOptions([
          {
            label: '🔧 الإعدادات العامة',
            description: 'إعدادات أساسية للبوت',
            value: 'setting',
          },
          {
            label: '🎯 إعدادات الروليت',
            description: 'التحكم في لعبة الروليت',
            value: 'roulette',
          },
          {
            label: '🕵️ إعدادات المافيا',
            description: 'التحكم في لعبة المافيا',
            value: 'mafia',
          },
          {
            label: '💬 إعدادات برا السالفة',
            description: 'التحكم في لعبة برا السالفة',
            value: 'bra',
          },
          {
            label: '💣 إعدادات البومب',
            description: 'التحكم في لعبة البومب',
            value: 'bomb',
          },
          {
            label: '🛒 إعدادات الخصائص',
            description: 'إدارة متجر الخصائص والقدرات',
            value: 'powers',
          },
          {
            label: '🔄 إعدادات التحويل',
            description: 'التحكم في نظام تحويل النقاط',
            value: 'transfer',
          },
        ]);

      const row = new ActionRowBuilder().addComponents(selectMenu);
      const sentMessage = await message.channel.send({ embeds: [embed], components: [row] });

      const filter = (interaction) => interaction.customId === 'category_select' && interaction.user.id === message.author.id;
      const collector = sentMessage.createMessageComponentCollector({ filter, time: 300000 });

      collector.on('collect', async (interaction) => {
        await handleCategorySelection(interaction, dbq, ms);
      });

      collector.on('end', () => {
        sentMessage.edit({ components: [] }).catch(() => {});
      });
    }
  });





  client.on('interactionCreate', async interaction => {
    if (!interaction.isSelectMenu() && !interaction.isButton()) return;
    if (!owners.includes(interaction.user.id)) return;

    try {
      if (interaction.customId === 'roulette_select') {
        await handleRouletteSettings(interaction, dbq, ms);
      } else if (interaction.customId === 'mafia_select') {
        await handleMafiaSettings(interaction, dbq, ms);
      } else if (interaction.customId === 'bra_select') {
        await handleBraSettings(interaction, dbq, ms);
      } else if (interaction.customId === 'bomb_select') {
        await handleBombSettings(interaction, dbq, ms);
      } else if (interaction.customId === 'setting_select') {
        await handleGeneralSettings(interaction, dbq);
      } else if (interaction.customId === 'powers_select') {
        await handlePowersSettings(interaction, dbq);
      } else if (interaction.customId === 'transfer_select') {
        await handleTransferSettings(interaction, dbq, ms);
      } else if (interaction.customId.startsWith('powers_')) {
        await handlePowersActions(interaction, dbq);
      } else if (interaction.customId.startsWith('transfer_')) {
        await handleTransferActions(interaction, dbq, ms);
      }
    } catch (error) {
      console.error('خطأ في معالجة التفاعل:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ حدث خطأ أثناء معالجة طلبك.', ephemeral: true });
      }
    }
  });





  async function handleCategorySelection(interaction, dbq, ms) {
    const selectedValue = interaction.values[0];

    switch (selectedValue) {
      case 'setting':
        await showGeneralSettings(interaction);
        break;
      case 'roulette':
        await showRouletteSettings(interaction);
        break;
      case 'mafia':
        await showMafiaSettings(interaction);
        break;
      case 'bra':
        await showBraSettings(interaction);
        break;
      case 'bomb':
        await showBombSettings(interaction);
        break;
      case 'powers':
        await showPowersSettings(interaction, dbq);
        break;
      case 'transfer':
        await showTransferSettings(interaction, dbq);
        break;
    }
  }





  async function showTransferSettings(interaction, dbq) {
    const guildId = interaction.guild.id;
    

    const transferEnabled = await dbq.get(`transfer_enabled_${guildId}`) !== false;
    const generalEnabled = await dbq.get(`transfer_general_enabled_${guildId}`) !== false;
    const individualEnabled = await dbq.get(`transfer_individual_enabled_${guildId}`) !== false;
    const rouletteEnabled = await dbq.get(`transfer_roulette_enabled_${guildId}`) !== false;
    const maxTransferAmount = await dbq.get(`transfer_max_amount_${guildId}`) || 40;
    const cooldownTime = await dbq.get(`transfer_cooldown_${guildId}`) || 30000;


    const cooldownMinutes = Math.floor(cooldownTime / 60000);
    const cooldownSeconds = Math.floor((cooldownTime % 60000) / 1000);

    const embed = new EmbedBuilder()
      .setTitle('🔄 إعدادات نظام التحويل المتقدم')
      .setColor(transferEnabled ? '#10B981' : '#EF4444')
      .setDescription(`
**📊 الحالة الحالية للنظام:**
${transferEnabled ? "✅ **نظام التحويل مفعل**" : "❌ **نظام التحويل معطل**"}

**🎯 إعدادات أنواع النقاط:**
🎮 النقاط العامة: ${generalEnabled ? "✅ مفعل" : "❌ معطل"}
🎯 النقاط الفردية: ${individualEnabled ? "✅ مفعل" : "❌ معطل"}
🕹 نقاط الروليت: ${rouletteEnabled ? "✅ مفعل" : "❌ معطل"}

**⚙️ إعدادات النظام:**
💰 الحد الأقصى للتحويل: \`${maxTransferAmount}\` نقطة
⏰ وقت الكولداون: \`${cooldownMinutes}دقيقة ${cooldownSeconds}ثانية\`

**📈 كيفية عمل النظام:**
${transferEnabled ? 
  '• ✅ يمكن للأعضاء استخدام أمر التحويل\n• ✅ تظهر أزرار اختيار نوع النقاط\n• ✅ يتم تطبيق الحد الأقصى والكولداون\n• ✅ إرسال إشعارات للمستقبلين' :
  '• ❌ لا يمكن استخدام أمر التحويل\n• ❌ جميع محاولات التحويل مرفوضة\n• ❌ لا تعمل أي ميزات التحويل'
}

**🔒 القيود الأمنية:**
• منع التحويل للنفس أو البوتات
• التحقق من كفاية النقاط
• نظام كولداون لمنع الإرسال المتكرر
• حد أقصى قابل للتخصيص
      `)
      .setFooter({
        text: 'إدارة شاملة لنظام التحويل',
        iconURL: 'https://cdn.discordapp.com/attachments/1297338870681043004/1299408268917084201/njm.png'
      });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('transfer_select')
      .setPlaceholder('اختر إعداد التحويل')
      .addOptions([
        {
          label: `${transferEnabled ? '❌ إيقاف' : '✅ تفعيل'} نظام التحويل`,
          description: `${transferEnabled ? 'إيقاف النظام كاملاً' : 'تشغيل النظام للجميع'}`,
          value: 'toggle_system',
          emoji: transferEnabled ? '❌' : '✅'
        },
        {
          label: `${generalEnabled ? '❌ إيقاف' : '✅ تفعيل'} تحويل النقاط العامة`,
          description: `${generalEnabled ? 'منع تحويل النقاط العامة' : 'السماح بتحويل النقاط العامة'}`,
          value: 'toggle_general',
          emoji: '🎮'
        },
        {
          label: `${individualEnabled ? '❌ إيقاف' : '✅ تفعيل'} تحويل النقاط الفردية`,
          description: `${individualEnabled ? 'منع تحويل النقاط الفردية' : 'السماح بتحويل النقاط الفردية'}`,
          value: 'toggle_individual',
          emoji: '🎯'
        },
        {
          label: `${rouletteEnabled ? '❌ إيقاف' : '✅ تفعيل'} تحويل نقاط الروليت`,
          description: `${rouletteEnabled ? 'منع تحويل نقاط الروليت' : 'السماح بتحويل نقاط الروليت'}`,
          value: 'toggle_roulette',
          emoji: '🕹'
        },
        {
          label: '💰 تحديد الحد الأقصى للتحويل',
          description: `الحد الحالي: ${maxTransferAmount} نقطة`,
          value: 'set_max_amount',
          emoji: '💰'
        },
        {
          label: '⏰ تحديد وقت الكولداون',
          description: `الوقت الحالي: ${cooldownMinutes}دقيقة ${cooldownSeconds}ثانية`,
          value: 'set_cooldown',
          emoji: '⏰'
        },
        {
          label: '📊 إحصائيات التحويل',
          description: 'عرض إحصائيات مفصلة للتحويلات',
          value: 'transfer_stats',
          emoji: '📊'
        },
        {
          label: '🔙 العودة للقائمة الرئيسية',
          description: 'الرجوع لاختيار فئة أخرى',
          value: 'back_main',
          emoji: '🔙'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.update({ embeds: [embed], components: [row] });
  }





  async function handleTransferSettings(interaction, dbq, ms) {
    const guildId = interaction.guild.id;
    const selectedValue = interaction.values[0];

    switch (selectedValue) {
      case 'toggle_system':
        await toggleTransferSystem(interaction, dbq, guildId);
        break;
      case 'toggle_general':
        await toggleTransferType(interaction, dbq, guildId, 'general', 'النقاط العامة', '🎮');
        break;
      case 'toggle_individual':
        await toggleTransferType(interaction, dbq, guildId, 'individual', 'النقاط الفردية', '🎯');
        break;
      case 'toggle_roulette':
        await toggleTransferType(interaction, dbq, guildId, 'roulette', 'نقاط الروليت', '🕹');
        break;
      case 'set_max_amount':
        await setMaxTransferAmount(interaction, dbq, guildId);
        break;
      case 'set_cooldown':
        await setCooldownTime(interaction, dbq, guildId, ms);
        break;
      case 'transfer_stats':
        await showTransferStats(interaction, dbq, guildId);
        break;
      case 'back_main':
        await showMainMenu(interaction);
        break;
    }
  }





  async function toggleTransferSystem(interaction, dbq, guildId) {
    const currentState = await dbq.get(`transfer_enabled_${guildId}`) !== false;
    const newState = !currentState;
    
    await dbq.set(`transfer_enabled_${guildId}`, newState);

    const embed = new EmbedBuilder()
      .setColor(newState ? '#10B981' : '#EF4444')
      .setTitle(`${newState ? '✅ تم تفعيل' : '❌ تم إيقاف'} نظام التحويل`)
      .setDescription(`
**التغييرات المطبقة:**

${newState ? `
✅ **تم تفعيل النظام بنجاح**
• يمكن للأعضاء استخدام أمر التحويل
• ستعمل جميع أنواع النقاط المفعلة
• سيتم تطبيق الحد الأقصى والكولداون
• ستُرسل إشعارات للمستقبلين
• تعمل جميع الميزات الأمنية
` : `
❌ **تم إيقاف النظام**
• لن يعمل أمر التحويل
• ستُرفض جميع محاولات التحويل
• لا تعمل أي ميزات التحويل
• الإعدادات محفوظة (يمكن إعادة التفعيل)
`}

**📊 حالة النظام الجديدة:** ${newState ? '🟢 مفعل' : '🔴 معطل'}
      `)
      .setFooter({ text: 'تم تطبيق الإعدادات على جميع القنوات' });

    await interaction.reply({ embeds: [embed], ephemeral: true });

    setTimeout(async () => {
      await showTransferSettings(interaction, dbq);
    }, 3000);
  }





  async function toggleTransferType(interaction, dbq, guildId, type, typeName, emoji) {
    const currentState = await dbq.get(`transfer_${type}_enabled_${guildId}`) !== false;
    const newState = !currentState;
    
    await dbq.set(`transfer_${type}_enabled_${guildId}`, newState);

    const embed = new EmbedBuilder()
      .setColor(newState ? '#10B981' : '#EF4444')
      .setTitle(`${emoji} ${newState ? 'تم تفعيل' : 'تم إيقاف'} تحويل ${typeName}`)
      .setDescription(`
**📊 التحديث:**
${newState ? `✅ تم تفعيل تحويل ${typeName}` : `❌ تم إيقاف تحويل ${typeName}`}

**🎯 النتيجة:**
${newState ? 
  `• سيظهر زر "${typeName}" في واجهة التحويل\n• يمكن للأعضاء تحويل هذا النوع من النقاط\n• ستطبق جميع القيود والحدود` :
  `• لن يظهر زر "${typeName}" في واجهة التحويل\n• لا يمكن تحويل هذا النوع من النقاط\n• سيتم رفض أي محاولة تحويل`
}
      `)
      .setFooter({ text: 'الإعدادات نافذة فوراً' });

    await interaction.reply({ embeds: [embed], ephemeral: true });

    setTimeout(async () => {
      await showTransferSettings(interaction, dbq);
    }, 2500);
  }





  async function setMaxTransferAmount(interaction, dbq, guildId) {
    const currentAmount = await dbq.get(`transfer_max_amount_${guildId}`) || 40;
    
    await interaction.reply({ 
      content: `💰 من فضلك، اكتب الحد الأقصى الجديد للتحويل (الحالي: ${currentAmount}):`, 
      ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

    if (collected.size > 0) {
      const newAmount = parseInt(collected.first().content);
      await collected.first().delete();
      
      if (!isNaN(newAmount) && newAmount > 0 && newAmount <= 1000) {
        await dbq.set(`transfer_max_amount_${guildId}`, newAmount);
        
        const embed = new EmbedBuilder()
          .setColor('#10B981')
          .setTitle('✅ تم تحديد الحد الأقصى للتحويل')
          .setDescription(`
**📊 التحديث:**
💰 الحد الأقصى الجديد: \`${newAmount}\` نقطة
📈 الحد السابق: \`${currentAmount}\` نقطة

**🎯 التأثير:**
• سيتم تطبيق الحد الجديد على جميع التحويلات
• لن يتمكن الأعضاء من تحويل أكثر من ${newAmount} نقطة
• يسري التحديث فوراً على جميع الأوامر
          `)
          .setFooter({ text: 'تم حفظ الإعدادات بنجاح' });
        
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.followUp({ 
          content: '❌ يرجى إدخال رقم صحيح بين 1-1000.', 
          ephemeral: true 
        });
      }
    } else {
      await interaction.followUp({ 
        content: '⏰ انتهى الوقت المحدد للإدخال.', 
        ephemeral: true 
      });
    }
  }





  async function setCooldownTime(interaction, dbq, guildId, ms) {
    const currentCooldown = await dbq.get(`transfer_cooldown_${guildId}`) || 30000;
    const currentMinutes = Math.floor(currentCooldown / 60000);
    const currentSeconds = Math.floor((currentCooldown % 60000) / 1000);
    
    await interaction.reply({ 
      content: `⏰ من فضلك، اكتب وقت الكولداون الجديد (الحالي: ${currentMinutes}دقيقة ${currentSeconds}ثانية)\nمثال: 1m أو 30s أو 2m30s:`, 
      ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

    if (collected.size > 0) {
      const timeString = collected.first().content.trim();
      await collected.first().delete();
      
      const durationInMillis = ms(timeString);

      if (!durationInMillis || durationInMillis < 10000 || durationInMillis > 3600000) {
        await interaction.followUp({ 
          content: '❌ يرجى تحديد وقت صحيح بين 10 ثوانٍ و60 دقيقة، مثال: `30s` أو `2m` أو `1m30s`.', 
          ephemeral: true 
        });
      } else {
        await dbq.set(`transfer_cooldown_${guildId}`, durationInMillis);
        
        const newMinutes = Math.floor(durationInMillis / 60000);
        const newSeconds = Math.floor((durationInMillis % 60000) / 1000);
        
        const embed = new EmbedBuilder()
          .setColor('#10B981')
          .setTitle('✅ تم تحديد وقت الكولداون')
          .setDescription(`
**📊 التحديث:**
⏰ الوقت الجديد: \`${newMinutes}دقيقة ${newSeconds}ثانية\`
🕐 الوقت السابق: \`${currentMinutes}دقيقة ${currentSeconds}ثانية\`

**🎯 التأثير:**
• سيتم تطبيق الوقت الجديد على جميع التحويلات
• يجب على الأعضاء انتظار هذا الوقت بين التحويلات
• يمنع الإرسال المتكرر ويحافظ على استقرار النظام
          `)
          .setFooter({ text: 'يسري التحديث فوراً' });
        
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } 
    } else {
      await interaction.followUp({ 
        content: '⏰ انتهى الوقت المحدد للإدخال.', 
        ephemeral: true 
      });
    }
  }





  async function showTransferStats(interaction, dbq, guildId) {

    const transferEnabled = await dbq.get(`transfer_enabled_${guildId}`) !== false;
    const generalEnabled = await dbq.get(`transfer_general_enabled_${guildId}`) !== false;
    const individualEnabled = await dbq.get(`transfer_individual_enabled_${guildId}`) !== false;
    const rouletteEnabled = await dbq.get(`transfer_roulette_enabled_${guildId}`) !== false;
    const maxAmount = await dbq.get(`transfer_max_amount_${guildId}`) || 40;
    const cooldown = await dbq.get(`transfer_cooldown_${guildId}`) || 30000;

    const enabledTypes = [
      generalEnabled && '🎮 النقاط العامة',
      individualEnabled && '🎯 النقاط الفردية', 
      rouletteEnabled && '🕹 نقاط الروليت'
    ].filter(Boolean);

    const embed = new EmbedBuilder()
      .setColor('#3B82F6')
      .setTitle('📊 إحصائيات نظام التحويل')
      .setDescription(`
**📈 حالة النظام:**
🔄 النظام: ${transferEnabled ? '🟢 مفعل' : '🔴 معطل'}
📊 أنواع النقاط المفعلة: \`${enabledTypes.length}/3\`

**🎯 الأنواع المفعلة:**
${enabledTypes.length > 0 ? enabledTypes.join('\n') : '❌ لا توجد أنواع مفعلة'}

**⚙️ إعدادات النظام:**
💰 الحد الأقصى: \`${maxAmount}\` نقطة
⏰ الكولداون: \`${Math.floor(cooldown/60000)}دقيقة ${Math.floor((cooldown%60000)/1000)}ثانية\`

**📋 ملخص الإعدادات:**
• ${transferEnabled ? '✅' : '❌'} النظام العام
• ${generalEnabled ? '✅' : '❌'} النقاط العامة  
• ${individualEnabled ? '✅' : '❌'} النقاط الفردية
• ${rouletteEnabled ? '✅' : '❌'} نقاط الروليت

**🔒 الحماية:**
✅ منع التحويل للنفس
✅ منع التحويل للبوتات  
✅ التحقق من كفاية النقاط
✅ نظام كولداون متقدم
✅ حد أقصى قابل للتخصيص
      `)
      .setFooter({ 
        text: `تم إنشاء التقرير في ${new Date().toLocaleString('ar-SA')}`,
        iconURL: interaction.guild.iconURL() 
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }





  async function handleTransferActions(interaction, dbq, ms) {
    const action = interaction.customId.replace('transfer_', '');

    switch (action) {
      case 'confirm_reset':
        await executeTransferReset(interaction, dbq);
        break;
      case 'cancel_reset':
        await interaction.update({ 
          content: '❌ تم إلغاء عملية إعادة التعيين.', 
          embeds: [], 
          components: [] 
        });
        break;
    }
  }





  async function showBombSettings(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('💣 إعدادات لعبة البومب')
      .setColor('#ff0000')
      .setThumbnail('https://cdn.discordapp.com/attachments/1301600906135212106/1321643696604581930/filter.png')
      .setFooter({
        text: 'Njm',
        iconURL: 'https://cdn.discordapp.com/attachments/1297338870681043004/1299408268917084201/njm.png'
      });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('bomb_select')
      .setPlaceholder('اختر إعداد البومب')
      .addOptions([
        { 
          label: 'تحديد صورة البدء للبومب', 
          description: 'تغيير صورة bomb.png',
          value: 'setbombimage' 
        },
        { 
          label: 'تحديد صورة الراوند للبومب', 
          description: 'تغيير صورة roundbomb.png',
          value: 'setroundbombimage' 
        },
        { 
          label: 'تحديد وقت بدء البومب', 
          description: 'تغيير مدة الانتظار قبل البدء',
          value: 'timerbomb' 
        },
        { 
          label: 'تحديد عدد لاعبين البومب', 
          description: 'الحد الأقصى والأدنى للاعبين',
          value: 'playersbomb' 
        },
        { 
          label: '🔙 العودة للقائمة الرئيسية', 
          value: 'back' 
        },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.update({ embeds: [embed], components: [row] });
  }





  async function handleBombSettings(interaction, dbq, ms) {
    const guildId = interaction.guild.id;
    const selectedValue = interaction.values[0];

    switch (selectedValue) {
      case 'setbombimage':
        await handleImageUpload(interaction, dbq, 'bombimage', 'صورة بداية البومب');
        break;

      case 'setroundbombimage':
        await handleImageUpload(interaction, dbq, 'roundbombimage', 'صورة راوند البومب');
        break;

      case 'timerbomb':
        await handleTimeInput(interaction, dbq, 'timerbomb', 'وقت انتظار البومب');
        break;

      case 'playersbomb':
        await handleBombPlayersInput(interaction, dbq);
        break;

      case 'back':
        await showMainMenu(interaction);
        break;
    }
  }





  async function handleBombPlayersInput(interaction, dbq) {
    await interaction.reply({ 
      content: `🔢 من فضلك، اكتب الحد الأدنى لعدد اللاعبين (الحالي: 3):`, 
      ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    const collectedMin = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

    if (collectedMin.size > 0) {
      const minPlayers = parseInt(collectedMin.first().content);
      await collectedMin.first().delete();
      
      if (!isNaN(minPlayers) && minPlayers > 0 && minPlayers <= 30) {
        await interaction.followUp({ 
          content: `🔢 من فضلك، اكتب الحد الأقصى لعدد اللاعبين (الحالي: 15):`, 
          ephemeral: true 
        });
        
        const collectedMax = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });
        
        if (collectedMax.size > 0) {
          const maxPlayers = parseInt(collectedMax.first().content);
          await collectedMax.first().delete();
          
          if (!isNaN(maxPlayers) && maxPlayers >= minPlayers && maxPlayers <= 50) {
            await dbq.set(`bombMinPlayers_${interaction.guild.id}`, minPlayers);
            await dbq.set(`bombMaxPlayers_${interaction.guild.id}`, maxPlayers);
            
            await interaction.followUp({ 
              content: `✅ تم تحديد عدد لاعبين البومب:\n🔹 الحد الأدنى: **${minPlayers}** لاعب\n🔹 الحد الأقصى: **${maxPlayers}** لاعب`, 
              ephemeral: true 
            });
          } else {
            await interaction.followUp({ 
              content: '❌ يرجى إدخال حد أقصى صحيح (يجب أن يكون أكبر من أو يساوي الحد الأدنى وأقل من 51).', 
              ephemeral: true 
            });
          }
        } else {
          await interaction.followUp({ 
            content: '⏰ انتهى الوقت المحدد لإدخال الحد الأقصى.', 
            ephemeral: true 
          });
        }
      } else {
        await interaction.followUp({ 
          content: '❌ يرجى إدخال حد أدنى صحيح بين 1-30.', 
          ephemeral: true 
        });
      }
    } else {
      await interaction.followUp({ 
        content: '⏰ انتهى الوقت المحدد للإدخال.', 
        ephemeral: true 
      });
    }
  }





  async function showPowersSettings(interaction, dbq) {
    const guildId = interaction.guild.id;
    const powersEnabled = await dbq.get(`powers_enabled_${guildId}`) !== false;
    
    const allData = await dbq.all();
    const powerStats = {
      totalUsers: 0,
      protection: 0,
      bomb: 0,
      counterAttack: 0,
      swap: 0,
      totalPowers: 0
    };

    for (const entry of allData) {
      if (entry.id.startsWith(`powers_${guildId}.`)) {
        powerStats.totalUsers++;
        const powers = entry.value;
        if (powers.protection) { powerStats.protection++; powerStats.totalPowers++; }
        if (powers.bomb > 0) { powerStats.bomb += powers.bomb; powerStats.totalPowers += powers.bomb; }
        if (powers.counterAttack) { powerStats.counterAttack++; powerStats.totalPowers++; }
        if (powers.swap) { powerStats.swap++; powerStats.totalPowers++; }
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🛒 إدارة نظام الخصائص المتقدم')
      .setColor(powersEnabled ? '#10B981' : '#EF4444')
      .setDescription(`
**📊 الحالة الحالية:**
${powersEnabled ? "✅ **نظام الخصائص مفعل**" : "❌ **نظام الخصائص معطل**"}

**📈 إحصائيات الاستخدام:**
👥 إجمالي المستخدمين: \`${powerStats.totalUsers}\`
🛡️ خصائص الحماية: \`${powerStats.protection}\`
💣 إجمالي القنابل: \`${powerStats.bomb}\`
⚔️ الهجمات المرتدة: \`${powerStats.counterAttack}\`
🔄 خصائص التبديل: \`${powerStats.swap}\`
📦 إجمالي الخصائص: \`${powerStats.totalPowers}\`

**💰 أسعار الخصائص الحالية:**
🛡️ الحماية: \`15 نقطة\`
💣 القنبلة: \`20 نقطة\`
⚔️ الهجمة المرتدة: \`25 نقطة\`
🔄 التبديل: \`30 نقطة\`

**🎮 التأثير على الألعاب:**
${powersEnabled ? 
  '• ✅ تظهر أزرار المتجر والحقيبة والإحصائيات في الروليت\n• ✅ تعمل جميع الخصائص أثناء اللعبة\n• ✅ يمكن للأعضاء شراء واستخدام الخصائص' :
  '• ❌ لا تظهر أزرار المتجر والحقيبة والإحصائيات\n• ❌ لا تعمل أي خصائص أثناء اللعبة\n• ❌ تعمل الألعاب بالنظام التقليدي فقط'
}
      `)
      .setFooter({
        text: 'إدارة متقدمة لنظام الخصائص',
        iconURL: 'https://cdn.discordapp.com/attachments/1297338870681043004/1299408268917084201/njm.png'
      });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('powers_select')
      .setPlaceholder('اختر إعداد الخصائص')
      .addOptions([
        {
          label: `${powersEnabled ? '❌ إلغاء تفعيل' : '✅ تفعيل'} نظام الخصائص`,
          description: `${powersEnabled ? 'إيقاف النظام كاملاً' : 'تشغيل النظام للجميع'}`,
          value: 'toggle_system',
          emoji: powersEnabled ? '❌' : '✅'
        },
        {
          label: '🔄 إعادة تعيين جميع الخصائص',
          description: 'حذف جميع الخصائص المملوكة في السيرفر',
          value: 'reset_all',
          emoji: '🔄'
        },
        {
          label: '📊 تقرير مفصل للخصائص',
          description: 'عرض تقرير شامل لاستخدام الخصائص',
          value: 'detailed_report',
          emoji: '📊'
        },
        {
          label: '🔙 العودة للقائمة الرئيسية',
          description: 'الرجوع لاختيار فئة أخرى',
          value: 'back_main',
          emoji: '🔙'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.update({ embeds: [embed], components: [row] });
  }





  async function handlePowersSettings(interaction, dbq) {
    const guildId = interaction.guild.id;
    const selectedValue = interaction.values[0];

    switch (selectedValue) {
      case 'toggle_system':
        await togglePowersSystem(interaction, dbq, guildId);
        break;
      case 'reset_all':
        await showResetConfirmation(interaction, dbq, guildId);
        break;
      case 'detailed_report':
        await showDetailedReport(interaction, dbq, guildId);
        break;
      case 'back_main':
        await showMainMenu(interaction);
        break;
    }
  }





  async function togglePowersSystem(interaction, dbq, guildId) {
    const currentState = await dbq.get(`powers_enabled_${guildId}`) !== false;
    const newState = !currentState;
    
    await dbq.set(`powers_enabled_${guildId}`, newState);

    const embed = new EmbedBuilder()
      .setColor(newState ? '#10B981' : '#EF4444')
      .setTitle(`${newState ? '✅ تم تفعيل' : '❌ تم إلغاء تفعيل'} نظام الخصائص`)
      .setDescription(`
**التغييرات المطبقة:**

${newState ? `
✅ **تم تفعيل النظام بنجاح**
• سيظهر زر المتجر في واجهة الروليت
• سيظهر زر الحقيبة للأعضاء
• ستظهر أزرار الإحصائيات
• ستعمل جميع الخصائص أثناء اللعبة
• يمكن للأعضاء شراء خصائص جديدة
• ستظهر أزرار الخصائص للاعب المختار
` : `
❌ **تم إلغاء تفعيل النظام**
• لن يظهر زر المتجر أو الحقيبة أو الإحصائيات
• لن تعمل أي خصائص أثناء اللعبة
• ستعمل الألعاب بالنظام التقليدي فقط
• الخصائص المملوكة محفوظة (لن تُحذف)
• يمكن إعادة التفعيل في أي وقت
`}

**📊 حالة النظام الجديدة:** ${newState ? '🟢 مفعل' : '🔴 معطل'}
      `)
      .setFooter({ text: 'تم تطبيق الإعدادات على جميع القنوات' });

    await interaction.reply({ embeds: [embed], ephemeral: true });

    setTimeout(async () => {
      await showPowersSettings(interaction, dbq);
    }, 3000);
  }





  async function showResetConfirmation(interaction, dbq, guildId) {
    const embed = new EmbedBuilder()
      .setColor('#EF4444')
      .setTitle('⚠️ تأكيد إعادة التعيين')
      .setDescription(`
**🚨 تحذير: هذا الإجراء لا يمكن التراجع عنه!**

سيتم حذف **جميع الخصائص المملوكة** من كافة الأعضاء في السيرفر:
• 🛡️ جميع خصائص الحماية
• 💣 جميع القنابل المملوكة
• ⚔️ جميع الهجمات المرتدة
• 🔄 جميع خصائص التبديل

**ما لن يتم حذفه:**
✅ النقاط المكتسبة
✅ الإحصائيات الشخصية
✅ إعدادات النظام

**هل أنت متأكد من المتابعة؟**
      `);

    const confirmButton = new ButtonBuilder()
      .setCustomId('powers_confirm_reset')
      .setLabel('🔄 تأكيد الحذف')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId('powers_cancel_reset')
      .setLabel('❌ إلغاء')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }





  async function handlePowersActions(interaction, dbq) {
    const action = interaction.customId.replace('powers_', '');

    switch (action) {
      case 'confirm_reset':
        await executeReset(interaction, dbq);
        break;
      case 'cancel_reset':
        await interaction.update({ 
          content: '❌ تم إلغاء عملية إعادة التعيين.', 
          embeds: [], 
          components: [] 
        });
        break;
    }
  }





  async function executeReset(interaction, dbq) {
    const guildId = interaction.guild.id;
    
    try {
      const allData = await dbq.all();
      let resetCount = 0;

      for (const entry of allData) {
        if (entry.id.startsWith(`powers_${guildId}.`)) {
          await dbq.delete(entry.id);
          resetCount++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#10B981')
        .setTitle('✅ تمت إعادة التعيين بنجاح')
        .setDescription(`
**📊 النتائج:**
🔄 تم حذف خصائص \`${resetCount}\` عضو
⏰ وقت التنفيذ: ${new Date().toLocaleString('ar-SA')}

**✅ ما تم إنجازه:**
• حذف جميع الخصائص المملوكة
• الحفاظ على النقاط والإحصائيات
• إعادة تعيين المتجر لحالته الأولى

**🎮 النتيجة:**
يمكن للأعضاء الآن شراء خصائص جديدة من البداية
        `)
        .setFooter({ text: 'تمت العملية بنجاح' });

      await interaction.update({ embeds: [embed], components: [] });

    } catch (error) {
      console.error('خطأ في إعادة التعيين:', error);
      await interaction.update({ 
        content: '❌ حدث خطأ أثناء إعادة التعيين. يرجى المحاولة مرة أخرى.', 
        embeds: [], 
        components: [] 
      });
    }
  }





  async function showDetailedReport(interaction, dbq, guildId) {
    const allData = await dbq.all();
    const powerStats = {
      users: [],
      totals: { protection: 0, bomb: 0, counterAttack: 0, swap: 0, points: 0 }
    };

    for (const entry of allData) {
      if (entry.id.startsWith(`powers_${guildId}.`)) {
        const userId = entry.id.split('.')[1];
        const powers = entry.value;
        
        const pointsData = await dbq.get(`points_${guildId}.${userId}`) || 0;
        
        powerStats.users.push({
          userId,
          powers,
          points: pointsData,
          totalPowers: (powers.protection ? 1 : 0) + (powers.bomb || 0) + 
                      (powers.counterAttack ? 1 : 0) + (powers.swap ? 1 : 0)
        });

        if (powers.protection) powerStats.totals.protection++;
        if (powers.bomb > 0) powerStats.totals.bomb += powers.bomb;
        if (powers.counterAttack) powerStats.totals.counterAttack++;
        if (powers.swap) powerStats.totals.swap++;
        powerStats.totals.points += pointsData;
      }
    }

    powerStats.users.sort((a, b) => b.totalPowers - a.totalPowers);

    let topUsersText = '';
    const topUsers = powerStats.users.slice(0, 10);
    
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅';
      topUsersText += `${emoji} <@${user.userId}>: \`${user.totalPowers}\` خصائص (\`${user.points}\` نقطة)\n`;
    }

    const embed = new EmbedBuilder()
      .setColor('#3B82F6')
      .setTitle('📊 التقرير المفصل لنظام الخصائص')
      .setDescription(`
**📈 الإحصائيات العامة:**
👥 إجمالي المستخدمين: \`${powerStats.users.length}\`
💰 إجمالي النقاط: \`${powerStats.totals.points.toLocaleString()}\`

**🎯 توزيع الخصائص:**
🛡️ الحماية: \`${powerStats.totals.protection}\`
💣 القنابل: \`${powerStats.totals.bomb}\`
⚔️ الهجمة المرتدة: \`${powerStats.totals.counterAttack}\`
🔄 التبديل: \`${powerStats.totals.swap}\`

**🏆 أكثر الأعضاء امتلاكاً للخصائص:**
${topUsersText || 'لا يوجد أعضاء بخصائص حالياً'}
      `)
      .setFooter({ 
        text: `تم إنشاء التقرير في ${new Date().toLocaleString('ar-SA')}`,
        iconURL: interaction.guild.iconURL() 
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }





  async function showMainMenu(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('⚙️ لوحة التحكم الإدارية')
      .setThumbnail('https://cdn.discordapp.com/attachments/1301600906135212106/1321636274217549824/filter.png')
      .setColor('#ffffff')
      .setFooter({
        text: 'Njm Control Panel',
        iconURL: 'https://cdn.discordapp.com/attachments/1297338870681043004/1299408268917084201/njm.png'
      })
      .setDescription('**اختر الفئة للتحكم بالإعدادات المطلوبة**\n\n🔧 الإعدادات العامة\n🎯 إعدادات الألعاب\n🛒 إعدادات الخصائص المتقدمة\n🔄 إعدادات التحويل');

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('category_select')
      .setPlaceholder('اختر فئة الإعدادات')
      .addOptions([
        {
          label: '🔧 الإعدادات العامة',
          description: 'إعدادات أساسية للبوت',
          value: 'setting',
        },
        {
          label: '🎯 إعدادات الروليت',
          description: 'التحكم في لعبة الروليت',
          value: 'roulette',
        },
        {
          label: '🕵️ إعدادات المافيا',
          description: 'التحكم في لعبة المافيا',
          value: 'mafia',
        },
        {
          label: '💬 إعدادات برا السالفة',
          description: 'التحكم في لعبة برا السالفة',
          value: 'bra',
        },
        {
          label: '🛒 إعدادات الخصائص',
          description: 'إدارة متجر الخصائص والقدرات',
          value: 'powers',
        },
        {
          label: '🔄 إعدادات التحويل',
          description: 'التحكم في نظام تحويل النقاط',
          value: 'transfer',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.update({ embeds: [embed], components: [row] });
  }





  async function showGeneralSettings(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🔧 الإعدادات العامة للبوت')
      .setColor('#252f3f')
      .setFooter({
        text: 'Njm',
        iconURL: 'https://i.ibb.co/qFM3vBdW/settings.gif'
      });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('setting_select')
      .setPlaceholder('اختر الإعداد المطلوب')
      .addOptions([
        { label: 'تفعيل منشن الهير مع رسائل الألعاب الجماعية', value: 'togglehere' },
        { label: 'تحديد شات الألعاب الفردية', value: 'sichannel' },
        { label: 'تحديد شات الألعاب الجماعية', value: 'smchannel' },
        { label: 'تحديد من يستطيع تشغيل الألعاب الجماعية', value: 'smgamesmu' },
        { label: 'تحديد من يستطيع تشغيل الألعاب الفردية', value: 'smrofr' },
        { label: 'تحديد صورة الفوز', value: 'sbwinner' },
        { label: 'تحديد خلفية الألعاب الفردية', value: 'sbgrouns' },
        { label: 'تحديد خلفية أمر الأعلام والشركات', value: 'sbimagecf' },
        { label: '🔙 العودة للقائمة الرئيسية', value: 'back' },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.update({ embeds: [embed], components: [row] });
  }





  async function showRouletteSettings(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎯 إعدادات لعبة الروليت')
      .setThumbnail('https://cdn.discordapp.com/attachments/1301600906135212106/1321643696604581930/filter.png')
      .setColor('#ffffff')
      .setFooter({
        text: 'Njm',
        iconURL: 'https://cdn.discordapp.com/attachments/1297338870681043004/1299408268917084201/njm.png'
      });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('roulette_select')
      .setPlaceholder('اختر إعداد الروليت')
      .addOptions([
        { label: 'تفعيل/إلغاء زر النيوك', value: 'togglenewk' },
        { label: 'تفعيل/إلغاء زر الإنعاش', value: 'togglerefresh' },
        { label: 'تفعيل/إلغاء زر الطرد العشوائي', value: 'togglekickrandom' },
        { label: 'تحديد عدد لاعبين الروليت', value: 'setplayers' },
        { label: 'تفعيل/إلغاء خاصية أزرار المشاركين', value: 'number' },
        { label: 'تحديد وقت بدء الروليت', value: 'timerruoll' },
        { label: 'تحديد صورة البدء للروليت', value: 'ruolateimage' },
        { label: 'تحديد ألوان الروليت', value: 'setcolor' },
        { label: '🔙 العودة للقائمة الرئيسية', value: 'back' },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.update({ embeds: [embed], components: [row] });
  }





  async function showMafiaSettings(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🕵️ إعدادات لعبة المافيا')
      .setColor('#252f3f')
      .setFooter({
        text: 'Njm',
        iconURL: 'https://cdn.discordapp.com/attachments/1297338870681043004/1299408268917084201/njm.png'
      });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('mafia_select')
      .setPlaceholder('اختر إعداد المافيا')
      .addOptions([
        { label: 'تحديد صورة المتسابقين للمافيا', value: 'setmafiamem' },
        { label: 'تحديد صورة البدء للمافيا', value: 'setimagemaf' },
        { label: 'تحديد وقت بدء للمافيا', value: 'timermafia' },
        { label: 'تحديد عدد لاعبين المافيا', value: 'playersmafia' },
        { label: '🔙 العودة للقائمة الرئيسية', value: 'back' },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.update({ embeds: [embed], components: [row] });
  }





  async function showBraSettings(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('💬 إعدادات لعبة برا السالفة')
      .setColor('#252f3f')
      .setFooter({
        text: 'Njm',
        iconURL: 'https://cdn.discordapp.com/attachments/1297338870681043004/1299408268917084201/njm.png'
      });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('bra_select')
      .setPlaceholder('اختر إعداد برا السالفة')
      .addOptions([
        { label: 'تحديد صورة البدء لبرا السالفة', value: 'setimagebra' },
        { label: 'تحديد عدد لاعبين لعبة برا السالفة', value: 'addbra' },
        { label: 'تحديد وقت بدء للعبة برا السالفة', value: 'timerbta' },
        { label: 'تحديد صورة الإعلان', value: 'setvs' },
        { label: 'تحديد صورة السؤال', value: 'setquestion' },
        { label: 'تحديد صورة الجواب', value: 'setanswer' },
        { label: '🔙 العودة للقائمة الرئيسية', value: 'back' },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.update({ embeds: [embed], components: [row] });
  }





  async function handleRouletteSettings(interaction, dbq, ms) {
    const guildId = interaction.guild.id;
    const selectedValue = interaction.values[0];

    switch (selectedValue) {
      case 'togglenewk':
        let newk_enabled = await dbq.get(`newk_enabled_${guildId}`);
        newk_enabled = !newk_enabled;
        await dbq.set(`newk_enabled_${guildId}`, newk_enabled);
        await interaction.reply(`✅ تم ${newk_enabled ? 'تفعيل' : 'إلغاء'} زر "النيوك" بنجاح.`);
        break;

      case 'togglerefresh':
        let refresh_enabled = await dbq.get(`refresh_enabled_${guildId}`);
        refresh_enabled = !refresh_enabled;
        await dbq.set(`refresh_enabled_${guildId}`, refresh_enabled);
        await interaction.reply(`✅ تم ${refresh_enabled ? 'تفعيل' : 'إلغاء'} زر "الإنعاش" بنجاح.`);
        break;

      case 'togglekickrandom':
        let kick_random = await dbq.get(`kick_random_${guildId}`);
        kick_random = !kick_random;
        await dbq.set(`kick_random_${guildId}`, kick_random);
        await interaction.reply(`✅ تم ${kick_random ? 'تفعيل' : 'إلغاء'} زر "الطرد العشوائي" بنجاح.`);
        break;

      case 'setplayers':
        await interaction.reply({ content: '🔢 من فضلك، اكتب عدد الأشخاص الذين يمكنهم اللعب:', ephemeral: true });
        const filterPlayers = m => m.author.id === interaction.user.id;
        const collectedPlayers = await interaction.channel.awaitMessages({ filter: filterPlayers, max: 1, time: 30000 });

        if (collectedPlayers.size > 0) {
          const playersCount = parseInt(collectedPlayers.first().content);
          await collectedPlayers.first().delete();
          if (!isNaN(playersCount) && playersCount > 0 && playersCount <= 50) {
            await dbq.set(`playersCount_${guildId}`, playersCount);
            await interaction.followUp({ content: `✅ تم تعيين عدد اللاعبين إلى **${playersCount}** بنجاح.`, ephemeral: true });
          } else {
            await interaction.followUp({ content: '❌ يرجى إدخال رقم صحيح بين 1-50.', ephemeral: true });
          }
        } else {
          await interaction.followUp({ content: '⏰ انتهى الوقت المحدد للإدخال.', ephemeral: true });
        }
        break;

      case 'number':
        const currentState = await dbq.get(`numberSetting_${guildId}`) || false;
        const newState = !currentState;
        await dbq.set(`numberSetting_${guildId}`, newState);
        await interaction.reply({ content: `✅ تم ${newState ? "تفعيل" : "إلغاء تفعيل"} خاصية أزرار الأرقام بنجاح.`, ephemeral: true });
        break;

      case 'timerruoll':
        await interaction.reply({ content: '⏰ من فضلك، اكتب الوقت (مثال: 1h أو 30m أو 45s):', ephemeral: true });
        const filter = m => m.author.id === interaction.user.id;
        const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

        if (collected.size > 0) {
          const timeString = collected.first().content.trim();
          await collected.first().delete();
          const durationInMillis = ms(timeString);

          if (!durationInMillis) {
            await interaction.followUp({ content: '❌ يرجى تحديد وقت صحيح، مثال: `1h` أو `30m` أو `45s`.', ephemeral: true });
          } else {
            await dbq.set(`timerroulette_${interaction.user.id}`, durationInMillis);
            const durationInHours = Math.floor(durationInMillis / (1000 * 60 * 60));
            const durationInMinutes = Math.floor((durationInMillis % (1000 * 60 * 60)) / (1000 * 60));
            const durationInSeconds = Math.floor((durationInMillis % (1000 * 60)) / 1000);
            
            await interaction.followUp({ 
              content: `✅ تم تحديد وقت انتظار الروليت: **${durationInHours}ساعة ${durationInMinutes}دقيقة ${durationInSeconds}ثانية**`, 
              ephemeral: true 
            });
          }
        } else {
          await interaction.followUp({ content: '⏰ انتهى الوقت المحدد للإدخال.', ephemeral: true });
        }
        break;

      case 'ruolateimage':
        await handleImageUpload(interaction, dbq, 'ruolateimage', 'صورة بداية الروليت');
        break;

      case 'setcolor':
        await interaction.reply({ content: '🎨 من فضلك، اكتب اللون الأول للروليت (hex code مثل #FF0000):', ephemeral: true });
        const filterBg = m => m.author.id === interaction.user.id;
        const collectedBg = await interaction.channel.awaitMessages({ filter: filterBg, max: 1, time: 30000 });

        if (collectedBg.size > 0) {
          const backgroundColor = collectedBg.first().content.trim();
          await collectedBg.first().delete();
          
          await interaction.followUp({ content: '🎨 من فضلك، اكتب اللون الثاني للروليت:', ephemeral: true });
          const filterText = m => m.author.id === interaction.user.id;
          const collectedText = await interaction.channel.awaitMessages({ filter: filterText, max: 1, time: 30000 });

          if (collectedText.size > 0) {
            const textColor = collectedText.first().content.trim();
            await collectedText.first().delete();
            
            await dbq.set(`backgroundColor_${guildId}`, backgroundColor);
            await dbq.set(`textColor_${guildId}`, textColor);
            await interaction.followUp({ 
              content: `✅ تم تحديد ألوان الروليت:\n🎨 اللون الأول: \`${backgroundColor}\`\n🎨 اللون الثاني: \`${textColor}\``, 
              ephemeral: true 
            });
          }
        }
        break;

      case 'back':
        await showMainMenu(interaction);
        break;
    }
  }

  async function handleMafiaSettings(interaction, dbq, ms) {
    const guildId = interaction.guild.id;
    const selectedValue = interaction.values[0];

    switch (selectedValue) {
      case 'setmafiamem':
        await handleImageUpload(interaction, dbq, 'setmafiamem', 'صورة المتسابقين للمافيا');
        break;

      case 'setimagemaf':
        await handleImageUpload(interaction, dbq, 'setimagemaf', 'صورة بداية المافيا');
        break;

      case 'timermafia':
        await handleTimeInput(interaction, dbq, 'timeermafia', 'وقت انتظار المافيا');
        break;

      case 'playersmafia':
        await handlePlayersInput(interaction, dbq, 'playersmafia', 'عدد لاعبين المافيا');
        break;

      case 'back':
        await showMainMenu(interaction);
        break;
    }
  }

  async function handleBraSettings(interaction, dbq, ms) {
    const guildId = interaction.guild.id;
    const selectedValue = interaction.values[0];

    switch (selectedValue) {
      case 'setimagebra':
        await handleImageUpload(interaction, dbq, 'setimagebra', 'صورة بداية برا السالفة');
        break;

      case 'addbra':
        await handlePlayersInput(interaction, dbq, 'addbra', 'عدد لاعبين برا السالفة');
        break;

      case 'timerbta':
        await handleTimeInput(interaction, dbq, 'timerbta', 'وقت انتظار برا السالفة');
        break;

      case 'setvs':
        await handleImageUpload(interaction, dbq, 'setvs', 'صورة الإعلان');
        break;

      case 'setquestion':
        await handleImageUpload(interaction, dbq, 'setquestion', 'صورة السؤال');
        break;

      case 'setanswer':
        await handleImageUpload(interaction, dbq, 'setanswer', 'صورة الجواب');
        break;

      case 'back':
        await showMainMenu(interaction);
        break;
    }
  }

  async function handleGeneralSettings(interaction, dbq) {
    const guildId = interaction.guild.id;
    const selectedValue = interaction.values[0];

    switch (selectedValue) {
      case 'togglehere':
        const roleEnabled = await dbq.get(`hereRoleEnabled_${guildId}`) || false;
        const newRoleState = !roleEnabled;
        await dbq.set(`hereRoleEnabled_${guildId}`, newRoleState);
        await interaction.reply({ 
          content: `✅ تم ${newRoleState ? 'تفعيل' : 'إلغاء'} منشن @here مع رسائل الألعاب الجماعية.`, 
          ephemeral: true 
        });
        break;

      case 'sichannel':
        await handleChannelInput(interaction, dbq, 'commandChannel', 'شات الألعاب الفردية');
        break;

      case 'smchannel':
        await handleChannelInput(interaction, dbq, 'smchannel', 'شات الألعاب الجماعية');
        break;

      case 'smgamesmu':
        await handleRoleInput(interaction, dbq, 'managergamess', 'مدير الألعاب الجماعية');
        break;

      case 'smrofr':
        await handleRoleInput(interaction, dbq, 'managergamesfr', 'مدير الألعاب الفردية');
        break;

      case 'sbwinner':
        await handleImageUpload(interaction, dbq, 'messageimage', 'صورة الفوز');
        break;

      case 'sbgrouns':
        await handleImageUpload(interaction, dbq, 'sbgrouns', 'خلفية الألعاب الفردية');
        break;

      case 'sbimagecf':
        await handleImageUpload(interaction, dbq, 'sbimagecf', 'خلفية الأعلام والشركات');
        break;

      case 'back':
        await showMainMenu(interaction);
        break;
    }
  }





  async function handleImageUpload(interaction, dbq, key, description) {
    await interaction.reply({ 
      content: `🖼️ من فضلك، ارفع صورة ${description} أو اكتب رابط الصورة:`, 
      ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });

    if (collected.size > 0) {
      const message = collected.first();
      let imageUrl = null;

      if (message.attachments.size > 0) {
        imageUrl = message.attachments.first().url;
      } else if (message.content.trim().startsWith('http')) {
        imageUrl = message.content.trim();
      }

      if (imageUrl) {
        try {
          await message.delete();
          
          const imageName = `${key}_${interaction.guild.id}.png`;
          const imagePath = path.join(__dirname, '../imager', imageName);
          
          const fetch = await import('node-fetch');
          const response = await fetch.default(imageUrl);
          const buffer = await response.arrayBuffer();
          
          fs.writeFileSync(imagePath, Buffer.from(buffer));
          await dbq.set(`${key}_${interaction.guild.id}`, imagePath);
          
          await interaction.followUp({ 
            content: `✅ تم حفظ ${description} بنجاح!`, 
            ephemeral: true 
          });
        } catch (error) {
          console.error('خطأ في حفظ الصورة:', error);
          await interaction.followUp({ 
            content: '❌ حدث خطأ أثناء حفظ الصورة. تأكد من صحة الرابط.', 
            ephemeral: true 
          });
        }
      } else {
        await message.delete();
        await interaction.followUp({ 
          content: '❌ يرجى رفع صورة أو إدخال رابط صحيح.', 
          ephemeral: true 
        });
      }
    } else {
      await interaction.followUp({ 
        content: '⏰ انتهى الوقت المحدد للإدخال.', 
        ephemeral: true 
      });
    }
  }

  async function handleTimeInput(interaction, dbq, key, description) {
    await interaction.reply({ 
      content: `⏰ من فضلك، اكتب ${description} (مثال: 1h أو 30m أو 45s):`, 
      ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

    if (collected.size > 0) {
      const timeString = collected.first().content.trim();
      await collected.first().delete();
      
      const durationInMillis = ms(timeString);

      if (!durationInMillis) {
        await interaction.followUp({ 
          content: '❌ يرجى تحديد وقت صحيح، مثال: `1h` أو `30m` أو `45s`.', 
          ephemeral: true 
        });
      } else {
        await dbq.set(`${key}_${interaction.user.id}`, durationInMillis);
        
        const hours = Math.floor(durationInMillis / (1000 * 60 * 60));
        const minutes = Math.floor((durationInMillis % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((durationInMillis % (1000 * 60)) / 1000);
        
        await interaction.followUp({ 
          content: `✅ تم تحديد ${description}: **${hours}ساعة ${minutes}دقيقة ${seconds}ثانية**`, 
          ephemeral: true 
        });
      }
    } else {
      await interaction.followUp({ 
        content: '⏰ انتهى الوقت المحدد للإدخال.', 
        ephemeral: true 
      });
    }
  }

  async function handlePlayersInput(interaction, dbq, key, description) {
    await interaction.reply({ 
      content: `🔢 من فضلك، اكتب ${description}:`, 
      ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

    if (collected.size > 0) {
      const playersCount = parseInt(collected.first().content);
      await collected.first().delete();
      
      if (!isNaN(playersCount) && playersCount > 0 && playersCount <= 50) {
        await dbq.set(`${key}_${interaction.guild.id}`, playersCount);
        await interaction.followUp({ 
          content: `✅ تم تعيين ${description} إلى **${playersCount}** بنجاح.`, 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          content: '❌ يرجى إدخال رقم صحيح بين 1-50.', 
          ephemeral: true 
        });
      }
    } else {
      await interaction.followUp({ 
        content: '⏰ انتهى الوقت المحدد للإدخال.', 
        ephemeral: true 
      });
    }
  }

  async function handleChannelInput(interaction, dbq, key, description) {
    await interaction.reply({ 
      content: `📺 من فضلك، اكتب ID القناة أو اعمل منشن للقناة لـ${description}:`, 
      ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

    if (collected.size > 0) {
      const message = collected.first();
      await message.delete();
      
      let channelId = message.content.trim();
      

      if (channelId.startsWith('<#') && channelId.endsWith('>')) {
        channelId = channelId.slice(2, -1);
      }
      
      const channel = interaction.guild.channels.cache.get(channelId);
      
      if (channel) {
        await dbq.set(`${key}_${interaction.guild.id}`, channel.id);
        await interaction.followUp({ 
          content: `✅ تم تحديد ${description} كـ ${channel}.`, 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          content: '❌ لم يتم العثور على القناة. تأكد من صحة ID أو المنشن.', 
          ephemeral: true 
        });
      }
    } else {
      await interaction.followUp({ 
        content: '⏰ انتهى الوقت المحدد للإدخال.', 
        ephemeral: true 
      });
    }
  }

  async function handleRoleInput(interaction, dbq, key, description) {
    await interaction.reply({ 
      content: `👥 من فضلك، اعمل منشن للرتبة المراد تعيينها كـ${description}:`, 
      ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

    if (collected.size > 0) {
      const role = collected.first().mentions.roles.first();
      await collected.first().delete();
      
      if (role) {
        await dbq.set(`${key}_${interaction.guild.id}`, [role.id]);
        await interaction.followUp({ 
          content: `✅ تم تعيين ${role} كـ${description}.`, 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          content: '❌ لم يتم العثور على الرتبة. تأكد من عمل منشن صحيح للرتبة.', 
          ephemeral: true 
        });
      }
    } else {
      await interaction.followUp({ 
        content: '⏰ انتهى الوقت المحدد للإدخال.', 
        ephemeral: true 
      });
    }
  }
}

module.exports = { execute };
