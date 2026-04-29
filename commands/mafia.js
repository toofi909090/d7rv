const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, ms } = utils;

  function sleep(time) {
    return new Promise((resolve) => setTimeout(() => resolve(time), time));
  }

  function createButton(style, customId, label, emoji, disabled) {
    let styles = {
      PRIMARY: ButtonStyle.Primary,
      SECONDARY: ButtonStyle.Secondary,
      SUCCESS: ButtonStyle.Success,
      DANGER: ButtonStyle.Danger
    };
    let btn = new ButtonBuilder()
      .setStyle(styles[style])
      .setCustomId(customId)
      .setLabel(label)
      .setDisabled(disabled ? disabled : false);
    if (emoji) btn.setEmoji(emoji);
    return btn;
  }

  function createMultipleButtons(array, type) {
    let components = [];
    let c = 5;
    for (let i = 0; i < array.length; i += c) {
      let buttons = array.slice(i, i + c);
      let component = new ActionRowBuilder();
      for (let button of buttons) {
        let btn = new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel(button.label)
          .setCustomId(`${type}_${button.id}_${button.index}`)
          .setDisabled(button.disabled ? button.disabled : false);
        if (button.emoji) {
          btn.setEmoji(button.emoji);
        }
        component.addComponents(btn);
      }
      components.push(component);
    }
    return components;
  }

  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "مافيا") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) return;
      
      if (has_play.get(message.guild.id)) return message.reply({ content: `❌ هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      
      const storedTime = await dbq.get(`timeermafia_${message.author.id}`) || 60000;
      let time = storedTime;
      let data = {
        author: message.author.id,
        players: [],
        start_in: Date.now() + time,
        type: "mafia"
      };

      const playerNumber = await dbq.get(`playersmafia_${message.guild.id}`) || 20;

      let attachment;
      const image = `./imager/setimagemaf_${message.guild.id}.png`;
      
      try {
        if (fs.existsSync(image)) {
          attachment = new AttachmentBuilder(image);
        } else {
          throw new Error('File not found');
        }
      } catch (error) {
        attachment = new AttachmentBuilder(`./photo/mafiaphoto.png`);
      }

      let content_time1 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>`;
      let content_players1 = `(${data.players.length} / ${playerNumber})**`;

      let row = new ActionRowBuilder()
        .addComponents(
          createButton("SECONDARY", `join_mafia`, `دخول`, '1243848352026591274'),
          createButton(`SECONDARY`, `left_mafia`, `خروج`, '1243848354535047230'),
          createButton(`SECONDARY`, `explain`, `الشرح`, '1254234763699687476')
        );
        
      let row_2 = new ActionRowBuilder()
        .addComponents(
          createButton("SECONDARY", `join_mafia`, `دخول`, '1243848352026591274', true),
          createButton(`SECONDARY`, `left_mafia`, `خروج`, '1243848354535047230', true),
          createButton(`SECONDARY`, `explain`, `الشرح`, '1254234763699687476', true)
        );

      let msg = await message.channel.send({ 
        content: `${content_time1}\n${content_players1}`, 
        files: [attachment], 
        components: [row] 
      }).catch(() => 0);
      
      if (!msg) return;
      has_play.set(message.guild.id, data);
      let start_c = msg.createMessageComponentCollector({ time: time });

      start_c.on("collect", async inter => {
        if (!has_play.get(message.guild.id)) return;
        
        if (inter.customId === "join_mafia") {
          if (data.players.find(u => u.id == inter.user.id)) return inter.reply({ content: `لقد سجلت بالفعل.`, ephemeral: true });
          if (data.players.length >= playerNumber) return inter.reply({ content: `عدد المشاركين مكتمل`, ephemeral: true });
          
          data.players.push({
            id: inter.user.id,
            username: inter.user.username,
            avatar: inter.user.displayAvatarURL({ dynamic: true, format: "png" }),
            type: "person",
            interaction: inter,
            vote_kill: 0,
            vote_kick: 0
          });
          has_play.set(message.guild.id, data);

          let content_time2 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>`;
          let content_players2 = `(${data.players.length} / ${playerNumber})**`;

          msg.edit({ content: `${content_time2}\n${content_players2}` }).catch(() => 0);
          inter.reply({ content: `✅ تم إضافتك للعبة بنجاح`, ephemeral: true });
          
        } else if (inter.customId == "left_mafia") {
          let index = data.players.findIndex(i => i.id == inter.user.id);
          if (index == -1) return inter.reply({ content: `❌ - انت غير مشارك بالفعل`, ephemeral: true });
          data.players.splice(index, 1);
          has_play.set(message.guild.id, data);

          let content_time3 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>`;
          let content_players3 = `(${data.players.length} / ${playerNumber})**`;

          msg.edit({ content: `${content_time3}\n${content_players3}` }).catch(() => 0);
          inter.reply({ content: `✅ تم إزالتك من اللعبة`, ephemeral: true });
          
        } else if (inter.customId == "explain") {
          inter.reply({
            content: `
        **طريقة اللعب:**
        1- شارك في اللعبة بالضغط على الزر أدناه
        2- سيتم توزيع اللاعبين على مافيا ، مواطنين وأيضا طبيب واحد بشكل عشوائي
        3- في كل جولة ، ستصوت المافيا لطرد شخص واحد من اللعبة. ثم سيصوت الطبيب لحماية شخص واحد من المافيا. وفي النهاية الجولة ، سيحاول جميع اللاعبين التصويت وطرد إحدى أعضاء المافيا
        4- إذا تم طرد جميع المافيا ، سيفوز المواطنين ، وإذا كانت المافيا تساوي عدد المواطنين ، فستفوز المافيا.
        
        **🎮 المكافآت:**
        • الفوز = +2 نقطة عامة لكل فائز`, ephemeral: true
          });
        }
      });

      start_c.on("end", async (end, reason) => {
        if (!has_play.get(message.guild.id)) return;

        let content_players4 = `**(${data.players.length}/20)**`;
        msg.edit({ content: `${content_players4}`, components: [row_2] }).catch(() => 0);
        
        if (data.players.length < 2) {
          has_play.delete(message.guild.id);
          return message.channel.send({ content: "**تم إيقاف اللعبة لعدم وجود`5` لاعبين على الأقل - ⛔.**" });
        }


        let c = 5;
        for (let i = 0; i < data.players.length; i += c) {
          let array = data.players.slice(i, i + c);
          if (i == 0) {
            let mafia_i = Math.floor(Math.random() * array.length);
            let mafia = array[mafia_i];
            array.splice(mafia_i, 1);
            let mafia_index = data.players.findIndex(m => m.id == mafia.id);
            if (mafia_index != -1) {
              data.players[mafia_index].type = "mafia";
            }
            let doctor_i = Math.floor(Math.random() * array.length);
            let doctor = array[doctor_i];
            let doctor_index = data.players.findIndex(m => m.id == doctor.id);
            data.players[doctor_index].type = "doctor";
          } else {
            if (array.length >= 5) {
              let mafia_i = Math.floor(Math.random() * array.length);
              let mafia = array[mafia_i];
              let mafia_index = data.players.findIndex(m => m.id == mafia.id);
              if (mafia_index != -1) {
                data.players[mafia_index].type = "mafia";
              }
            }
          }
        }
        has_play.set(message.guild.id, data);


        for (let player of data.players) {
          if (player.type == "person") {
            await player.interaction.followUp({ 
              content: `👥 | تم اختيارك انت كـ **مواطن**. في كل جولة يجب عليك التحقق مع جميع اللاعبين لأكتشاف المافيا وطردهم من اللعبة`, 
              ephemeral: true 
            }).catch(() => 0);
          } else if (player.type == "doctor") {
            await player.interaction.followUp({ 
              content: `🧑‍⚕️ | تم اختيارك انت كـ **الطبيب**. في كل جولة يمكنك حماية شخص واحد من هجوم المافيا`, 
              ephemeral: true 
            }).catch(() => 0);
          } else if (player.type == "mafia") {
            await player.interaction.followUp({ 
              content: `🕵️ | تم اختيارك انت  كـ **مافيا**. يجب عليكم محاولة اغتيال جميع اللاعبين بدون اكتشافكم`, 
              ephemeral: true 
            }).catch(() => 0);
          }
        }


        let backgroundImage;
        const image = `./imager/setmafiamem_${message.guild.id}.png`;
        try {
          backgroundImage = await loadImage(image);
        } catch (error) {
          backgroundImage = await loadImage(`./photo/layer.png`);
        }

        const canvas = createCanvas(720, 473);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(backgroundImage, 0, 0, 720, 473);


        const mafiaImage = await loadImage('./photo/mafia.png');
        const doctorImage = await loadImage('./photo/doctor.png');
        const citizenImage = await loadImage('./photo/citizen.png');


        const numMafia = data.players.filter(p => p.type === "mafia").length;
        const numDoctors = data.players.filter(p => p.type === "doctor").length;
        const numCitizens = data.players.filter(p => p.type === "person").length;


        ctx.font = 'bold 40px cairo';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        ctx.fillText('المواطنين', canvas.width - 120, 75);


        const citizensStartX = canvas.width - 120;
        const citizensStartY = 100;
        const doctorsStartX = citizensStartX - (numCitizens * 55) - 20;
        const doctorsStartY = citizensStartY;

        for (let i = 0; i < numCitizens; i++) {
          const x = citizensStartX - (i * 55);
          const y = citizensStartY;
          ctx.drawImage(citizenImage, x, y, 50, 50);
        }

        for (let i = 0; i < numDoctors; i++) {
          const x = doctorsStartX - (i * 70);
          const y = doctorsStartY;
          ctx.drawImage(doctorImage, x, y, 65, 65);
        }

        ctx.font = 'bold 40px cairo';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('المافيا', 120, 75);

        const mafiaStartX = 50;
        const mafiaStartY = 100;
        for (let i = 0; i < numMafia; i++) {
          const x = mafiaStartX + (i * 80);
          const y = mafiaStartY;
          ctx.drawImage(mafiaImage, x, y, 75, 75);
        }

        const attachment2 = new AttachmentBuilder(canvas.toBuffer(), { 
          name: 'Njm-Store.png' 
        });
        message.channel.send({ files: [attachment2] });
        await sleep(7000);
        await mafia(message);
      });

      async function mafia(message) {
        if (!message || !message.guild) return;
        let data = has_play.get(message.guild.id);
        if (!data) return;
        
        let mafia = data.players.filter(t => t.type == "mafia");
        let doctor = data.players.find(t => t.type == "doctor");
        let person = data.players.filter(t => t.type != "mafia");
        let person_buttons = createMultipleButtons(person.map((p) => ({ 
          id: p.id, 
          label: p.username, 
          disabled: false, 
          index: person.findIndex(u => u.id == p.id) 
        })), "kill");

        for (let m of mafia) {
          await m.interaction.followUp({ 
            content: `أمامك 20 ثانية للتصويت على مواطن ليتم قتله`, 
            components: person_buttons, 
            ephemeral: true 
          }).catch(() => 0);
        }
        
        message.channel.send({ content: `🔪 | جاري انتظار المافيا لاختيار شخص لقتله...` });
        let kill_c = message.channel.createMessageComponentCollector({ 
          filter: m => mafia.find(n => n.id == m.user.id) && m.customId.startsWith("kill"), 
          time: 20000 
        });
        
        let collected = [];
        kill_c.on("collect", async inter => {
          if (!has_play.get(message.guild.id)) return;
          if (collected.find(i => i == inter.user.id)) return;
          collected.push(inter.user.id);
          await inter.update({ content: `تم التصويت بنجاح انتظر النتيجة`, components: [] }).catch(() => 0);
          let index = inter.customId.split("_")[2];
          person[index].vote_kill += 1;
          if (collected.length >= mafia.length) return kill_c.stop();
        });

        kill_c.on("end", async (end, reason) => {
          if (!has_play.get(message.guild.id)) return;
          person = person.sort((a, b) => b.vote_kill - a.vote_kill);
          
          for (let maf of mafia) {
            if (!collected.find(i => i == maf.id)) {
              let index = mafia.findIndex(m => m.id == maf.id);
              if (index != -1) {
                mafia.splice(index, 1);
                if (mafia.length >= 1) {
                  let index_1 = data.players.findIndex(m => m.id == maf.id);
                  if (index_1 != -1) {
                    data.players.splice(index_1, 1);
                    has_play.set(message.guild.id, data);
                  }
                  message.channel.send({ content: `🕐 | تم طرد <@${maf.id}> من المافيا لعدم تفاعله... ستبدأ الجولة التالية في غضون ثوانٍ قليلة` });
                  await sleep(7000);
                  restart(message);
                } else {
                  message.channel.send({ content: `🕐 | تم طرد <@${maf.id}> من المافيا لعدم تفاعله...` });
                  win(message, "person");
                }
                return;
              }
            }
          }
          
          let killed_person = person[0];
          message.channel.send({ content: `🔪 | اختارت المافيا الشخص الذي سيتم اغتياله` });
          await sleep(7000);
          
          let id = null;
          if (doctor) {
            message.channel.send({ content: `💊 | جاري انتظار الطبيب لاختيار شخص لحمايته...` });
            let all_buttons = createMultipleButtons(data.players.map((p) => ({ 
              id: p.id, 
              label: p.username, 
              disabled: false, 
              index: data.players.findIndex(u => u.id == p.id) 
            })), "protect");
            
            await doctor.interaction.followUp({ 
              content: `أمامك **20** ثانية لاختيار شخص لحمايته...`, 
              components: all_buttons, 
              ephemeral: true, 
              fetchReply: true 
            }).catch(() => 0);

            let doctor_collect = await message.channel.awaitMessageComponent({ 
              filter: m => m.user.id == doctor.id && m.customId.startsWith("protect"), 
              time: 20000 
            }).catch(() => 0);
            
            if (!doctor_collect || !doctor_collect.customId) {
              message.channel.send({ content: `💊 | لم يختر الطبيب أحد ليحميه من الإغتيال` });
            } else {
              message.channel.send({ content: `💊 | اختار الطبيب الشخص الذي سيحميه من اغتيال المافيا` });
            }
            id = doctor_collect ? doctor_collect.customId.split("_")[1] : null;
          }
          
          if (id == killed_person.id) {
            message.channel.send({ content: `🛡️ | فشلت عملية المافيا لقتل <@${killed_person.id}> لأنه تم حمايته من قبل الطبيب` });
          } else {
            let index_2 = data.players.findIndex(b => b.id == killed_person.id);
            if (index_2 != -1) {
              data.players.splice(index_2, 1);
              has_play.set(message.guild.id, data);
            }
            await message.channel.send({ content: `⚰️ | نجحت عملية المافيا وتم قتل <@${killed_person.id}> وهذا الشخص كان **${killed_person.type == "doctor" ? "طبيب" : "مواطن"}**` });
          }
          
          if (data.players.filter(b => b.type == "person").length <= data.players.filter(b => b.type == "mafia").length) return win(message, "mafia");
          
          message.channel.send({ content: `🔍 | لديكم **15 ثانية** للتحقق بين اللاعبين ومعرفة المافيا للتصويت على طرده من اللعبة` });

          let all = data.players.map(m => m);
          let all_buttons = createMultipleButtons(all.map((p) => ({ 
            id: p.id, 
            label: p.username, 
            disabled: false, 
            emoji: config.numbers[p.vote_kick], 
            index: data.players.findIndex(u => u.id == p.id) 
          })), "kick");
          
          let msg = await message.channel.send({ 
            content: `لديكم **20 ثانية** لاختيار شخص لطرده من اللعبة`, 
            components: all_buttons 
          });
          
          let kick_c = msg.createMessageComponentCollector({
            filter: n => {
              let player = data.players.find(m => m.id == n.user.id);
              if (!player) return false;
              if (player.type === "mafia" || player.type === "person" || player.type === "doctor") {
                return n.customId.startsWith("kick");
              }
              return false;
            },
            time: 20000
          });
          
          let collected_1 = [];
          kick_c.on("collect", async inter => {
            if (!has_play.get(message.guild.id)) return;
            if (collected_1.find(i => i == inter.user.id)) return;
            collected_1.push(inter.user.id);
            let user_id = inter.customId.split("_")[1];
            let index = all.findIndex(i => i.id == user_id);
            if (index != -1) {
              all[index].vote_kick += 1;
              let all_buttons_2 = createMultipleButtons(all.map((p) => ({ 
                id: p.id, 
                label: p.username, 
                disabled: false, 
                emoji: config.numbers[p.vote_kick], 
                index: data.players.findIndex(u => u.id == p.id) 
              })), "kick");
              msg.edit({ components: all_buttons_2 }).catch(() => 0);
            }
            inter.deferUpdate().catch(() => 0);
            if (collected_1.length >= all.length) return kick_c.stop();
          });
          
          kick_c.on("end", async (end, reason) => {
            if (!has_play.get(message.guild.id)) return;
            let all_buttons_2 = createMultipleButtons(all.map((p) => ({ 
              id: p.id, 
              label: p.username, 
              disabled: true, 
              emoji: config.numbers[p.vote_kick], 
              index: data.players.findIndex(u => u.id == p.id) 
            })), "kick");
            msg.edit({ components: all_buttons_2 }).catch(() => 0);
            
            let choices = all.sort((a, b) => b.vote_kick - a.vote_kick);
            if (choices[0].vote_kick == choices[1].vote_kick) {
              message.channel.send({ content: `⏭ | بسبب تعادل التصويت ، تم تخطي الطرد ... الجولة القادمة ستبدأ في بضع ثوان` });
              await sleep(7000);
              await restart(message);
            } else {
              let kicked = choices[0];
              let index = data.players.findIndex(i => i.id == kicked.id);
              if (index != -1) {
                data.players.splice(index, 1);
                has_play.set(message.guild.id, data);
              }
              message.channel.send({ content: `💣 | تم التصويت على طرد <@${kicked.id}> وكان هذا الشخص **${kicked.type == "mafia" ? "مافيا" : kicked.type == "doctor" ? "طبيب" : "مواطن"}**` });
              if (data.players.filter(b => b.type == "person").length <= data.players.filter(b => b.type == "mafia").length) return win(message, "mafia");
              if (data.players.filter(b => b.type == "mafia").length <= 0) return win(message, "person");
              message.channel.send({ content: `ستبدأ الجولة التالية بعد بضع ثوان...` });
              await sleep(7000);
              restart(message);
            }
          });
        });
      }

      function restart(message) {
        let data = has_play.get(message.guild.id);
        if (!data) return;

        for (let player of data.players) {
          player.vote_kill = 0;
          player.vote_kick = 0;
        }

        mafia(message);
      }

      async function win(message, who) {
        let data = has_play.get(message.guild.id);
        if (!data) return;
        
        if (who === "person") {
          const winners = data.players.filter(m => m.type != "mafia");
          

          for (let winner of winners) {
            let generalPoints = await dbq.get(`points_${message.guild.id}.${winner.id}`) || 0;
            generalPoints += 2;
            await dbq.set(`points_${message.guild.id}.${winner.id}`, generalPoints);
          }
          
          message.channel.send({ 
            content: `👑 |فاز الفريق الأول (المواطنين) في اللعبة \n${winners.map(b => `<@${b.id}>`).join(", ")}` 
          });
        } else if (who === "mafia") {
          const winners = data.players.filter(m => m.type == "mafia");
          

          for (let winner of winners) {
            let generalPoints = await dbq.get(`points_${message.guild.id}.${winner.id}`) || 0;
            generalPoints += 2;
            await dbq.set(`points_${message.guild.id}.${winner.id}`, generalPoints);
          }
          
          message.channel.send({ 
            content: `👑 |فاز الفريق الثاني (المافيا) في اللعبة \n${winners.map(b => `<@${b.id}>`).join(", ")}` 
          });
        }
        has_play.delete(message.guild.id);
      }
    }
  });
}

module.exports = { execute };
