const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function execute(client, dbq, has_play, config, utils) {

  const { prefix, owners } = utils;


  const voteData = new Map();


  const games = [
    { label: "🎮 روليت", value: "roulette", command: "روليت" },
    { label: "🎮 مافيا", value: "mafia", command: "مافيا" },
    { label: "🎮 بومب", value: "bomb", command: "بومب" },
    { label: "🎮 فخ", value: "trap", command: "فخ" },
    { label: "🎮 هايد", value: "hide", command: "هايد" },
    { label: "🎮 حجره", value: "rps", command: "حجره" },
    { label: "🎮 سالفة", value: "salfa", command: "سالفة" },
    { label: "🎮 كراسي", value: "chairs", command: "كراسي" },
    { label: "🎮 وصل", value: "wasl", command: "وصل" },
    { label: "🎮 نرد", value: "dice", command: "نرد" }
  ];


  async function startGame(originalMessage, gameCommand) {
    try {
      const fakeMessage = {
        ...originalMessage,
        content: `${prefix}${gameCommand}`,
        author: originalMessage.author,
        member: originalMessage.member,
        guild: originalMessage.guild,
        channel: originalMessage.channel,
        createdTimestamp: Date.now(),
        id: originalMessage.id + '_auto'
      };

      client.emit('messageCreate', fakeMessage);
      return true;
    } catch (error) {
      console.error(`خطأ في تشغيل ${gameCommand}:`, error);
      return false;
    }
  }


  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;

    if (message.content === prefix + 'تصويت') {
      const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) return;


      const existingVote = voteData.get(message.guild.id);
      if (existingVote && existingVote.active) {
        return message.reply("❌ يوجد تصويت نشط! انتظر حتى انتهائه.");
      }

      if (has_play.get(message.guild.id)) {
        return message.reply("❌ يوجد لعبة نشطة! انتظر حتى انتهائها.");
      }


      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("vote_select")
        .setPlaceholder("اختر اللعبة التي تريد التصويت لها")
        .addOptions(games);

      const row = new ActionRowBuilder().addComponents(selectMenu);


      const voteEmbed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("**Game Vote**")
        .addFields({
          name: "🎮 الألعاب والأصوات",
          value: games.map(game => `${game.label} **:** 0`).join('\n'),
          inline: false
        })
        .addFields({
          name: "📊 إجمالي الأصوات",
          value: "0",
          inline: true
        })
        .addFields({
          name: "⏰ ينتهي التصويت",
          value: `<t:${Math.floor(Date.now() / 1000) + 60}:R>`,
          inline: true
        })
        .setThumbnail(message.guild.iconURL({ dynamic: true, size: 512 }) || null)
        .setTimestamp();

      const voteMessage = await message.channel.send({
        embeds: [voteEmbed],
        components: [row]
      });


      const voteSession = {
        messageId: voteMessage.id,
        channelId: message.channel.id,
        votes: new Map(),
        voters: new Set(),
        active: true,
        startTime: Date.now(),
        endTime: Math.floor(Date.now() / 1000) + 60, 
        originalMessage: message
      };

      voteData.set(message.guild.id, voteSession);


      setTimeout(async () => {
        await endVoting(message.guild.id, voteMessage);
      }, 60000);
    }
  });


  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'vote_select') return;

    const voteSession = voteData.get(interaction.guild.id);
    if (!voteSession || !voteSession.active) {
      return interaction.reply({ content: "❌ التصويت غير نشط.", ephemeral: true });
    }

    if (voteSession.voters.has(interaction.user.id)) {
      return interaction.reply({ content: "❌ لقد صوتت بالفعل!", ephemeral: true });
    }

    const selectedGame = interaction.values[0];
    const game = games.find(g => g.value === selectedGame);

    voteSession.voters.add(interaction.user.id);
    const currentVotes = voteSession.votes.get(selectedGame) || 0;
    voteSession.votes.set(selectedGame, currentVotes + 1);

    await updateVoteEmbed(interaction, voteSession);

    return interaction.reply({
      content: `✅ تم تسجيل صوتك لـ **${game.label}**`,
      ephemeral: true
    });
  });


  async function updateVoteEmbed(interaction, voteSession) {
    const gamesList = games.map(game => {
      const votes = voteSession.votes.get(game.value) || 0;
      let icon = "";
      if (votes > 0) {
        const allVotes = Array.from(voteSession.votes.values()).sort((a, b) => b - a);
        const rank = allVotes.findIndex(v => v === votes) + 1;
        if (rank === 1 && votes === Math.max(...allVotes)) icon = "🥇";
        else if (rank <= 2) icon = "🥈";
        else if (rank <= 3) icon = "🥉";
        else icon = "🔥";
      }
      return `${icon} ${game.label} **:** ${votes}`;
    }).join('\n');

    const updatedEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("**Game Vote**")
      .addFields({
        name: "🎮 الألعاب والأصوات",
        value: gamesList,
        inline: false
      })
      .addFields({
        name: "📊 إجمالي الأصوات",
        value: `${voteSession.voters.size}`,
        inline: true
      })
      .addFields({
        name: "⏰ ينتهي التصويت",
        value: `<t:${voteSession.endTime}:R>`,
        inline: true
      })
      .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 512 }) || null)
      .setTimestamp();

    try {
      await interaction.message.edit({ embeds: [updatedEmbed] });
    } catch (error) {
      console.error('خطأ في تحديث الإمبيد:', error);
    }
  }


  async function endVoting(guildId, voteMessage) {
    const voteSession = voteData.get(guildId);
    if (!voteSession || !voteSession.active) return;

    voteSession.active = false;

    if (voteSession.votes.size === 0) {
      const noVotesEmbed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setTitle("❌ انتهى التصويت")
        .setDescription("**لم يصوت أي شخص!**")
        .setTimestamp();

      await voteMessage.edit({ embeds: [noVotesEmbed], components: [] });
      voteData.delete(guildId);
      return;
    }

    const sortedVotes = Array.from(voteSession.votes.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const [winningGame, winningVotes] = sortedVotes[0];
    const game = games.find(g => g.value === winningGame);

    const startButton = new ButtonBuilder()
      .setCustomId(`start_${winningGame}`)
      .setLabel("🚀 بدء اللعبة")
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId(`cancel_game`)
      .setLabel("❌ إلغاء")
      .setStyle(ButtonStyle.Danger);

    const buttonRow = new ActionRowBuilder().addComponents(startButton, cancelButton);

    const resultEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🏆 نتيجة التصويت")
      .setDescription(`**${game.label}** فازت بالتصويت!`)
      .addFields({
        name: "📊 النتائج النهائية",
        value: sortedVotes.map(([gameValue, votes], index) => {
          const gameData = games.find(g => g.value === gameValue);
          const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅";
          return `${medal} ${gameData.label} - **${votes}** ${votes === 1 ? 'صوت' : 'أصوات'}`;
        }).join('\n'),
        inline: false
      })
      .addFields({
        name: "🎮 اللعبة المختارة",
        value: `ستبدأ **${game.label}** عند الضغط على زر البدء`,
        inline: false
      })
      .setFooter({ text: `إجمالي المشاركين: ${voteSession.voters.size}` })
      .setTimestamp();

    await voteMessage.edit({ 
      embeds: [resultEmbed], 
      components: [buttonRow] 
    });

    const buttonCollector = voteMessage.createMessageComponentCollector({ 
      time: 300000
    });

    buttonCollector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.customId === `start_${winningGame}`) {
        const startedEmbed = new EmbedBuilder()
          .setColor("#FFFFFF")
          .setTitle("🎮 تم بدء اللعبة!")
          .setDescription(`**${game.label}** تبدأ الآن...`)
          .setTimestamp();

        await buttonInteraction.update({ 
          embeds: [startedEmbed], 
          components: [] 
        });

        setTimeout(async () => {
          const success = await startGame(voteSession.originalMessage, game.command);
          if (success) {
            await buttonInteraction.followUp(`✅ تم بدء **${game.label}** بنجاح!`);
          } else {
            await buttonInteraction.followUp(`❌ حدث خطأ في بدء **${game.label}**`);
          }
        }, 3000);

      } else if (buttonInteraction.customId === 'cancel_game') {
        const cancelEmbed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("❌ تم الإلغاء")
          .setDescription("تم إلغاء بدء اللعبة.")
          .setTimestamp();

        await buttonInteraction.update({ 
          embeds: [cancelEmbed], 
          components: [] 
        });
      }

      buttonCollector.stop();
    });

    buttonCollector.on('end', () => {
      voteData.delete(guildId);
    });
  }


  voteData.clear();
}

module.exports = { execute };
