const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType } = require("discord.js");
const { token } = require("../config.json"); 

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;


  client.on("messageCreate", async (message) => {
    if (message.content.startsWith(prefix + "vip")) {
      if (!owners.includes(message.author.id)) return;

      const setting = new EmbedBuilder()
        .setColor("#ffffff")
        .setThumbnail('https://cdn.discordapp.com/attachments/1301600906135212106/1321636274217549824/filter.png?ex=676df532&is=676ca3b2&hm=4e0e41973c5399355120d2df44719e00d7b1d9b7c90657bf6767b5c77de4516a&')
        .setFooter({ text: 'Control Panel' })
        .setTitle("**يرجى إختيار الإجراء الذي تريد تنفيذه.**")
        .setDescription("Bot Control");

      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("restart")
            .setEmoji("<:undoarrow:1321637211459944479>")
            .setLabel("اعاده تشغيل البوت")
            .setStyle(ButtonStyle.Secondary)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("avatar")
            .setEmoji("<:user:1321637212978151565>")
            .setLabel("تغير صوره البوت")
            .setStyle(ButtonStyle.Secondary)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("name")
            .setEmoji("<:idcard:1321637214698082387>")
            .setLabel("تغير اسم البوت")
            .setStyle(ButtonStyle.Secondary)
        );
        
      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("stats")
            .setEmoji("<:status:1321637216325341316>")
            .setLabel("تغير حاله البوت")
            .setStyle(ButtonStyle.Secondary)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("banner")
            .setEmoji("<:label:1321637217642479646>")
            .setLabel("تغير بنر البوت")
            .setStyle(ButtonStyle.Secondary)
        );

      message.channel.send({
        embeds: [setting],
        components: [row1, row2]
      }).then((message) => {

        const collector = message.createMessageComponentCollector({
          time: 60000
        });

        collector.on('collect', async (interaction) => {
          if (interaction.customId == "stats") {
            interaction.reply("⬇**قم باختيار حاله من هذه الحالات**\n`playing | streaming | listening | watching | competing`");

            const filter = m => m.author.id === interaction.user.id;
            const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

            collector.on("collect", async (i) => {
              await i.delete().catch(console.error);

              const allowedActivities = {
                'playing': 0,
                'streaming': 1,
                'listening': 2,
                'watching': 3,
                'competing': 5
              };

              const status = i.content.trim().split(" ");
              if (!status) return interaction.channel.send({ content: 'الرجاء ادخال نوع الحالة واسمها.' });

              const activity = status.shift().toLowerCase();
              const name = status.join(" ");

              if (!Object.keys(allowedActivities).includes(activity)) {
                return interaction.channel.send({ content: `الرجاء اختيار حالة صحيحة: ${Object.keys(allowedActivities).join(', ')}.` })
                  .then(m => setTimeout(() => m.delete(), 3000));
              }

              if (!name) return interaction.channel.send({ content: 'الرجاء ادخل إسم الحالة بعد نوعها\nمثل: `playing hello world`' })
                .then(m => setTimeout(() => m.delete(), 3000));

              await dbq.set(`activity_${client.user.id}`, { name, type: allowedActivities[activity], url: "https://www.twitch.tv/#$" });

              client.user.setActivity({ name, type: allowedActivities[activity], url: "https://www.twitch.tv/#$" });
              collector.stop();
              await interaction.editReply({ content: `تم تحديث حالة البوت إلى ${activity} ${name}.`, ephemeral: true });
            });
          }

          if (interaction.customId === "banner") {
            try {
              await interaction.reply("الرجاء ارسال بنر صوره او رابط..");
              const filter = (m) => m.author.id === interaction.user.id && (m.attachments.size > 0 || /^https?:\/\/\S+\.\S+/.test(m.content));
              const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
              
              if (response.size === 0) {
                return interaction.editReply("لا يوجد اي تعديلات.");
              }
              
              const bannerURL = response.first().attachments.size > 0 ? response.first().attachments.first().url : response.first().content;
              await client.user.setBanner(bannerURL);
              await interaction.editReply("تم تغير بنر البوت بنجاح ✅");
            } catch (e) {
              await interaction.editReply(`ERROR: ${e.message}`);
            }

            collector.stop();
          }

          if (interaction.customId == "restart") {
            try {
              await interaction.reply("**يتم اعادة تشغيل البوت ⏳**");
              await client.destroy();
              await client.login(process.env.TOKEN);
              await interaction.editReply("**تم اعاده تشغيل البوت بنجاح 🟢**.");
            } catch (e) {
              await interaction.editReply(`ERROR: ${e.message}`);
            }

            collector.stop();
          }




if (interaction.customId == "restart") {
  try {
    await interaction.reply("**⏳ جاري إعادة تشغيل البوت...** (قد يقطع الاتصال لحظياً)");

    await client.destroy();
    await client.login(token);

    await interaction.followUp("✅ تم إعادة تشغيل البوت بنجاح.");
  } catch (e) {
    console.error("خطأ في Restart:", e);
    await interaction.followUp(`❌ خطأ: ${e.message}`);
  }
  collector.stop();
}



if (interaction.customId == "avatar") {
  try {
    await interaction.reply("📸 الرجاء ارسال صورة أو رابط لتعيينها كآفاتار للبوت..");
    const filter = (m) =>
      m.author.id === interaction.user.id &&
      (m.attachments.size > 0 || /^https?:\/\/\S+\.\S+/.test(m.content));

    const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
    if (response.size === 0) {
      return interaction.editReply("❌ لم يتم استلام أي صورة.");
    }

    const url = response.first().attachments.size > 0
      ? response.first().attachments.first().url
      : response.first().content;

    await interaction.editReply("⏳ جاري تغيير صورة البوت... قد يقطع الاتصال لحظياً");
    await client.user.setAvatar(url);

    await interaction.followUp("✅ تم تغيير صورة البوت بنجاح.");
    await response.first().delete().catch(() => {});
  } catch (e) {
    console.error("خطأ في Avatar:", e);
    await interaction.followUp(`❌ خطأ: ${e.message}`);
  }
  collector.stop();
}


if (interaction.customId == "name") {
  try {
    await interaction.reply("✏️ الرجاء كتابة اسم جديد للبوت..");
    const filter = (m) => m.author.id === interaction.user.id;

    const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
    if (response.size === 0) {
      return interaction.editReply("❌ لم يتم استلام أي اسم جديد.");
    }

    const newName = response.first().content;

    await interaction.editReply("⏳ جاري تغيير اسم البوت... قد يقطع الاتصال لحظياً");
    await client.user.setUsername(newName);

    await interaction.followUp(`✅ تم تغيير اسم البوت إلى **${newName}** بنجاح.`);
  } catch (e) {
    console.error("خطأ في Name:", e);
    await interaction.followUp(`❌ خطأ: ${e.message}`);
  }
  collector.stop();
}

        });
      });
    }
  });
}

module.exports = { execute };
