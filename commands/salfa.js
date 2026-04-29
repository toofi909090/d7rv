const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextInputStyle, ModalBuilder, TextInputBuilder } = require("discord.js");
const { Canvas } = require("canvas-constructor/napi-rs");
const fs = require('fs');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners } = utils;
  const canvass = require("canvas-constructor/napi-rs");

  function sleep(time) {
    return new Promise((resolve) => setTimeout(() => resolve(time), time));
  }

  function getRnd(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "سالفة") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) return;

      const animals = ['نمل', 'نحل', 'ذباب', 'صرصور', 'عنكبوت', 'عقرب', 'تمساح', 'سحلية', 'ثعبان', 'افعى', 'سلحفاة', 'حمار', 'حمار وحشي', 'ثور', 'ذئب', 'حوت', 'جاموس', 'حصاب البحر', 'الديك الرومي', 'النمر', 'السنجاب', 'الحلزون', 'الكسلان', 'سمك القرش', 'قنفذ البحر', 'فرس البحر', 'سمك السردين', 'اسد', 'البقر', 'الغنم', 'سمك السلمون', 'الغراب', 'وحيد القرن', 'الباندا الأحمر', 'الغزال', 'الفأر', 'الراكون', 'الارنب', 'الخنزير', 'البطريق', 'الطاووس', 'الباندا', 'الببغاء', 'المحار', 'النعامة', 'البومة', 'الأخطبوط', 'السمندل', 'البعوض', 'القرد', 'خروف البحر', 'جراد', 'سرطان البحر', 'اللاما', 'الفهد', 'الكوالا', 'ظب', 'الثور البري', 'التنين', 'الكنغر', 'قنديل البحر', 'الضبع', 'الحصان', 'الصقر', 'الهامستر', 'النورس', 'خنزير البحر الهندي', 'الغوريلا', 'الماعز', 'الناموس', 'البط', 'الزرافة', 'الباندا العملاق', 'الغزال', 'الدجاج', 'الثعلب', 'الثور', 'العصفور', 'الفيل', 'النسر', 'الحمام', 'الدولفين', 'الديناصور', 'السلطعون', 'الكوبرا', 'الشمبانزي', 'اليرقة', 'القط', 'الجمل', 'الظب'];
     
      if (has_play.get(message.guild.id)) return message.reply({ content: `❌ هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      
      const storedTime = await dbq.get(`timerbra_${message.author.id}`) || 60000;
      let time = storedTime;
      let data = {
        start_in: Date.now() + time,
        type: "salfa"
      };
      const playerNumber = await dbq.get(`playersCountbra_${message.guild.id}`) || 20;

      let attachment;
      const image = `./imager/setimagebra_${message.guild.id}.png`;
      
      try {
        if (fs.existsSync(image)) {
          attachment = new AttachmentBuilder(image);
        } else {
          throw new Error('File not found');
        }
      } catch (error) {
        attachment = new AttachmentBuilder(`./photo/salfa.png`);
      }

      let participantsUser = [];
      let participantsInteraction = [];
      let CountdownTime = 60;
      let Players = [];
      let content_time = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`;
      let content_players1 = `**(${participantsUser.length} / ${playerNumber})**`;

      let button1 = new ButtonBuilder()
        .setCustomId(`joinGame`)
        .setLabel(`دخول`)
        .setEmoji('1243848352026591274')
        .setStyle(ButtonStyle.Secondary);
        
      let button2 = new ButtonBuilder()
        .setCustomId('leaveGame')
        .setLabel(`خروج`)
        .setEmoji('1243848354535047230')
        .setStyle(ButtonStyle.Secondary);
        
      let button3 = new ButtonBuilder()
        .setCustomId('explain')
        .setLabel(`الشرح`)
        .setEmoji('1254234763699687476')
        .setStyle(ButtonStyle.Secondary);
        
      const row = new ActionRowBuilder()
        .addComponents([button1, button2, button3]);

      let sended1 = `${content_time}\n${content_players1}`;
      let GameMessage = await message.channel.send({ 
        content: `${sended1}`, 
        files: [attachment], 
        components: [row] 
      });

      const collector = message.channel.createMessageComponentCollector({ time: time });

      collector.on('collect', async inter => {
        if (inter.customId == 'joinGame') {
          if (participantsUser.includes(`<@!${inter.user.id}>`)) {
            return await inter.reply({ content: `> **انت بالفعل داخل اللعبة**`, ephemeral: true });
          }

          if (participantsUser.length >= playerNumber) {
            return await inter.reply({ content: `> ** وصلت اللعبة للحد الأقصى من المشاركين**`, ephemeral: true });
          }
          
          participantsInteraction.push(inter);
          participantsUser.push(`<@!${inter.user.id}>`);

          let content_time2 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`;
          let content_players2 = `**(${participantsUser.length} / ${playerNumber})**`;

          GameMessage.edit({ content: `${content_time2}\n${content_players2}` });
          await inter.reply({ content: `✅ تم إضافتك للعبة بنجاح`, ephemeral: true });
          
        } else if (inter.customId == 'leaveGame') {
          if (!participantsUser.includes(`<@!${inter.user.id}>`)) {
            return await inter.reply({ content: `> **انت بالفعل خارج اللعبة**`, ephemeral: true });
          }
          
          participantsInteraction.splice(participantsUser.indexOf(`<@!${inter.user.id}>`), 1);
          participantsUser.splice(participantsUser.indexOf(`<@!${inter.user.id}>`), 1);

          let content_time3 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`;
          let content_players3 = `**(${participantsUser.length} / ${playerNumber})**`;

          GameMessage.edit({ content: `${content_time3}\n${content_players3}` });
          await inter.reply({ content: `✅ تم إزالتك من اللعبة`, ephemeral: true });
          
        } else if (inter.customId == 'explain') {
          inter.reply({
            content: `احزر السالفة
           شرح اللعبة:
           1 : البوت يرسل لجميع الاشخاص نفس الحيوان الا شخص واحد ( برا السالفة )
           2 : يجب عليكم المحافظة على الحيوان وعدم كشفه له لكي لا يفوز
           3 : عليكم بسؤال الاسئلة شي يخص الحيوان الذي ذكر وليس شي لايخصه
           4 : على البرا السالفة رؤية الاسئلة وان يحاول معرفة ما الحيوان لكي يفوز
           5 : على الداخل السالفة التصويت على ( برا السالفة ) عند معرفته
           6 : عندما يتم التصويت على البرا السالفة اختيار الحيوان الصحيح لكي يفوز بالجولة
           
           **🎮 المكافآت:**
           • إذا فاز "برا السالفة" = +3 نقاط عامة
           • إذا فاز "داخل السالفة" = +1 نقطة عامة لكل فائز`, 
            ephemeral: true
          });
        }
      });

      setTimeout(async () => {
        collector.stop();
        
        let row_2 = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('joinGame')
              .setLabel(`دخول`)
              .setEmoji('1243848352026591274')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('leaveGame')
              .setLabel(`خروج`)
              .setEmoji('1243848354535047230')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('explain')
              .setLabel(`الشرح`)
              .setEmoji('1254234763699687476')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
          
        let content_def5 = `**(${participantsUser.length} / ${playerNumber})**`;
        GameMessage.edit({ content: `${content_def5}`, components: [row_2] });

        if (participantsUser.length < 3) {
          GameMessage.edit({ components: [row_2] });
          message.channel.send('> **تم إيقاف اللعبة لعدم وجود`3` لاعبين على الأقل - ⛔.**');
          return;
        }
        
        const out = getRnd(0, participantsInteraction.length);
        const outUser = participantsInteraction[out].user.id;
        const animal = animals[getRnd(0, animals.length)];

        GameMessage.channel.send(`> **جاري تجهيز فقرة الأسئلة**`);
        await sleep(4000);
        
        for (let i = 0; i < participantsInteraction.length; i++) {
          if (participantsInteraction[i].user.id == outUser) {
            await participantsInteraction[i].followUp({ 
              content: '> **انت برا السالفة يجب عليك انت تحزر ماهي السالفة**', 
              ephemeral: true 
            });
            continue;
          }
          await participantsInteraction[i].followUp({ 
            content: `> **انت داخل السالفة : ${animal}**`, 
            ephemeral: true 
          });
        }
        
        game();
        
        async function game() {
          let FinishedAsking = [];
          for (let i = 0; i < participantsInteraction.length; i++) {
            Players.push(participantsInteraction[i].user.id);
          }
          ask();
          
          async function ask() {
            let Asked = [];
            if (Players.length <= 2) {
              return GameMessage.reply(`> **انتهت اللعبة بسبب وجود لاعبان فقط السالفة كانت ${animal} واللي برا السالفة كان <@!${outUser}>**`);
            }
            
            for (let i = 0; i < participantsInteraction.length; i++) {
              if (FinishedAsking.includes(participantsInteraction[i].user.id)) continue;
              let asker = participantsInteraction[i];
              let usersToAsk = [];
              for (let k = 0; k < participantsInteraction.length; k++) {
                if (participantsInteraction[k].user.id == participantsInteraction[i].user.id) continue;
                usersToAsk.push(participantsInteraction[k]);
              }
              let asked = usersToAsk[getRnd(0, usersToAsk.length)];
              Asked.push({ askerInter: asker, askedInter: asked });
            }
            
            if (Asked.length <= 0) {
              await GameMessage.reply(`> **انتهت فقرة الأسئلة جاري تحضير فقرة التصويت**`);
              return vote();
            }
            
            let rnd = getRnd(0, Asked.length);
            const askerInter = Asked[rnd].askerInter;
            const asker = askerInter.user.id;
            const askedInter = Asked[rnd].askedInter;
            const asked = askedInter.user.id;
            let AskingTime = Date.now();
            FinishedAsking.push(askerInter.user.id);
            Asked.splice(rnd, 1);

            let Abutton1 = new ButtonBuilder()
              .setCustomId(`Ask`)
              .setLabel('السؤال')
              .setStyle(ButtonStyle.Secondary);
              
            const row1 = new ActionRowBuilder()
              .addComponents([Abutton1]);

            let backgroundImage;
            const image = `./imager/qustingsdnr_${message.guild.id}.png`;
            try {
              backgroundImage = await canvass.loadImage(image);
            } catch (error) {
              backgroundImage = await canvass.loadImage(`./photo/salfa2.png`);
            }

            const askerMember = await message.guild.members.fetch(asker);
            const askedMember = await message.guild.members.fetch(asked);
            
            async function createCanvas() {
              const background = await canvass.loadImage(backgroundImage);
              const name = new Canvas(885, 260)
                .printImage(background, 0, 0, 885, 260)
                .printCircularImage(await canvass.loadImage((askerMember.user.avatarURL() + ``).replace(`.webp`, `.png`).replace(`.gif`, `.png`)), 721, 128, 98, 98)
                .printCircularImage(await canvass.loadImage((askedMember.user.avatarURL() + ``).replace(`.webp`, `.png`).replace(`.gif`, `.png`)), 162, 128, 98, 98)
                .pngAsync();

              return name;
            }

            let attachment = new AttachmentBuilder(await createCanvas(), {
              name: "Njm-Store.png"
            });

            const AskingM = await message.channel.send({ 
              content: `**<@!${asker}> اسأل <@!${asked}> \n الوقت : 1m**`, 
              files: [attachment], 
              components: [row1] 
            });

            const AskingTimeout = setTimeout(async () => {
              ButtonBuilder.from(Abutton1).setDisabled(true);
              AskingM.edit({ components: [row1] });
              participantsInteraction.splice(participantsInteraction.indexOf(askerInter, 1));
              participantsUser.splice(participantsUser.indexOf(`<@!${asker}>`, 1));
              Players.splice(participantsUser.indexOf(asker, 1));
              if (outUser == asker) {
                return message.channel.send(`> تم طرد <@!${asker}> من اللعبة لعدم تفاعله وكان هذا اللاعب برا السالفة`);
              }
              message.channel.send(`> **تم طرد <@!${asker}> من اللعبة لعدم تفاعله وكان هذا اللاعب داخل السالفة**`);
              message.channel.send(`> **جاري تحضير الجولة التالية من الأسئلة**`);
              await sleep(4000);
              ask();
            }, 35000);

            const filter = i => i.message.id === AskingM.id;
            const collector = message.channel.createMessageComponentCollector({ filter, time: 30000 });
            
            collector.on('collect', async inter => {
              if (inter.customId != 'Ask') return;
              if (inter.user.id != asker) {
                return await inter.reply({ content: `> أنت لست <@!${asker}>`, ephemeral: true });
              }
              
              const fields = {
                question: new TextInputBuilder()
                  .setCustomId(`question`)
                  .setLabel(`السؤال`)
                  .setStyle(TextInputStyle.Short)
                  .setMaxLength(250)
                  .setRequired(true)
                  .setPlaceholder(`أكتب السؤال هنا`),
              };
              
              const question_modal = new ModalBuilder()
                .setCustomId(`question_modal`)
                .setTitle(`question`)
                .setComponents(
                  new ActionRowBuilder().setComponents(fields.question),
                );
                
              await inter.showModal(question_modal);

              const submitted = await inter.awaitModalSubmit({
                time: 30000,
                filter: i => i.user.id === asker,
              }).catch(error => {
                console.error(error);
                return null;
              });

              if (submitted) {
                clearTimeout(AskingTimeout);
                ButtonBuilder.from(Abutton1).setDisabled(true);
                AskingM.edit({ components: [row1] });

                const [question] = Object.keys(fields).map(key => {
                  const field = fields[key].toJSON();
                  return submitted.fields.getTextInputValue(field.custom_id);
                });

                await submitted.reply({ 
                  content: `📝 **السؤال:** ${question}\n⏳ **في انتظار الإجابة من** <@!${asked}>`, 
                  ephemeral: false 
                });


                collector.stop();
                await sleep(4000);
                message.channel.send(`> **جاري تحضير الجولة التالية من الأسئلة**`);
                await sleep(4000);
                ask();
              }
            });
          }
        }
        
        async function vote() {

          let voteButtons = [];
          for (let i = 0; i < participantsInteraction.length; i++) {
            const player = participantsInteraction[i];
            voteButtons.push(
              new ButtonBuilder()
                .setCustomId(`vote_${player.user.id}`)
                .setLabel(player.user.displayName)
                .setStyle(ButtonStyle.Secondary)
            );
          }

          const voteRows = [];
          for (let i = 0; i < voteButtons.length; i += 4) {
            voteRows.push(new ActionRowBuilder().addComponents(voteButtons.slice(i, i + 4)));
          }

          const voteMessage = await message.channel.send({
            content: `🗳️ **حان وقت التصويت!**\nصوت على من تعتقد أنه **برا السالفة**\nلديكم 30 ثانية للتصويت!`,
            components: voteRows
          });

          let votes = {};
          const voters = [];

          const voteCollector = voteMessage.createMessageComponentCollector({ 
            filter: i => participantsInteraction.some(p => p.user.id === i.user.id),
            time: 30000 
          });

          voteCollector.on('collect', async inter => {
            if (voters.includes(inter.user.id)) {
              return inter.reply({ content: '❌ لقد صوتت بالفعل!', ephemeral: true });
            }

            const votedUserId = inter.customId.replace('vote_', '');
            voters.push(inter.user.id);
            
            if (!votes[votedUserId]) votes[votedUserId] = 0;
            votes[votedUserId]++;

            await inter.reply({ content: '✅ تم تسجيل صوتك!', ephemeral: true });
          });

          voteCollector.on('end', async () => {

            const disabledRows = voteRows.map(row => 
              new ActionRowBuilder().addComponents(
                row.components.map(button => ButtonBuilder.from(button).setDisabled(true))
              )
            );
            await voteMessage.edit({ components: disabledRows });


            const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
            
            if (sortedVotes.length === 0) {
              message.channel.send(`⏰ **انتهى وقت التصويت بدون أصوات!**\nالسالفة كانت: **${animal}**\nاللي برا السالفة كان: <@!${outUser}>`);
              return;
            }

            const mostVotedUserId = sortedVotes[0][0];
            const mostVotedUser = await client.users.fetch(mostVotedUserId);

            if (mostVotedUserId === outUser) {

              const winners = participantsInteraction.filter(p => p.user.id !== outUser);
              

              for (let winner of winners) {
                let generalPoints = await dbq.get(`points_${message.guild.id}.${winner.user.id}`) || 0;
                generalPoints += 1;
                await dbq.set(`points_${message.guild.id}.${winner.user.id}`, generalPoints);
              }

              message.channel.send({
                content: `🎉 **فاز الداخلين السالفة!**\n✅ تم التصويت على <@!${outUser}> بشكل صحيح!\n🐾 **السالفة كانت:** ${animal}\n🎮 **حصل كل فائز على نقطة عامة واحدة!**\n\n**الفائزون:** ${winners.map(w => `<@!${w.user.id}>`).join(', ')}`
              });
            } else {


              let generalPoints = await dbq.get(`points_${message.guild.id}.${outUser}`) || 0;
              generalPoints += 3;
              await dbq.set(`points_${message.guild.id}.${outUser}`, generalPoints);

              message.channel.send({
                content: `🎉 **فاز البرا السالفة!**\n❌ تم التصويت على <@!${mostVotedUser.id}> بالخطأ!\n🐾 **السالفة كانت:** ${animal}\n👑 **الفائز:** <@!${outUser}>\n🎮 **حصل على 3 نقاط عامة!**`
              });
            }
          });
        }
      }, time);
    }
  });
}

module.exports = { execute };
