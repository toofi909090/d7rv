const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require('fs');
const path = require('path');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "اعدادات" || args[0] === prefix + "edit") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات للوصول إلى الإعدادات.");
      }

      await showMainSettingsPanel(message);
    }
  });


  async function showMainSettingsPanel(message) {
    try {
      const embed = new EmbedBuilder()
        .setTitle("🎮 لوحة تحكم إعدادات الألعاب")
        .setDescription("اختر اللعبة التي تريد تعديل إعداداتها")
        .setColor("#2F3136")
        .addFields([
          {
            name: "لعبة الفخ ",
            value: "تعديل عدد اللاعبين، الوقت، والصور",
            inline: true
          },
          {
            name: "لعبة هايد",
            value: "تعديل عدد اللاعبين، الوقت، والصور",
            inline: true
          },
          {
            name: "لعبة الكراسي ",
            value: "تعديل عدد اللاعبين، الوقت، والصور",
            inline: true
          },
          {
            name: "📊 الإعدادات العامة",
            value: "إعدادات مشتركة وإحصائيات",
            inline: false
          }
        ])
        .setFooter({ text: "استخدم الأزرار للتنقل بين الإعدادات" });

      const rows = [
        new ActionRowBuilder()
          .addComponents(
            createButton("SECONDARY", "edit_trap_settings", "إعدادات الألغام", "💣"),
            createButton("SECONDARY", "edit_hide_settings", "إعدادات الهايد", "🫥"),
            createButton("SECONDARY", "edit_chairs_settings", "إعدادات الكراسي", "🪑")
          ),
        new ActionRowBuilder()
          .addComponents(
            createButton("SECONDARY", "edit_general_settings", "الإعدادات العامة", "⚙️")
          )
      ];

      const panelMsg = await message.channel.send({ 
        embeds: [embed], 
        components: rows 
      });

      const collector = panelMsg.createMessageComponentCollector({ 
        filter: i => i.user.id === message.author.id,
        time: 300000 
      });

      collector.on('collect', async inter => {
        switch (inter.customId) {
          case 'edit_trap_settings':
            await showTrapSettings(inter);
            break;
          case 'edit_hide_settings':
            await showHideSettings(inter);
            break;
          case 'edit_chairs_settings':
            await showChairsSettings(inter);
            break;
          case 'edit_general_settings':
            await showGeneralSettings(inter);
            break;
        }
      });

      collector.on('end', async () => {
        await panelMsg.edit({ components: [] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error showing main settings panel:', error);
      message.reply('❌ | حدث خطأ أثناء عرض لوحة الإعدادات.');
    }
  }


  async function showChairsSettings(interaction) {
    try {

      const maxPlayers = await dbq.get(`chairs_maxplayers_${interaction.guild.id}`) || 20;
      const minPlayers = await dbq.get(`chairs_minplayers_${interaction.guild.id}`) || 3;
      const joinTime = (await dbq.get(`timerchairs_${interaction.user.id}`) || 30000) / 1000;
      const roundTime = await dbq.get(`chairs_roundtime_${interaction.guild.id}`) || 10;
      
      const chairsImageExists = fs.existsSync(`./imager/chairsimage_${interaction.guild.id}.png`);
      const messageImageExists = fs.existsSync(`./imager/messageimage_${interaction.guild.id}.png`);

      const embed = new EmbedBuilder()
        .setTitle("🪑 إعدادات لعبة الكراسي الموسيقية")
        .setColor("#CD7F32")
        .addFields([
          { name: "👥 الحد الأقصى للاعبين", value: `${maxPlayers} لاعب`, inline: true },
          { name: "👤 الحد الأدنى للاعبين", value: `${minPlayers} لاعب`, inline: true },
          { name: "⏰ وقت الانضمام", value: `${joinTime} ثانية`, inline: true },
          { name: "🎵 وقت الجولة", value: `${roundTime} ثانية`, inline: true },
          { name: "🖼️ صورة البداية", value: chairsImageExists ? "✅ محملة" : "❌ افتراضية", inline: true },
          { name: "🏆 صورة الفوز", value: messageImageExists ? "✅ محملة" : "❌ افتراضية", inline: true }
        ])
        .setFooter({ text: "اختر الإعداد الذي تريد تعديله" });

      const rows = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "edit_chairs_maxplayers", "تغيير الحد الأقصى", "👥"),
          createButton("SECONDARY", "edit_chairs_minplayers", "تغيير الحد الأدنى", "👤"),
          createButton("SECONDARY", "edit_chairs_jointime", "تغيير وقت الانضمام", "⏰")
        ),
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "edit_chairs_roundtime", "تغيير وقت الجولة", "🎵"),
          createButton("SECONDARY", "edit_chairs_startimage", "تغيير صورة البداية", "🖼️"),
          createButton("SECONDARY", "edit_chairs_winimage", "تغيير صورة الفوز", "🏆")
        ),
        new ActionRowBuilder().addComponents(
          createButton("SUCCESS", "reset_chairs_settings", "إعادة تعيين", "🔄"),
          createButton("DANGER", "back_to_main", "العودة للقائمة الرئيسية", "⬅️")
        )
      ];

      await interaction.update({ embeds: [embed], components: rows });


      const filter = i => i.user.id === interaction.user.id;
      const collector = interaction.message.createMessageComponentCollector({ filter, time: 300000 });

      collector.on('collect', async inter => {
        await handleChairsSettingAction(inter);
      });

    } catch (error) {
      console.error('Error showing chairs settings:', error);
      await interaction.reply({ content: '❌ | حدث خطأ أثناء عرض إعدادات الكراسي.', ephemeral: true });
    }
  }


  async function handleChairsSettingAction(interaction) {
    try {
      switch (interaction.customId) {
        case 'edit_chairs_maxplayers':
          await promptForInput(interaction, 'chairs_maxplayers', 'الحد الأقصى للاعبين', 'أدخل الحد الأقصى للاعبين (5-30):', 5, 30);
          break;
        case 'edit_chairs_minplayers':
          await promptForInput(interaction, 'chairs_minplayers', 'الحد الأدنى للاعبين', 'أدخل الحد الأدنى للاعبين (3-10):', 3, 10);
          break;
        case 'edit_chairs_jointime':
          await promptForInput(interaction, 'timerchairs', 'وقت الانضمام', 'أدخل وقت الانضمام بالثواني (10-300):', 10, 300);
          break;
        case 'edit_chairs_roundtime':
          await promptForInput(interaction, 'chairs_roundtime', 'وقت الجولة', 'أدخل وقت الجولة بالثواني (5-30):', 5, 30);
          break;
        case 'edit_chairs_startimage':
          await promptForImage(interaction, 'chairsimage', 'صورة بداية الكراسي');
          break;
        case 'edit_chairs_winimage':
          await promptForImage(interaction, 'messageimage', 'صورة فوز الكراسي');
          break;
        case 'reset_chairs_settings':
          await resetChairsSettings(interaction);
          break;
        case 'back_to_main':
          await showMainSettingsPanel({ channel: interaction.channel, author: interaction.user });
          break;
      }
    } catch (error) {
      console.error('Error handling chairs setting action:', error);
      await interaction.reply({ content: '❌ | حدث خطأ أثناء معالجة الإعداد.', ephemeral: true });
    }
  }


  async function resetChairsSettings(interaction) {
    try {
      await interaction.reply({
        content: '⚠️ **تأكيد إعادة التعيين**\n\nهل أنت متأكد من إعادة تعيين جميع إعدادات لعبة الكراسي؟\n\n*اكتب "تأكيد" للمتابعة أو "إلغاء" للإلغاء*',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

      collector.on('collect', async message => {
        if (message.content.toLowerCase() === 'تأكيد') {

          await dbq.set(`chairs_maxplayers_${interaction.guild.id}`, 20);
          await dbq.set(`chairs_minplayers_${interaction.guild.id}`, 3);
          await dbq.set(`timerchairs_${interaction.user.id}`, 30000);
          await dbq.set(`chairs_roundtime_${interaction.guild.id}`, 10);
          

          const chairsImagePath = `./imager/chairsimage_${interaction.guild.id}.png`;
          const messageImagePath = `./imager/messageimage_${interaction.guild.id}.png`;
          
          if (fs.existsSync(chairsImagePath)) fs.unlinkSync(chairsImagePath);
          if (fs.existsSync(messageImagePath)) fs.unlinkSync(messageImagePath);

          await message.reply('✅ | تم إعادة تعيين جميع إعدادات لعبة الكراسي بنجاح.');
        } else {
          await message.reply('❌ | تم إلغاء العملية.');
        }
        await message.delete().catch(() => {});
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⏰ | انتهى الوقت المحدد للتأكيد.', ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error resetting chairs settings:', error);
      await interaction.followUp({ content: '❌ | حدث خطأ أثناء إعادة التعيين.', ephemeral: true });
    }
  }


  async function showTrapSettings(interaction) {
    try {

      const maxPlayers = await dbq.get(`trap_maxplayers_${interaction.guild.id}`) || 15;
      const minPlayers = await dbq.get(`trap_minplayers_${interaction.guild.id}`) || 3;
      const joinTime = (await dbq.get(`timertrap_${interaction.user.id}`) || 30000) / 1000;
      const gameTime = await dbq.get(`trap_gametime_${interaction.guild.id}`) || 30;
      
      const trapImageExists = fs.existsSync(`./imager/trapimage_${interaction.guild.id}.png`);
      const messageImageExists = fs.existsSync(`./imager/messageimage_${interaction.guild.id}.png`);

      const embed = new EmbedBuilder()
        .setTitle("💣 إعدادات لعبة الألغام")
        .setColor("#FFFFFF")
        .addFields([
          { name: "👥 الحد الأقصى للاعبين", value: `${maxPlayers} لاعب`, inline: true },
          { name: "👤 الحد الأدنى للاعبين", value: `${minPlayers} لاعب`, inline: true },
          { name: "⏰ وقت الانضمام", value: `${joinTime} ثانية`, inline: true },
          { name: "🎯 وقت دور اللاعب", value: `${gameTime} ثانية`, inline: true },
          { name: "🖼️ صورة البداية", value: trapImageExists ? "✅ محملة" : "❌ افتراضية", inline: true },
          { name: "🏆 صورة الفوز", value: messageImageExists ? "✅ محملة" : "❌ افتراضية", inline: true }
        ])
        .setFooter({ text: "اختر الإعداد الذي تريد تعديله" });

      const rows = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "edit_trap_maxplayers", "تغيير الحد الأقصى", "👥"),
          createButton("SECONDARY", "edit_trap_minplayers", "تغيير الحد الأدنى", "👤"),
          createButton("SECONDARY", "edit_trap_jointime", "تغيير وقت الانضمام", "⏰")
        ),
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "edit_trap_gametime", "تغيير وقت الدور", "🎯"),
          createButton("SECONDARY", "edit_trap_startimage", "تغيير صورة البداية", "🖼️"),
          createButton("SECONDARY", "edit_trap_winimage", "تغيير صورة الفوز", "🏆")
        ),
        new ActionRowBuilder().addComponents(
          createButton("SUCCESS", "reset_trap_settings", "إعادة تعيين", "🔄"),
          createButton("DANGER", "back_to_main", "العودة للقائمة الرئيسية", "⬅️")
        )
      ];

      await interaction.update({ embeds: [embed], components: rows });


      const filter = i => i.user.id === interaction.user.id;
      const collector = interaction.message.createMessageComponentCollector({ filter, time: 300000 });

      collector.on('collect', async inter => {
        await handleTrapSettingAction(inter);
      });

    } catch (error) {
      console.error('Error showing trap settings:', error);
      await interaction.reply({ content: '❌ | حدث خطأ أثناء عرض إعدادات الألغام.', ephemeral: true });
    }
  }


  async function handleTrapSettingAction(interaction) {
    try {
      switch (interaction.customId) {
        case 'edit_trap_maxplayers':
          await promptForInput(interaction, 'trap_maxplayers', 'الحد الأقصى للاعبين', 'أدخل الحد الأقصى للاعبين (5-25):', 5, 25);
          break;
        case 'edit_trap_minplayers':
          await promptForInput(interaction, 'trap_minplayers', 'الحد الأدنى للاعبين', 'أدخل الحد الأدنى للاعبين (2-10):', 2, 10);
          break;
        case 'edit_trap_jointime':
          await promptForInput(interaction, 'timertrap', 'وقت الانضمام', 'أدخل وقت الانضمام بالثواني (10-300):', 10, 300);
          break;
        case 'edit_trap_gametime':
          await promptForInput(interaction, 'trap_gametime', 'وقت دور اللاعب', 'أدخل وقت دور اللاعب بالثواني (15-120):', 15, 120);
          break;
        case 'edit_trap_startimage':
          await promptForImage(interaction, 'trapimage', 'صورة بداية الألغام');
          break;
        case 'edit_trap_winimage':
          await promptForImage(interaction, 'messageimage', 'صورة فوز الألغام');
          break;
        case 'reset_trap_settings':
          await resetTrapSettings(interaction);
          break;
        case 'back_to_main':
          await showMainSettingsPanel({ channel: interaction.channel, author: interaction.user });
          break;
      }
    } catch (error) {
      console.error('Error handling trap setting action:', error);
      await interaction.reply({ content: '❌ | حدث خطأ أثناء معالجة الإعداد.', ephemeral: true });
    }
  }


  async function showHideSettings(interaction) {
    try {
      const maxPlayers = await dbq.get(`hide_maxplayers_${interaction.guild.id}`) || 10;
      const minPlayers = await dbq.get(`hide_minplayers_${interaction.guild.id}`) || 3;
      const joinTime = (await dbq.get(`timerhide_${interaction.user.id}`) || 30000) / 1000;
      const hideTime = await dbq.get(`hide_hidetime_${interaction.guild.id}`) || 30;
      const seekTime = await dbq.get(`hide_seektime_${interaction.guild.id}`) || 60;
      const maxAttempts = await dbq.get(`hide_maxattempts_${interaction.guild.id}`) || 3;
      
      const hideImageExists = fs.existsSync(`./imager/hideimage_${interaction.guild.id}.png`);
      const messageImageExists = fs.existsSync(`./imager/messageimage_${interaction.guild.id}.png`);

      const embed = new EmbedBuilder()
        .setTitle("🫥 إعدادات لعبة الاختباء")
        .setColor("#FFFFFF")
        .addFields([
          { name: "👥 الحد الأقصى للاعبين", value: `${maxPlayers} لاعب`, inline: true },
          { name: "👤 الحد الأدنى للاعبين", value: `${minPlayers} لاعب`, inline: true },
          { name: "⏰ وقت الانضمام", value: `${joinTime} ثانية`, inline: true },
          { name: "🫥 وقت الاختباء", value: `${hideTime} ثانية`, inline: true },
          { name: "🔍 وقت البحث", value: `${seekTime} ثانية`, inline: true },
          { name: "🎯 محاولات الباحث", value: `${maxAttempts} محاولة`, inline: true },
          { name: "🖼️ صورة البداية", value: hideImageExists ? "✅ محملة" : "❌ افتراضية", inline: true },
          { name: "🏆 صورة الفوز", value: messageImageExists ? "✅ محملة" : "❌ افتراضية", inline: true }
        ])
        .setFooter({ text: "اختر الإعداد الذي تريد تعديله" });

      const rows = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "edit_hide_maxplayers", "تغيير الحد الأقصى", "👥"),
          createButton("SECONDARY", "edit_hide_minplayers", "تغيير الحد الأدنى", "👤"),
          createButton("SECONDARY", "edit_hide_jointime", "تغيير وقت الانضمام", "⏰")
        ),
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "edit_hide_hidetime", "تغيير وقت الاختباء", "🫥"),
          createButton("SECONDARY", "edit_hide_seektime", "تغيير وقت البحث", "🔍"),
          createButton("SECONDARY", "edit_hide_attempts", "تغيير عدد المحاولات", "🎯")
        ),
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "edit_hide_startimage", "تغيير صورة البداية", "🖼️"),
          createButton("SECONDARY", "edit_hide_winimage", "تغيير صورة الفوز", "🏆")
        ),
        new ActionRowBuilder().addComponents(
          createButton("SUCCESS", "reset_hide_settings", "إعادة تعيين", "🔄"),
          createButton("DANGER", "back_to_main", "العودة للقائمة الرئيسية", "⬅️")
        )
      ];

      await interaction.update({ embeds: [embed], components: rows });

      const filter = i => i.user.id === interaction.user.id;
      const collector = interaction.message.createMessageComponentCollector({ filter, time: 300000 });

      collector.on('collect', async inter => {
        await handleHideSettingAction(inter);
      });

    } catch (error) {
      console.error('Error showing hide settings:', error);
      await interaction.reply({ content: '❌ | حدث خطأ أثناء عرض إعدادات الاختباء.', ephemeral: true });
    }
  }


  async function handleHideSettingAction(interaction) {
    try {
      switch (interaction.customId) {
        case 'edit_hide_maxplayers':
          await promptForInput(interaction, 'hide_maxplayers', 'الحد الأقصى للاعبين', 'أدخل الحد الأقصى للاعبين (4-20):', 4, 20);
          break;
        case 'edit_hide_minplayers':
          await promptForInput(interaction, 'hide_minplayers', 'الحد الأدنى للاعبين', 'أدخل الحد الأدنى للاعبين (3-8):', 3, 8);
          break;
        case 'edit_hide_jointime':
          await promptForInput(interaction, 'timerhide', 'وقت الانضمام', 'أدخل وقت الانضمام بالثواني (10-300):', 10, 300);
          break;
        case 'edit_hide_hidetime':
          await promptForInput(interaction, 'hide_hidetime', 'وقت الاختباء', 'أدخل وقت الاختباء بالثواني (15-60):', 15, 60);
          break;
        case 'edit_hide_seektime':
          await promptForInput(interaction, 'hide_seektime', 'وقت البحث', 'أدخل وقت البحث بالثواني (30-120):', 30, 120);
          break;
        case 'edit_hide_attempts':
          await promptForInput(interaction, 'hide_maxattempts', 'عدد محاولات الباحث', 'أدخل عدد محاولات الباحث (2-5):', 2, 5);
          break;
        case 'edit_hide_startimage':
          await promptForImage(interaction, 'hideimage', 'صورة بداية الاختباء');
          break;
        case 'edit_hide_winimage':
          await promptForImage(interaction, 'messageimage', 'صورة فوز الاختباء');
          break;
        case 'reset_hide_settings':
          await resetHideSettings(interaction);
          break;
        case 'back_to_main':
          await showMainSettingsPanel({ channel: interaction.channel, author: interaction.user });
          break;
      }
    } catch (error) {
      console.error('Error handling hide setting action:', error);
      await interaction.reply({ content: '❌ | حدث خطأ أثناء معالجة الإعداد.', ephemeral: true });
    }
  }


  async function showGeneralSettings(interaction) {
    try {
      const commandChannel = await dbq.get(`smchannel_${interaction.guild.id}`);
      const managerRole = await dbq.get(`managergamess_${interaction.guild.id}`);
      

      const trapGamesData = await dbq.get(`trapgames_${interaction.guild.id}`) || {};
      const hideGamesData = await dbq.get(`hidegames_${interaction.guild.id}`) || {};
      const chairsGamesData = await dbq.get(`chairsgames_${interaction.guild.id}`) || {};
      const totalTrapGames = Object.values(trapGamesData).reduce((a, b) => a + b, 0);
      const totalHideGames = Object.values(hideGamesData).reduce((a, b) => a + b, 0);
      const totalChairsGames = Object.values(chairsGamesData).reduce((a, b) => a + b, 0);

      const embed = new EmbedBuilder()
        .setTitle("⚙️ الإعدادات العامة")
        .setColor("#2F3136")
        .addFields([
          { name: "🎮 روم الألعاب", value: commandChannel ? `<#${commandChannel}>` : "غير محددة", inline: true },
          { name: "👨‍💼 المنجر المدير", value: managerRole ? `<@&${managerRole}>` : "غير محددة", inline: true },
          { name: "📊 إجمالي الألعاب", value: `💣 الألغام: ${totalTrapGames}\n🫥 الاختباء: ${totalHideGames}\n🪑 الكراسي: ${totalChairsGames}`, inline: true }
        ])
        .setFooter({ text: "إدارة الإعدادات العامة والنسخ الاحتياطية" });

      const rows = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "edit_game_channel", "تغيير روم الألعاب", "🎮"),
          createButton("SECONDARY", "edit_manager_role", "تغيير رتبة المدير", "👨‍💼"),
          createButton("SECONDARY", "view_top_players", "أفضل اللاعبين", "🏆")
        ),
        new ActionRowBuilder().addComponents(
          createButton("DANGER", "clear_all_data", "مسح جميع البيانات", "🗑️"),
          createButton("SUCCESS", "backup_data", "نسخ احتياطي", "💾"),
          createButton("PRIMARY", "import_settings", "استيراد إعدادات", "📥")
        ),
        new ActionRowBuilder().addComponents(
          createButton("DANGER", "back_to_main", "العودة للقائمة الرئيسية", "⬅️")
        )
      ];

      await interaction.update({ embeds: [embed], components: rows });

      const filter = i => i.user.id === interaction.user.id;
      const collector = interaction.message.createMessageComponentCollector({ filter, time: 300000 });

      collector.on('collect', async inter => {
        await handleGeneralSettingAction(inter);
      });

    } catch (error) {
      console.error('Error showing general settings:', error);
      await interaction.reply({ content: '❌ | حدث خطأ أثناء عرض الإعدادات العامة.', ephemeral: true });
    }
  }


  async function handleGeneralSettingAction(interaction) {
    try {
      switch (interaction.customId) {
        case 'edit_game_channel':
          await promptForChannel(interaction);
          break;
        case 'edit_manager_role':
          await promptForRole(interaction);
          break;
        case 'view_top_players':
          await showTopPlayers(interaction);
          break;
        case 'clear_all_data':
          await confirmClearAllData(interaction);
          break;
        case 'backup_data':
          await createBackup(interaction);
          break;
        case 'import_settings':
          await promptForImport(interaction);
          break;
        case 'back_to_main':
          await showMainSettingsPanel({ channel: interaction.channel, author: interaction.user });
          break;
      }
    } catch (error) {
      console.error('Error handling general setting action:', error);
      await interaction.reply({ content: '❌ | حدث خطأ أثناء معالجة الإعداد.', ephemeral: true });
    }
  }


  async function promptForInput(interaction, settingKey, settingName, promptText, min, max) {
    try {
      await interaction.reply({
        content: `📝 **${settingName}**\n\n${promptText}\n\n**الحد الأدنى:** ${min}\n**الحد الأقصى:** ${max}\n\n*أرسل الرقم في الدردشة خلال 60 ثانية*`,
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async message => {
        const value = parseInt(message.content);
        
        if (isNaN(value) || value < min || value > max) {
          await message.reply(`❌ | يجب أن يكون الرقم بين ${min} و ${max}.`);
          return;
        }


        if (settingKey.startsWith('timer')) {
          await dbq.set(`${settingKey}_${interaction.user.id}`, value * 1000);
        } else {
          await dbq.set(`${settingKey}_${interaction.guild.id}`, value);
        }

        await message.reply(`✅ | تم تحديث ${settingName} إلى ${value}.`);
        await message.delete().catch(() => {});
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⏰ | انتهى الوقت المحدد لإدخال القيمة.', ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error prompting for input:', error);
      await interaction.followUp({ content: '❌ | حدث خطأ أثناء طلب الإدخال.', ephemeral: true });
    }
  }


  async function promptForImage(interaction, imageType, imageName) {
    try {
      await interaction.reply({
        content: `🖼️ **${imageName}**\n\n📤 أرفق صورة جديدة في رسالة خلال 60 ثانية\n\n**متطلبات الصورة:**\n• الأبعاد المفضلة: 800x600 أو أكبر\n• الصيغة: PNG, JPG, GIF\n• الحجم الأقصى: 8MB\n\n*أو اكتب "حذف" لاستخدام الصورة الافتراضية*`,
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async message => {
        if (message.content.toLowerCase() === 'حذف') {

          const imagePath = `./imager/${imageType}_${interaction.guild.id}.png`;
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            await message.reply('✅ | تم حذف الصورة المخصصة. سيتم استخدام الصورة الافتراضية.');
          } else {
            await message.reply('❌ | لا توجد صورة مخصصة لحذفها.');
          }
          await message.delete().catch(() => {});
          return;
        }

        if (message.attachments.size === 0) {
          await message.reply('❌ | يجب إرفاق صورة مع الرسالة.');
          return;
        }

        const attachment = message.attachments.first();
        

        if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
          await message.reply('❌ | يجب أن يكون الملف المرفق صورة.');
          return;
        }


        if (attachment.size > 8 * 1024 * 1024) {
          await message.reply('❌ | حجم الصورة كبير جداً. الحد الأقصى 8MB.');
          return;
        }

        try {

          const response = await fetch(attachment.url);
          const buffer = await response.buffer();
          

          if (!fs.existsSync('./imager')) {
            fs.mkdirSync('./imager');
          }

          const imagePath = `./imager/${imageType}_${interaction.guild.id}.png`;
          fs.writeFileSync(imagePath, buffer);

          await message.reply(`✅ | تم حفظ ${imageName} بنجاح.`);
          
        } catch (error) {
          console.error('Error saving image:', error);
          await message.reply('❌ | حدث خطأ أثناء حفظ الصورة.');
        }

        await message.delete().catch(() => {});
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⏰ | انتهى الوقت المحدد لرفع الصورة.', ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error prompting for image:', error);
      await interaction.followUp({ content: '❌ | حدث خطأ أثناء طلب الصورة.', ephemeral: true });
    }
  }


  async function resetTrapSettings(interaction) {
    try {
      await interaction.reply({
        content: '⚠️ **تأكيد إعادة التعيين**\n\nهل أنت متأكد من إعادة تعيين جميع إعدادات لعبة الألغام؟\n\n*اكتب "تأكيد" للمتابعة أو "إلغاء" للإلغاء*',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

      collector.on('collect', async message => {
        if (message.content.toLowerCase() === 'تأكيد') {

          await dbq.set(`trap_maxplayers_${interaction.guild.id}`, 15);
          await dbq.set(`trap_minplayers_${interaction.guild.id}`, 3);
          await dbq.set(`timertrap_${interaction.user.id}`, 30000);
          await dbq.set(`trap_gametime_${interaction.guild.id}`, 30);
          

          const trapImagePath = `./imager/trapimage_${interaction.guild.id}.png`;
          const messageImagePath = `./imager/messageimage_${interaction.guild.id}.png`;
          
          if (fs.existsSync(trapImagePath)) fs.unlinkSync(trapImagePath);
          if (fs.existsSync(messageImagePath)) fs.unlinkSync(messageImagePath);

          await message.reply('✅ | تم إعادة تعيين جميع إعدادات لعبة الألغام بنجاح.');
        } else {
          await message.reply('❌ | تم إلغاء العملية.');
        }
        await message.delete().catch(() => {});
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⏰ | انتهى الوقت المحدد للتأكيد.', ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error resetting trap settings:', error);
      await interaction.followUp({ content: '❌ | حدث خطأ أثناء إعادة التعيين.', ephemeral: true });
    }
  }


  async function resetHideSettings(interaction) {
    try {
      await interaction.reply({
        content: '⚠️ **تأكيد إعادة التعيين**\n\nهل أنت متأكد من إعادة تعيين جميع إعدادات لعبة الاختباء؟\n\n*اكتب "تأكيد" للمتابعة أو "إلغاء" للإلغاء*',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

      collector.on('collect', async message => {
        if (message.content.toLowerCase() === 'تأكيد') {

          await dbq.set(`hide_maxplayers_${interaction.guild.id}`, 10);
          await dbq.set(`hide_minplayers_${interaction.guild.id}`, 3);
          await dbq.set(`timerhide_${interaction.user.id}`, 30000);
          await dbq.set(`hide_hidetime_${interaction.guild.id}`, 30);
          await dbq.set(`hide_seektime_${interaction.guild.id}`, 60);
          await dbq.set(`hide_maxattempts_${interaction.guild.id}`, 3);
          

          const hideImagePath = `./imager/hideimage_${interaction.guild.id}.png`;
          const messageImagePath = `./imager/messageimage_${interaction.guild.id}.png`;
          
          if (fs.existsSync(hideImagePath)) fs.unlinkSync(hideImagePath);
          if (fs.existsSync(messageImagePath)) fs.unlinkSync(messageImagePath);

          await message.reply('✅ | تم إعادة تعيين جميع إعدادات لعبة الاختباء بنجاح.');
        } else {
          await message.reply('❌ | تم إلغاء العملية.');
        }
        await message.delete().catch(() => {});
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⏰ | انتهى الوقت المحدد للتأكيد.', ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error resetting hide settings:', error);
      await interaction.followUp({ content: '❌ | حدث خطأ أثناء إعادة التعيين.', ephemeral: true });
    }
  }


  async function promptForChannel(interaction) {
    try {
      await interaction.reply({
        content: '📺 **تحديد قناة الألعاب**\n\nاختر إحدى الطرق التالية:\n\n1️⃣ منشن القناة في رسالة\n2️⃣ اكتب ID القناة\n3️⃣ اكتب "current" لاستخدام القناة الحالية\n\n*لديك 60 ثانية*',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async message => {
        let channelId = null;

        if (message.content.toLowerCase() === 'current') {
          channelId = message.channel.id;
        } else if (message.mentions.channels.size > 0) {
          channelId = message.mentions.channels.first().id;
        } else if (/^\d{17,19}$/.test(message.content)) {
          channelId = message.content;
        } else {
          await message.reply('❌ | تنسيق غير صحيح. استخدم منشن القناة أو ID أو "current".');
          await message.delete().catch(() => {});
          return;
        }


        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
          await message.reply('❌ | لا يمكن العثور على هذه القناة.');
          await message.delete().catch(() => {});
          return;
        }

        await dbq.set(`smchannel_${interaction.guild.id}`, channelId);
        await message.reply(`✅ | تم تحديد قناة الألعاب إلى ${channel}.`);
        await message.delete().catch(() => {});
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⏰ | انتهى الوقت المحدد لتحديد القناة.', ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error prompting for channel:', error);
      await interaction.followUp({ content: '❌ | حدث خطأ أثناء تحديد القناة.', ephemeral: true });
    }
  }


  async function promptForRole(interaction) {
    try {
      await interaction.reply({
        content: '👨‍💼 **تحديد رتبة المدير**\n\nاختر إحدى الطرق التالية:\n\n1️⃣ منشن الرتبة في رسالة\n2️⃣ اكتب ID الرتبة\n3️⃣ اكتب اسم الرتبة\n\n*لديك 60 ثانية*',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async message => {
        let roleId = null;
        let role = null;

        if (message.mentions.roles.size > 0) {
          role = message.mentions.roles.first();
          roleId = role.id;
        } else if (/^\d{17,19}$/.test(message.content)) {
          role = interaction.guild.roles.cache.get(message.content);
          roleId = message.content;
        } else {
          role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === message.content.toLowerCase());
          if (role) roleId = role.id;
        }

        if (!role) {
          await message.reply('❌ | لا يمكن العثور على هذه الرتبة.');
          await message.delete().catch(() => {});
          return;
        }

        await dbq.set(`managergamess_${interaction.guild.id}`, roleId);
        await message.reply(`✅ | تم تحديد رتبة المدير إلى ${role}.`);
        await message.delete().catch(() => {});
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⏰ | انتهى الوقت المحدد لتحديد الرتبة.', ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error prompting for role:', error);
      await interaction.followUp({ content: '❌ | حدث خطأ أثناء تحديد الرتبة.', ephemeral: true });
    }
  }


  async function showTopPlayers(interaction) {
    try {
      const trapWinsData = await dbq.get(`trapwins_${interaction.guild.id}`) || {};
      const hideWinsData = await dbq.get(`hidewins_${interaction.guild.id}`) || {};
      const chairsWinsData = await dbq.get(`chairswins_${interaction.guild.id}`) || {};
      const groupPointsData = await dbq.get(`groupgamepoints_${interaction.guild.id}`) || {};


      const topTrapPlayers = Object.entries(trapWinsData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);


      const topHidePlayers = Object.entries(hideWinsData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);


      const topChairsPlayers = Object.entries(chairsWinsData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);


      const topPointsPlayers = Object.entries(groupPointsData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      const embed = new EmbedBuilder()
        .setTitle("🏆 أفضل اللاعبين")
        .setColor("#FFD700")
        .setFooter({ text: "إحصائيات السيرفر" });

      if (topTrapPlayers.length > 0) {
        const trapList = await Promise.all(topTrapPlayers.map(async ([userId, wins], index) => {
          const user = await client.users.fetch(userId).catch(() => null);
          const userName = user ? user.displayName : 'مستخدم محذوف';
          return `${index + 1}. **${userName}** - ${wins} انتصار`;
        }));
        embed.addFields({ name: "💣 أفضل لاعبي الألغام", value: trapList.join('\n') || 'لا توجد بيانات', inline: true });
      }

      if (topHidePlayers.length > 0) {
        const hideList = await Promise.all(topHidePlayers.map(async ([userId, wins], index) => {
          const user = await client.users.fetch(userId).catch(() => null);
          const userName = user ? user.displayName : 'مستخدم محذوف';
          return `${index + 1}. **${userName}** - ${wins} انتصار`;
        }));
        embed.addFields({ name: "🫥 أفضل لاعبي الاختباء", value: hideList.join('\n') || 'لا توجد بيانات', inline: true });
      }

      if (topChairsPlayers.length > 0) {
        const chairsList = await Promise.all(topChairsPlayers.map(async ([userId, wins], index) => {
          const user = await client.users.fetch(userId).catch(() => null);
          const userName = user ? user.displayName : 'مستخدم محذوف';
          return `${index + 1}. **${userName}** - ${wins} انتصار`;
        }));
        embed.addFields({ name: "🪑 أفضل لاعبي الكراسي", value: chairsList.join('\n') || 'لا توجد بيانات', inline: true });
      }

      if (topPointsPlayers.length > 0) {
        const pointsList = await Promise.all(topPointsPlayers.map(async ([userId, points], index) => {
          const user = await client.users.fetch(userId).catch(() => null);
          const userName = user ? user.displayName : 'مستخدم محذوف';
          return `${index + 1}. **${userName}** - ${points} نقطة`;
        }));
        embed.addFields({ name: "🎮 أعلى النقاط الجماعية", value: pointsList.join('\n') || 'لا توجد بيانات', inline: false });
      }

      if (topTrapPlayers.length === 0 && topHidePlayers.length === 0 && topChairsPlayers.length === 0 && topPointsPlayers.length === 0) {
        embed.setDescription('❌ لا توجد إحصائيات متاحة بعد.');
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error showing top players:', error);
      await interaction.reply({ content: '❌ | حدث خطأ أثناء جلب إحصائيات اللاعبين.', ephemeral: true });
    }
  }


  async function confirmClearAllData(interaction) {
    try {
      await interaction.reply({
        content: '🚨 **تحذير: مسح جميع البيانات**\n\n⚠️ هذا الإجراء سيحذف:\n• جميع إحصائيات اللاعبين\n• جميع النقاط الجماعية\n• جميع الإعدادات المخصصة\n• جميع الصور المخصصة\n\n**هذا الإجراء لا يمكن التراجع عنه!**\n\n*اكتب "مسح نهائي" للتأكيد أو "إلغاء" للإلغاء*',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async message => {
        if (message.content.toLowerCase() === 'مسح نهائي') {
          try {

            await dbq.delete(`trapwins_${interaction.guild.id}`);
            await dbq.delete(`trapgames_${interaction.guild.id}`);
            await dbq.delete(`trap_maxplayers_${interaction.guild.id}`);
            await dbq.delete(`trap_minplayers_${interaction.guild.id}`);
            await dbq.delete(`trap_gametime_${interaction.guild.id}`);


            await dbq.delete(`hidewins_${interaction.guild.id}`);
            await dbq.delete(`hidegames_${interaction.guild.id}`);
            await dbq.delete(`hide_maxplayers_${interaction.guild.id}`);
            await dbq.delete(`hide_minplayers_${interaction.guild.id}`);
            await dbq.delete(`hide_hidetime_${interaction.guild.id}`);
            await dbq.delete(`hide_seektime_${interaction.guild.id}`);
            await dbq.delete(`hide_maxattempts_${interaction.guild.id}`);


            await dbq.delete(`chairswins_${interaction.guild.id}`);
            await dbq.delete(`chairsgames_${interaction.guild.id}`);
            await dbq.delete(`chairs_maxplayers_${interaction.guild.id}`);
            await dbq.delete(`chairs_minplayers_${interaction.guild.id}`);
            await dbq.delete(`chairs_roundtime_${interaction.guild.id}`);


            await dbq.delete(`groupgamepoints_${interaction.guild.id}`);


            const imagesToDelete = [
              `./imager/trapimage_${interaction.guild.id}.png`,
              `./imager/hideimage_${interaction.guild.id}.png`,
              `./imager/chairsimage_${interaction.guild.id}.png`,
              `./imager/messageimage_${interaction.guild.id}.png`
            ];

            imagesToDelete.forEach(imagePath => {
              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
              }
            });

            await message.reply('✅ | تم مسح جميع البيانات بنجاح.');

          } catch (error) {
            console.error('Error clearing all data:', error);
            await message.reply('❌ | حدث خطأ أثناء مسح البيانات.');
          }
        } else {
          await message.reply('❌ | تم إلغاء العملية.');
        }
        await message.delete().catch(() => {});
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⏰ | انتهى الوقت المحدد للتأكيد.', ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error confirming clear all data:', error);
      await interaction.followUp({ content: '❌ | حدث خطأ أثناء التأكيد.', ephemeral: true });
    }
  }


  async function createBackup(interaction) {
    try {
      await interaction.reply({ content: '💾 جاري إنشاء النسخة الاحتياطية...', ephemeral: true });

      const backupData = {
        timestamp: new Date().toISOString(),
        guildId: interaction.guild.id,
        guildName: interaction.guild.name,
        trapSettings: {
          maxPlayers: await dbq.get(`trap_maxplayers_${interaction.guild.id}`) || 15,
          minPlayers: await dbq.get(`trap_minplayers_${interaction.guild.id}`) || 3,
          gameTime: await dbq.get(`trap_gametime_${interaction.guild.id}`) || 30,
        },
        hideSettings: {
          maxPlayers: await dbq.get(`hide_maxplayers_${interaction.guild.id}`) || 10,
          minPlayers: await dbq.get(`hide_minplayers_${interaction.guild.id}`) || 3,
          hideTime: await dbq.get(`hide_hidetime_${interaction.guild.id}`) || 30,
          seekTime: await dbq.get(`hide_seektime_${interaction.guild.id}`) || 60,
          maxAttempts: await dbq.get(`hide_maxattempts_${interaction.guild.id}`) || 3,
        },
        chairsSettings: {
          maxPlayers: await dbq.get(`chairs_maxplayers_${interaction.guild.id}`) || 20,
          minPlayers: await dbq.get(`chairs_minplayers_${interaction.guild.id}`) || 3,
          roundTime: await dbq.get(`chairs_roundtime_${interaction.guild.id}`) || 10,
        },
        generalSettings: {
          commandChannel: await dbq.get(`smchannel_${interaction.guild.id}`),
          managerRole: await dbq.get(`managergamess_${interaction.guild.id}`),
        },
        statistics: {
          trapWins: await dbq.get(`trapwins_${interaction.guild.id}`) || {},
          trapGames: await dbq.get(`trapgames_${interaction.guild.id}`) || {},
          hideWins: await dbq.get(`hidewins_${interaction.guild.id}`) || {},
          hideGames: await dbq.get(`hidegames_${interaction.guild.id}`) || {},
          chairsWins: await dbq.get(`chairswins_${interaction.guild.id}`) || {},
          chairsGames: await dbq.get(`chairsgames_${interaction.guild.id}`) || {},
          groupGamePoints: await dbq.get(`groupgamepoints_${interaction.guild.id}`) || {},
        }
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      const backupBuffer = Buffer.from(backupJson, 'utf8');
      
      const filename = `games_backup_${interaction.guild.id}_${Date.now()}.json`;
      const attachment = new AttachmentBuilder(backupBuffer, { name: filename });

      await interaction.editReply({
        content: '✅ **تم إنشاء النسخة الاحتياطية بنجاح!**\n\n📁 احفظ هذا الملف في مكان آمن\n🔄 يمكنك استخدامه لاستعادة البيانات لاحقاً',
        files: [attachment]
      });

    } catch (error) {
      console.error('Error creating backup:', error);
      await interaction.editReply({ content: '❌ | حدث خطأ أثناء إنشاء النسخة الاحتياطية.' });
    }
  }


  async function promptForImport(interaction) {
    try {
      await interaction.reply({
        content: '📥 **استيراد إعدادات**\n\n📎 أرفق ملف النسخة الاحتياطية (.json) في رسالة خلال 60 ثانية\n\n⚠️ **تحذير:** سيتم استبدال الإعدادات الحالية',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async message => {
        if (message.attachments.size === 0) {
          await message.reply('❌ | يجب إرفاق ملف النسخة الاحتياطية.');
          await message.delete().catch(() => {});
          return;
        }

        const attachment = message.attachments.first();
        
        if (!attachment.name.endsWith('.json')) {
          await message.reply('❌ | يجب أن يكون الملف بصيغة JSON.');
          await message.delete().catch(() => {});
          return;
        }

        try {
          const response = await fetch(attachment.url);
          const backupText = await response.text();
          const backupData = JSON.parse(backupText);


          if (!backupData.trapSettings || !backupData.hideSettings || !backupData.chairsSettings) {
            await message.reply('❌ | ملف النسخة الاحتياطية غير صحيح.');
            await message.delete().catch(() => {});
            return;
          }


          await importBackupData(interaction.guild.id, backupData);

          await message.reply('✅ | تم استيراد الإعدادات بنجاح.');

        } catch (error) {
          console.error('Error importing settings:', error);
          await message.reply('❌ | حدث خطأ أثناء استيراد الإعدادات.');
        }

        await message.delete().catch(() => {});
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⏰ | انتهى الوقت المحدد لرفع الملف.', ephemeral: true });
        }
      });

    } catch (error) {
      console.error('Error prompting for import:', error);
      await interaction.followUp({ content: '❌ | حدث خطأ أثناء طلب الاستيراد.', ephemeral: true });
    }
  }


  async function importBackupData(guildId, backupData) {
    try {

      if (backupData.trapSettings) {
        await dbq.set(`trap_maxplayers_${guildId}`, backupData.trapSettings.maxPlayers);
        await dbq.set(`trap_minplayers_${guildId}`, backupData.trapSettings.minPlayers);
        await dbq.set(`trap_gametime_${guildId}`, backupData.trapSettings.gameTime);
      }


      if (backupData.hideSettings) {
        await dbq.set(`hide_maxplayers_${guildId}`, backupData.hideSettings.maxPlayers);
        await dbq.set(`hide_minplayers_${guildId}`, backupData.hideSettings.minPlayers);
        await dbq.set(`hide_hidetime_${guildId}`, backupData.hideSettings.hideTime);
        await dbq.set(`hide_seektime_${guildId}`, backupData.hideSettings.seekTime);
        await dbq.set(`hide_maxattempts_${guildId}`, backupData.hideSettings.maxAttempts);
      }


      if (backupData.chairsSettings) {
        await dbq.set(`chairs_maxplayers_${guildId}`, backupData.chairsSettings.maxPlayers);
        await dbq.set(`chairs_minplayers_${guildId}`, backupData.chairsSettings.minPlayers);
        await dbq.set(`chairs_roundtime_${guildId}`, backupData.chairsSettings.roundTime);
      }


      if (backupData.generalSettings) {
        if (backupData.generalSettings.commandChannel) {
          await dbq.set(`smchannel_${guildId}`, backupData.generalSettings.commandChannel);
        }
        if (backupData.generalSettings.managerRole) {
          await dbq.set(`managergamess_${guildId}`, backupData.generalSettings.managerRole);
        }
      }


      if (backupData.statistics) {
        if (backupData.statistics.trapWins) {
          await dbq.set(`trapwins_${guildId}`, backupData.statistics.trapWins);
        }
        if (backupData.statistics.trapGames) {
          await dbq.set(`trapgames_${guildId}`, backupData.statistics.trapGames);
        }
        if (backupData.statistics.hideWins) {
          await dbq.set(`hidewins_${guildId}`, backupData.statistics.hideWins);
        }
        if (backupData.statistics.hideGames) {
          await dbq.set(`hidegames_${guildId}`, backupData.statistics.hideGames);
        }
        if (backupData.statistics.chairsWins) {
          await dbq.set(`chairswins_${guildId}`, backupData.statistics.chairsWins);
        }
        if (backupData.statistics.chairsGames) {
          await dbq.set(`chairsgames_${guildId}`, backupData.statistics.chairsGames);
        }
        if (backupData.statistics.groupGamePoints) {
          await dbq.set(`groupgamepoints_${guildId}`, backupData.statistics.groupGamePoints);
        }
      }

    } catch (error) {
      console.error('Error importing backup data:', error);
      throw error;
    }
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
      .setLabel(label)
      .setDisabled(disabled);
    
    if (emoji) btn.setEmoji(emoji);
    return btn;
  }


  

  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "حد_فخ") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات لتعديل الإعدادات.");
      }

      const maxPlayers = parseInt(args[1]);
      const minPlayers = parseInt(args[2]);

      if (!maxPlayers || !minPlayers || maxPlayers < 5 || maxPlayers > 25 || minPlayers < 2 || minPlayers > 10 || minPlayers >= maxPlayers) {
        return message.reply('❌ | استخدام: `!حد_فخ [الحد_الأقصى] [الحد_الأدنى]`\nالحد الأقصى: 5-25، الحد الأدنى: 2-10');
      }

      await dbq.set(`trap_maxplayers_${message.guild.id}`, maxPlayers);
      await dbq.set(`trap_minplayers_${message.guild.id}`, minPlayers);

      await message.reply(`✅ | تم تحديث حدود لاعبي الألغام:\n• الحد الأقصى: ${maxPlayers}\n• الحد الأدنى: ${minPlayers}`);
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "حد_هايد") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات لتعديل الإعدادات.");
      }

      const maxPlayers = parseInt(args[1]);
      const minPlayers = parseInt(args[2]);

      if (!maxPlayers || !minPlayers || maxPlayers < 4 || maxPlayers > 20 || minPlayers < 3 || minPlayers > 8 || minPlayers >= maxPlayers) {
        return message.reply('❌ | استخدام: `!حد_هايد [الحد_الأقصى] [الحد_الأدنى]`\nالحد الأقصى: 4-20، الحد الأدنى: 3-8');
      }

      await dbq.set(`hide_maxplayers_${message.guild.id}`, maxPlayers);
      await dbq.set(`hide_minplayers_${message.guild.id}`, minPlayers);

      await message.reply(`✅ | تم تحديث حدود لاعبي الاختباء:\n• الحد الأقصى: ${maxPlayers}\n• الحد الأدنى: ${minPlayers}`);
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "حد_كراسي") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات لتعديل الإعدادات.");
      }

      const maxPlayers = parseInt(args[1]);
      const minPlayers = parseInt(args[2]);

      if (!maxPlayers || !minPlayers || maxPlayers < 5 || maxPlayers > 30 || minPlayers < 3 || minPlayers > 10 || minPlayers >= maxPlayers) {
        return message.reply('❌ | استخدام: `!حد_كراسي [الحد_الأقصى] [الحد_الأدنى]`\nالحد الأقصى: 5-30، الحد الأدنى: 3-10');
      }

      await dbq.set(`chairs_maxplayers_${message.guild.id}`, maxPlayers);
      await dbq.set(`chairs_minplayers_${message.guild.id}`, minPlayers);

      await message.reply(`✅ | تم تحديث حدود لاعبي الكراسي:\n• الحد الأقصى: ${maxPlayers}\n• الحد الأدنى: ${minPlayers}`);
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "عرض_اعدادات" || args[0] === prefix + "show_settings") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) {
        return message.reply("❌ | ليس لديك الصلاحيات لعرض الإعدادات.");
      }

      try {

        const trapMaxPlayers = await dbq.get(`trap_maxplayers_${message.guild.id}`) || 15;
        const trapMinPlayers = await dbq.get(`trap_minplayers_${message.guild.id}`) || 3;
        const trapJoinTime = (await dbq.get(`timertrap_${message.author.id}`) || 30000) / 1000;
        const trapGameTime = await dbq.get(`trap_gametime_${message.guild.id}`) || 30;

        const hideMaxPlayers = await dbq.get(`hide_maxplayers_${message.guild.id}`) || 10;
        const hideMinPlayers = await dbq.get(`hide_minplayers_${message.guild.id}`) || 3;
        const hideJoinTime = (await dbq.get(`timerhide_${message.author.id}`) || 30000) / 1000;
        const hideHideTime = await dbq.get(`hide_hidetime_${message.guild.id}`) || 30;
        const hideSeekTime = await dbq.get(`hide_seektime_${message.guild.id}`) || 60;
        const hideMaxAttempts = await dbq.get(`hide_maxattempts_${message.guild.id}`) || 3;

        const chairsMaxPlayers = await dbq.get(`chairs_maxplayers_${message.guild.id}`) || 20;
        const chairsMinPlayers = await dbq.get(`chairs_minplayers_${message.guild.id}`) || 3;
        const chairsJoinTime = (await dbq.get(`timerchairs_${message.author.id}`) || 30000) / 1000;
        const chairsRoundTime = await dbq.get(`chairs_roundtime_${message.guild.id}`) || 10;

        const commandChannelId = await dbq.get(`smchannel_${message.guild.id}`);
        const managerRoleId = await dbq.get(`managergamess_${message.guild.id}`);


        const trapImageExists = fs.existsSync(`./imager/trapimage_${message.guild.id}.png`);
        const hideImageExists = fs.existsSync(`./imager/hideimage_${message.guild.id}.png`);
        const chairsImageExists = fs.existsSync(`./imager/chairsimage_${message.guild.id}.png`);
        const winImageExists = fs.existsSync(`./imager/messageimage_${message.guild.id}.png`);

        const embed = new EmbedBuilder()
          .setTitle("⚙️ جميع إعدادات الألعاب")
          .setColor("#2F3136")
          .addFields([
            {
              name: "💣 إعدادات لعبة الألغام",
              value: `• الحد الأقصى: ${trapMaxPlayers} لاعب\n• الحد الأدنى: ${trapMinPlayers} لاعب\n• وقت الانضمام: ${trapJoinTime}ث\n• وقت الدور: ${trapGameTime}ث\n• صورة البداية: ${trapImageExists ? '✅' : '❌'}`,
              inline: true
            },
            {
              name: "🫥 إعدادات لعبة الاختباء",
              value: `• الحد الأقصى: ${hideMaxPlayers} لاعب\n• الحد الأدنى: ${hideMinPlayers} لاعب\n• وقت الانضمام: ${hideJoinTime}ث\n• وقت الاختباء: ${hideHideTime}ث\n• وقت البحث: ${hideSeekTime}ث\n• محاولات الباحث: ${hideMaxAttempts}`,
              inline: true
            },
            {
              name: "🪑 إعدادات لعبة الكراسي",
              value: `• الحد الأقصى: ${chairsMaxPlayers} لاعب\n• الحد الأدنى: ${chairsMinPlayers} لاعب\n• وقت الانضمام: ${chairsJoinTime}ث\n• وقت الجولة: ${chairsRoundTime}ث\n• صورة البداية: ${chairsImageExists ? '✅' : '❌'}`,
              inline: true
            },
            {
              name: "🎮 الإعدادات العامة",
              value: `• قناة الألعاب: ${commandChannelId ? `<#${commandChannelId}>` : 'غير محددة'}\n• رتبة المدير: ${managerRoleId ? `<@&${managerRoleId}>` : 'غير محددة'}\n• صورة الفوز: ${winImageExists ? '✅' : '❌'}`,
              inline: false
            }
          ])
          .setFooter({ text: `استخدم ${prefix}اعدادات لتعديل الإعدادات` });

        await message.reply({ embeds: [embed] });

      } catch (error) {
        console.error('Error showing all settings:', error);
        message.reply('❌ | حدث خطأ أثناء عرض الإعدادات.');
      }
    }
  });


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "rests" || args[0] === prefix + "reload_settings") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      if (!owners.includes(message.author.id)) {
        return message.reply("❌ | هذا الأمر متاح للمطورين فقط.");
      }

      try {

        const defaultSettings = {
          [`trap_maxplayers_${message.guild.id}`]: 15,
          [`trap_minplayers_${message.guild.id}`]: 3,
          [`trap_gametime_${message.guild.id}`]: 30,
          [`hide_maxplayers_${message.guild.id}`]: 10,
          [`hide_minplayers_${message.guild.id}`]: 3,
          [`hide_hidetime_${message.guild.id}`]: 30,
          [`hide_seektime_${message.guild.id}`]: 60,
          [`hide_maxattempts_${message.guild.id}`]: 3,
          [`chairs_maxplayers_${message.guild.id}`]: 20,
          [`chairs_minplayers_${message.guild.id}`]: 3,
          [`chairs_roundtime_${message.guild.id}`]: 10,
        };

        let reloadedCount = 0;
        for (const [key, value] of Object.entries(defaultSettings)) {
          const existing = await dbq.get(key);
          if (existing === null || existing === undefined) {
            await dbq.set(key, value);
            reloadedCount++;
          }
        }

        await message.reply(`✅ | تم إعادة تحميل ${reloadedCount} إعداد افتراضي.`);

      } catch (error) {
        console.error('Error reloading settings:', error);
        message.reply('❌ | حدث خطأ أثناء إعادة التحميل.');
      }
    }
  });

  
}

module.exports = { execute };
