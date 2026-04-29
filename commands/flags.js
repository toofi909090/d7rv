const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Canvas } = require("canvas-constructor/napi-rs");

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, isGameRunning, setGameRunning, times, setTimes } = utils;
  const canvass = require("canvas-constructor/napi-rs");

  client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;
    
    if (message.content.startsWith(prefix + `اعلام`)) {
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

      const file = require('../Games/flags.json');
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
          .setTextFont("bold 110px cairo")
          .setTextAlign("center")
          .printText(`اول من يكتب اسم العلم`, 1320, 250)
          .pngAsync();

        const question = new Canvas(2560, 1080)
          .printImage(await canvass.loadImage(await name), 0, 0, 2560, 1050)
          .setColor("#FFFFFF")
          .setTextFont("bold 120px cairo")
          .setTextAlign("center")
          .printImage(flagImage, 975, 400)
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

              const row_2 = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('points_button')
                    .setLabel(`🧩 ${userPoints}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
                );
              message.channel.send({ content: `:crown: - فاز ${winner} في اللعبة`, components: [row_2] });
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
