/**
 * نظام تحويل النقاط المحدث - Updated Transfer System
 * يسمح للمستخدمين بتحويل النقاط لبعضهم البعض مع إعدادات قابلة للتخصيص
 */

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = Discord;


  const transferCooldowns = new Map();

  client.on('messageCreate', async message => {
    try {
      if (message.author.bot) return;


      const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;


      if (message.content.startsWith(prefix + 'تحويل') || message.content.startsWith(prefix + 'transfer')) {
        

        const transferEnabled = await dbq.get(`transfer_enabled_${message.guild.id}`) !== false;
        const generalEnabled = await dbq.get(`transfer_general_enabled_${message.guild.id}`) !== false;
        const individualEnabled = await dbq.get(`transfer_individual_enabled_${message.guild.id}`) !== false;
        const rouletteEnabled = await dbq.get(`transfer_roulette_enabled_${message.guild.id}`) !== false;
        const maxTransferAmount = await dbq.get(`transfer_max_amount_${message.guild.id}`) || 40;
        const cooldownTime = await dbq.get(`transfer_cooldown_${message.guild.id}`) || 30000;


        if (!transferEnabled) {
          const disabledEmbed = new EmbedBuilder()
            .setTitle("❌ نظام التحويل معطل")
            .setDescription("عذراً، نظام تحويل النقاط معطل حالياً من قبل إدارة السيرفر.")
            .setColor("#ff6b6b")
            .setFooter({ text: "تواصل مع الإدارة للاستفسار" });
          
          return message.reply({ embeds: [disabledEmbed] });
        }


        if (!generalEnabled && !individualEnabled && !rouletteEnabled) {
          const noTypesEmbed = new EmbedBuilder()
            .setTitle("❌ لا توجد أنواع نقاط متاحة")
            .setDescription("عذراً، جميع أنواع النقاط معطلة للتحويل حالياً.")
            .setColor("#ff6b6b")
            .setFooter({ text: "تواصل مع الإدارة للاستفسار" });
          
          return message.reply({ embeds: [noTypesEmbed] });
        }


        const userId = message.author.id;
        const now = Date.now();
        const cooldownExpires = transferCooldowns.get(userId);
        
        if (cooldownExpires && now < cooldownExpires) {
          const timeLeft = Math.round((cooldownExpires - now) / 1000);
          const cooldownMinutes = Math.floor(timeLeft / 60);
          const cooldownSeconds = timeLeft % 60;
          
          return message.reply(`⏰ يجب الانتظار ${cooldownMinutes > 0 ? `${cooldownMinutes}دقيقة ` : ''}${cooldownSeconds}ثانية قبل استخدام أمر التحويل مرة أخرى.`);
        }

        const args = message.content.split(' ').slice(1);
        

        if (args.length < 2) {
          const embed = new EmbedBuilder()
            .setTitle("❌ خطأ في الاستخدام")
            .setDescription(`**الاستخدام الصحيح:**\n\`${prefix}تحويل @المستخدم عدد_النقاط\`\n\n**مثال:**\n\`${prefix}تحويل @User 10\``)
            .setColor("#ff6b6b")
            .setFooter({ text: `الحد الأقصى للتحويل: ${maxTransferAmount} نقطة` });
          
          return message.reply({ embeds: [embed] });
        }


        const targetUserId = args[0].replace(/[<@!>]/g, '');
        const transferAmount = parseInt(args[1], 10);


        const targetUser = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUser) {
          return message.reply("❌ لم يتم العثور على المستخدم المحدد.");
        }


        if (targetUserId === message.author.id) {
          return message.reply("❌ لا يمكنك تحويل النقاط لنفسك!");
        }


        if (targetUser.bot) {
          return message.reply("❌ لا يمكن تحويل النقاط للبوتات.");
        }


        if (isNaN(transferAmount) || transferAmount <= 0) {
          return message.reply("❌ يرجى تحديد عدد صحيح من النقاط (أكبر من 0).");
        }


        if (transferAmount > maxTransferAmount) {
          return message.reply(`❌ لا يمكن تحويل أكثر من ${maxTransferAmount} نقطة في المرة الواحدة.`);
        }


        const senderGeneralPoints = await dbq.get(`points_${message.guild.id}.${message.author.id}`) || 0;
        const senderIndividualPoints = await dbq.get(`individual_points_${message.guild.id}.${message.author.id}`) || 0;
        const senderRoulettePoints = await dbq.get(`roulette_points_${message.guild.id}.${message.author.id}`) || 0;


        const transferEmbed = new EmbedBuilder()
          .setTitle("🔄 تحويل النقاط")
          .setDescription(`**تحويل ${transferAmount} نقطة إلى ${targetUser.username}**\n\n**نقاطك الحالية:**\n${generalEnabled ? `🎮 **النقاط العامة:** ${senderGeneralPoints}\n` : ''}${individualEnabled ? `🎯 **النقاط الفردية:** ${senderIndividualPoints}\n` : ''}${rouletteEnabled ? `🕹 **نقاط الروليت:** ${senderRoulettePoints}\n` : ''}\n**اختر نوع النقاط للتحويل:**`)
          .setColor("#3498db")
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "لديك 30 ثانية للاختيار" });


        const buttons = [];
        
        if (generalEnabled) {
          const generalButton = new ButtonBuilder()
            .setCustomId(`transfer_general_${targetUserId}_${transferAmount}`)
            .setLabel("تحويل نقاط عامة")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🎮");
          buttons.push(generalButton);
        }

        if (individualEnabled) {
          const individualButton = new ButtonBuilder()
            .setCustomId(`transfer_individual_${targetUserId}_${transferAmount}`)
            .setLabel("تحويل نقاط فردية")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🎯");
          buttons.push(individualButton);
        }

        if (rouletteEnabled) {
          const rouletteButton = new ButtonBuilder()
            .setCustomId(`transfer_roulette_${targetUserId}_${transferAmount}`)
            .setLabel("تحويل نقاط روليت")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🕹");
          buttons.push(rouletteButton);
        }

        const cancelButton = new ButtonBuilder()
          .setCustomId(`transfer_cancel`)
          .setLabel("إلغاء")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("❌");


        const components = [];
        if (buttons.length > 0) {

          const row1 = new ActionRowBuilder().addComponents(buttons.slice(0, 3));
          components.push(row1);
          

          if (buttons.length > 3) {
            const row2 = new ActionRowBuilder().addComponents(buttons.slice(3));
            components.push(row2);
          }
        }
        

        const cancelRow = new ActionRowBuilder().addComponents(cancelButton);
        components.push(cancelRow);

        const transferMessage = await message.reply({ 
          embeds: [transferEmbed], 
          components: components 
        });


        const collector = transferMessage.createMessageComponentCollector({
          filter: i => i.user.id === message.author.id,
          time: 30000,
          max: 1
        });

        collector.on('collect', async interaction => {
          await interaction.deferUpdate();

          if (interaction.customId === 'transfer_cancel') {
            const cancelEmbed = new EmbedBuilder()
              .setTitle("❌ تم إلغاء التحويل")
              .setDescription("تم إلغاء عملية التحويل بنجاح.")
              .setColor("#95a5a6");

            await transferMessage.edit({ embeds: [cancelEmbed], components: [] });
            return;
          }


          let pointsKey, pointsDisplayName, pointsEmoji, currentSenderPoints;
          
          if (interaction.customId.startsWith('transfer_general_')) {
            if (!generalEnabled) {
              await transferMessage.edit({ 
                content: '❌ تحويل النقاط العامة معطل حالياً.', 
                embeds: [], 
                components: [] 
              });
              return;
            }
            pointsKey = `points_${message.guild.id}`;
            pointsDisplayName = 'النقاط العامة';
            pointsEmoji = '🎮';
            currentSenderPoints = senderGeneralPoints;
          } else if (interaction.customId.startsWith('transfer_individual_')) {
            if (!individualEnabled) {
              await transferMessage.edit({ 
                content: '❌ تحويل النقاط الفردية معطل حالياً.', 
                embeds: [], 
                components: [] 
              });
              return;
            }
            pointsKey = `individual_points_${message.guild.id}`;
            pointsDisplayName = 'النقاط الفردية';
            pointsEmoji = '🎯';
            currentSenderPoints = senderIndividualPoints;
          } else if (interaction.customId.startsWith('transfer_roulette_')) {
            if (!rouletteEnabled) {
              await transferMessage.edit({ 
                content: '❌ تحويل نقاط الروليت معطل حالياً.', 
                embeds: [], 
                components: [] 
              });
              return;
            }
            pointsKey = `roulette_points_${message.guild.id}`;
            pointsDisplayName = 'نقاط الروليت';
            pointsEmoji = '🕹';
            currentSenderPoints = senderRoulettePoints;
          }


          if (currentSenderPoints < transferAmount) {
            const errorEmbed = new EmbedBuilder()
              .setTitle("❌ نقاط غير كافية")
              .setDescription(`لا تملك نقاط كافية لإتمام هذا التحويل.\n\n${pointsEmoji} **${pointsDisplayName} الحالية:** ${currentSenderPoints}\n💸 **المطلوب للتحويل:** ${transferAmount}`)
              .setColor("#ff6b6b")
              .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

            await transferMessage.edit({ embeds: [errorEmbed], components: [] });
            return;
          }


          const newSenderPoints = currentSenderPoints - transferAmount;
          const currentTargetPoints = await dbq.get(`${pointsKey}.${targetUserId}`) || 0;
          const newTargetPoints = currentTargetPoints + transferAmount;


          await dbq.set(`${pointsKey}.${message.author.id}`, newSenderPoints);
          await dbq.set(`${pointsKey}.${targetUserId}`, newTargetPoints);


          transferCooldowns.set(userId, now + cooldownTime);


          const successEmbed = new EmbedBuilder()
            .setTitle("✅ تم التحويل بنجاح")
            .setDescription(`${pointsEmoji} **تم تحويل ${transferAmount} من ${pointsDisplayName}**\n\n👤 **من:** ${message.author.username}\n👤 **إلى:** ${targetUser.username}\n\n💰 **نقاطك الحالية:** ${newSenderPoints}\n💰 **نقاط ${targetUser.username}:** ${newTargetPoints}`)
            .setColor("#27ae60")
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

          await transferMessage.edit({ embeds: [successEmbed], components: [] });


          try {
            const member = await message.guild.members.fetch(targetUserId);
            if (member) {
              const notificationEmbed = new EmbedBuilder()
                .setTitle("💰 استلمت نقاط جديدة!")
                .setDescription(`${pointsEmoji} **استلمت ${transferAmount} من ${pointsDisplayName}**\n\n👤 **من:** ${message.author.username}\n🏠 **في سيرفر:** ${message.guild.name}\n\n💰 **نقاطك الجديدة:** ${newTargetPoints}`)
                .setColor("#3498db")
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

              await targetUser.send({ embeds: [notificationEmbed] }).catch(() => {
                message.channel.send(`📢 ${targetUser} - لقد استلمت ${transferAmount} ${pointsDisplayName} من ${message.author}!`);
              });
            }
          } catch (error) {
            console.log('لا يمكن إرسال إشعار للمستخدم المستهدف');
          }
        });

        collector.on('end', (collected) => {
          if (collected.size === 0) {
            const timeoutEmbed = new EmbedBuilder()
              .setTitle("⏰ انتهت مهلة الاختيار")
              .setDescription("تم إلغاء عملية التحويل تلقائياً بسبب انتهاء الوقت.")
              .setColor("#95a5a6");

            transferMessage.edit({ 
              embeds: [timeoutEmbed], 
              components: [] 
            }).catch(() => {});
          }
        });
      }

    } catch (error) {
      console.error('خطأ في نظام التحويل:', error);
      message.reply("❌ حدث خطأ أثناء معالجة طلب التحويل. يرجى المحاولة لاحقاً.");
    }
  });


  setInterval(() => {
    const now = Date.now();
    for (const [userId, expires] of transferCooldowns.entries()) {
      if (now >= expires) {
        transferCooldowns.delete(userId);
      }
    }
  }, 300000);

 
}

module.exports = { execute };
