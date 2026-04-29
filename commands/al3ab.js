const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

function execute(client, dbq, has_play, config, utils) {
  const { prefix } = utils;

  client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;

    if (message.content.startsWith(prefix + 'العاب')) {
      const embed = new EmbedBuilder()
        .setAuthor({ 
          name: message.guild.name,
          iconURL: message.guild.iconURL({ dynamic: true })
        })
        .setThumbnail('https://i.ibb.co/sdDzS7TL/game.png')
        .setTitle("**🎮 Games Commands**")
        .addFields(
          {
            name: "`الألعاب الجماعية`",
            value: `
**${prefix}روليت
${prefix}مافيا
${prefix}سالفة 🆕
${prefix}بومب
${prefix}هايد
${prefix}اكس
${prefix}كراسي
${prefix}وصل
${prefix}اكمل/اضف 🆕
${prefix}نرد
${prefix}فخ/لغم
${prefix}زر
${prefix}حجره**
            `,
            inline: true
          },
          {
            name: "`الألعاب الفردية`",
            value: `
**${prefix}اسرع
${prefix}فكك
${prefix}ترتيب
${prefix}صحح
${prefix}اعكس
${prefix}حرف
${prefix}ادمج
${prefix}جمع
${prefix}ضرب
${prefix}طرح
${prefix}ترجمة
${prefix}مفرد
${prefix}عواصم
${prefix}شركه
${prefix}زر
${prefix}كت**
            `,
            inline: true
          },
          {
            name: "`أوامر أخرى`",
            value: `
**${prefix}توب
${prefix}توب [اسم العبة]
${prefix}نقاطي
${prefix}تحويل
${prefix}ايفنت
${prefix}تصويت
${prefix}المتجر
${prefix}ايقاف**
            `,
            inline: true
          }
        )
        .setColor("#ffffff");

      const button = new ButtonBuilder()
        .setLabel("Support")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:emo:1393774513183002767>")
        .setURL("https://discord.gg/Njjm");

      const row = new ActionRowBuilder().addComponents(button);

      await message.channel.send({
        embeds: [embed],
        components: [row]
      }).catch(console.error);
    }
  });
}

module.exports = { execute };
