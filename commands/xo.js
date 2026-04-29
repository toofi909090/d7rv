/**
 * ملف أمر XO المستقل
 * مسار الملف: commands/xo.js
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");


const activeXOGames = new Map();

/**
 * كلاس إدارة لعبة XO
 */
class XOGameManager {
  constructor(gameId, player1, player2 = null, isAI = false) {
    this.gameId = gameId;
    this.player1 = player1;
    this.player2 = player2;
    this.isAI = isAI;
    this.currentTurn = player1.id;
    this.board = Array(9).fill(null);
    this.gameOver = false;
    this.winner = null;
    this.player1Symbol = '❌';
    this.player2Symbol = '⭕';
  }

  /**
   * تنفيذ حركة اللاعب
   */
  makeMove(playerId, position) {
    if (this.gameOver || this.board[position] !== null) return false;
    if (this.currentTurn !== playerId) return false;

    const symbol = playerId === this.player1.id ? this.player1Symbol : this.player2Symbol;
    this.board[position] = symbol;

    if (this.checkWin()) {
      this.gameOver = true;
      this.winner = playerId;
    } else if (this.board.every(cell => cell !== null)) {
      this.gameOver = true;
      this.winner = 'tie';
    } else {
      this.currentTurn = this.currentTurn === this.player1.id ? 
        (this.isAI ? 'ai' : this.player2.id) : this.player1.id;
    }

    return true;
  }

  /**
   * حركة الذكاء الاصطناعي
   */
  makeAIMove() {
    if (this.gameOver || !this.isAI || this.currentTurn !== 'ai') return false;

    let bestMove = this.findBestMove();
    
    if (bestMove !== -1) {
      this.board[bestMove] = this.player2Symbol;
      
      if (this.checkWin()) {
        this.gameOver = true;
        this.winner = 'ai';
      } else if (this.board.every(cell => cell !== null)) {
        this.gameOver = true;
        this.winner = 'tie';
      } else {
        this.currentTurn = this.player1.id;
      }
    }

    return true;
  }

  /**
   * خوارزمية الذكاء الاصطناعي
   */
  findBestMove() {

    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = this.player2Symbol;
        if (this.checkWin()) {
          this.board[i] = null;
          return i;
        }
        this.board[i] = null;
      }
    }


    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = this.player1Symbol;
        if (this.checkWin()) {
          this.board[i] = null;
          return i;
        }
        this.board[i] = null;
      }
    }


    if (this.board[4] === null) return 4;


    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => this.board[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }


    const available = this.board.map((cell, index) => cell === null ? index : null)
                               .filter(val => val !== null);
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : -1;
  }

  /**
   * فحص حالة الفوز
   */
  checkWin() {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    return winPatterns.some(pattern => {
      const [a, b, c] = pattern;
      return this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c];
    });
  }

  /**
   * إنشاء أزرار اللعبة
   */
  createGameButtons() {
    const rows = [];
    for (let i = 0; i < 3; i++) {
      const row = new ActionRowBuilder();
      for (let j = 0; j < 3; j++) {
        const position = i * 3 + j;
        const symbol = this.board[position] || '⬜';
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`xo_move_${this.gameId}_${position}`)
            .setLabel(symbol)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(this.board[position] !== null || this.gameOver)
        );
      }
      rows.push(row);
    }
    return rows;
  }

  /**
   * إنشاء رسالة اللعبة
   */
  createGameEmbed() {
    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTimestamp();

    if (this.gameOver) {
      if (this.winner === 'tie') {
        embed.setTitle('🤝 انتهت اللعبة - تعادل!')
          .setDescription('لا يوجد فائز في هذه المباراة');
      } else if (this.winner === 'ai') {
        embed.setTitle('🤖 فاز الذكاء الاصطناعي!')
          .setDescription(`${this.player1.username} خسر المباراة`);
      } else {
        const winnerUser = this.winner === this.player1.id ? this.player1 : this.player2;
        embed.setTitle('🎉 انتهت اللعبة!')
          .setDescription(`🏆 الفائز: ${winnerUser.username}`);
      }
    } else {
      const currentPlayer = this.currentTurn === this.player1.id ? this.player1 : 
                           (this.isAI ? { username: 'الذكاء الاصطناعي' } : this.player2);
      embed.setTitle('🎮 لعبة XO')
        .setDescription(`🎯 دور: ${currentPlayer.username}\n${this.isAI ? '🤖 وضع: ضد الذكاء الاصطناعي' : '👥 وضع: لاعبين'}`);
    }

    return embed;
  }
}

/**
 * دالة التنفيذ الرئيسية
 */
function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners } = utils;


  client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;

    const content = message.content.toLowerCase();
    if (content === prefix + 'xo' || content === prefix + 'uxo' || content === prefix + 'اكس') {
      const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) return;


      const existingGame = Array.from(activeXOGames.values())
        .find(game => game.player1.id === message.author.id || 
                     (game.player2 && game.player2.id === message.author.id));
      
      if (existingGame) {
        return message.reply('❌ أنت تلعب لعبة XO بالفعل! اكمل لعبتك الحالية أولاً.');
      }


      const embed = new EmbedBuilder()
        .setTitle('🎮 لعبة XO - اختر وضع اللعب')
        .setDescription('**اختر كيف تريد أن تلعب:**')
        .setColor('#FFFFFF')
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'اختر الوضع المناسب لك!' });

      const pvpButton = new ButtonBuilder()
        .setCustomId(`xo_pvp_${message.author.id}`)
        .setLabel('👥 لعب ضد شخص')
        .setStyle(ButtonStyle.Secondary);

      const aiButton = new ButtonBuilder()
        .setCustomId(`xo_ai_${message.author.id}`)
        .setLabel('🤖 لعب ضد ذكاء اصطناعي')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(pvpButton, aiButton);

      await message.channel.send({ embeds: [embed], components: [row] });
    }
  });


  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const { customId, user, guild, channel } = interaction;


    if (customId.startsWith('xo_pvp_')) {
      const playerId = customId.split('_')[2];
      if (user.id !== playerId) {
        return interaction.reply({ content: '❌ هذه ليست لعبتك!', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('👥 لعب ضد شخص')
        .setDescription('**منشن الشخص الذي تريد أن تلعب ضده:**\n`مثال: @username`')
        .setColor('#FFFFFF')
        .setFooter({ text: 'لديك 30 ثانية لمنشن اللاعب!' });

      await interaction.update({ embeds: [embed], components: [] });

      const filter = m => m.author.id === user.id && m.mentions.users.size > 0;
      const collector = channel.createMessageCollector({ filter, time: 30000, max: 1 });

      collector.on('collect', async mentionMessage => {
        const mentionedUser = mentionMessage.mentions.users.first();
        
        if (mentionedUser.bot) {
          return mentionMessage.reply('❌ لا يمكنك اللعب ضد البوتات!');
        }
        
        if (mentionedUser.id === user.id) {
          return mentionMessage.reply('❌ لا يمكنك اللعب ضد نفسك!');
        }

        const existingGame = Array.from(activeXOGames.values())
          .find(game => game.player1.id === mentionedUser.id || 
                       (game.player2 && game.player2.id === mentionedUser.id));
        
        if (existingGame) {
          return mentionMessage.reply('❌ اللاعب المذكور يلعب لعبة XO بالفعل!');
        }

        const challengeEmbed = new EmbedBuilder()
          .setTitle('🎯 تحدي XO')
          .setDescription(`**${mentionedUser.username}** تم تحديك من قبل **${user.username}**\n**هل تقبل التحدي؟**`)
          .setColor('#FFFFFF')
          .setThumbnail(mentionedUser.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: 'لديك 60 ثانية للرد!' });

        const acceptButton = new ButtonBuilder()
          .setCustomId(`xo_accept_${user.id}_${mentionedUser.id}`)
          .setLabel('✅ قبول')
          .setStyle(ButtonStyle.Success);

        const declineButton = new ButtonBuilder()
          .setCustomId(`xo_decline_${user.id}_${mentionedUser.id}`)
          .setLabel('❌ رفض')
          .setStyle(ButtonStyle.Danger);

        const challengeRow = new ActionRowBuilder().addComponents(acceptButton, declineButton);
        
        await mentionMessage.channel.send({ 
          content: `${mentionedUser}`, 
          embeds: [challengeEmbed], 
          components: [challengeRow] 
        });
        
        mentionMessage.delete().catch(() => {});
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          channel.send(`⏰ ${user} انتهت مهلة منشن اللاعب!`);
        }
      });
    }


    else if (customId.startsWith('xo_ai_')) {
      const playerId = customId.split('_')[2];
      if (user.id !== playerId) {
        return interaction.reply({ content: '❌ هذه ليست لعبتك!', ephemeral: true });
      }

      const gameId = `ai_${user.id}_${Date.now()}`;
      const game = new XOGameManager(gameId, user, null, true);
      activeXOGames.set(gameId, game);

      const embed = game.createGameEmbed();
      const buttons = game.createGameButtons();

      await interaction.update({ embeds: [embed], components: buttons });
    }


    else if (customId.startsWith('xo_accept_') || customId.startsWith('xo_decline_')) {
      const parts = customId.split('_');
      const action = parts[1];
      const challengerId = parts[2];
      const challengedId = parts[3];

      if (user.id !== challengedId) {
        return interaction.reply({ content: '❌ هذا التحدي ليس لك!', ephemeral: true });
      }

      if (action === 'decline') {
        const declineEmbed = new EmbedBuilder()
          .setTitle('❌ تم رفض التحدي')
          .setDescription(`**${user.username}** رفض تحدي **${interaction.guild.members.cache.get(challengerId)?.user.username}**`)
          .setColor('#ff0000');

        await interaction.update({ embeds: [declineEmbed], components: [] });
      } else {
        const challenger = interaction.guild.members.cache.get(challengerId)?.user;
        const gameId = `pvp_${challengerId}_${challengedId}_${Date.now()}`;
        const game = new XOGameManager(gameId, challenger, user, false);
        activeXOGames.set(gameId, game);

        const embed = game.createGameEmbed();
        const buttons = game.createGameButtons();

        await interaction.update({ embeds: [embed], components: buttons });
      }
    }


    else if (customId.startsWith('xo_move_')) {
  const matches = customId.match(/^xo_move_(.+)_(\d)$/);
  if (!matches) {
    return interaction.reply({ content: '❌ معرف الزر غير صالح!', ephemeral: true });
  }

  const gameId = matches[1];
  const position = parseInt(matches[2]);
  const game = activeXOGames.get(gameId);

  if (!game) {
    return interaction.reply({ content: '❌ لعبة غير موجودة!', ephemeral: true });
  }

  if (game.currentTurn !== user.id) {
    return interaction.reply({ content: '❌ ليس دورك!', ephemeral: true });
  }

  if (!game.makeMove(user.id, position)) {
  return interaction.reply({ content: '❌ حركة غير صالحة!', ephemeral: true });
}


if (!global.xoTimeouts) global.xoTimeouts = new Map();
const xoTimeouts = global.xoTimeouts;


if (xoTimeouts.has(gameId)) {
  clearTimeout(xoTimeouts.get(gameId));
  xoTimeouts.delete(gameId);
}


xoTimeouts.set(gameId, setTimeout(async () => {
  if (!game.gameOver) {
    game.gameOver = true;
    const loser = game.currentTurn === game.player1.id ? game.player1 : game.player2;
    const winner = game.isAI ? '🤖 الذكاء الاصطناعي' : (loser.id === game.player1.id ? game.player2 : game.player1);

    await channel.send(`⏰ ${loser} لم يتحرك خلال 20 ثانية. تم إنهاء اللعبة! الفائز هو ${winner} 🎉`);

    activeXOGames.delete(gameId);
    xoTimeouts.delete(gameId);
  }
}, 20000));



  

  if (game.gameOver && game.winner && game.winner !== 'tie' && game.winner !== 'ai') {
    let generalPoints = await dbq.get(`points_${guild.id}.${game.winner}`) || 0;
    generalPoints += 2;
    await dbq.set(`points_${guild.id}.${game.winner}`, generalPoints);
  }

  const embed = game.createGameEmbed();
  let buttons = game.createGameButtons();

  await interaction.update({ embeds: [embed], components: buttons });


  if (game.isAI && !game.gameOver && game.currentTurn === 'ai') {
    setTimeout(async () => {
      game.makeAIMove();
      const newEmbed = game.createGameEmbed();
      const newButtons = game.createGameButtons();

      try {
        await interaction.editReply({ embeds: [newEmbed], components: newButtons });
      } catch (error) {
        console.error('خطأ في تحديث حركة الذكاء الاصطناعي:', error);
      }

      if (game.gameOver) {
        activeXOGames.delete(gameId);

        if (game.winner === game.player1.id) {
          let generalPoints = await dbq.get(`points_${guild.id}.${game.winner}`) || 0;
          generalPoints += 3;
          await dbq.set(`points_${guild.id}.${game.winner}`, generalPoints);

          channel.send(`🎉 ${game.player1} فاز ضد الذكاء الاصطناعي وحصل على 3 نقاط عامة!`);
        } else if (game.winner === 'ai') {
          channel.send(`🤖 الذكاء الاصطناعي فاز! حظًا أوفر ${game.player1}`);
        }
      }
    }, 1500);
  } else if (game.gameOver) {
    activeXOGames.delete(gameId);

    if (game.winner && game.winner !== 'tie' && !game.isAI) {
      const winnerUser = game.winner === game.player1.id ? game.player1 : game.player2;
      const loserUser = game.winner !== game.player1.id ? game.player1 : game.player2;
      channel.send(`🎉 ${winnerUser} فاز في لعبة XO ضد ${loserUser} وحصل على نقطتين جماعية!`);
    }


  


      if (game.gameOver && game.winner && game.winner !== 'tie' && game.winner !== 'ai') {
        let generalPoints = await dbq.get(`points_${guild.id}.${game.winner}`) || 0;
        generalPoints += 2;
        await dbq.set(`points_${guild.id}.${game.winner}`, generalPoints);
      }

      const embed = game.createGameEmbed();
      let buttons = game.createGameButtons();

      await interaction.update({ embeds: [embed], components: buttons });


      if (game.isAI && !game.gameOver && game.currentTurn === 'ai') {
        setTimeout(async () => {
          game.makeAIMove();
          const newEmbed = game.createGameEmbed();
          const newButtons = game.createGameButtons();
          
          try {
            await interaction.editReply({ embeds: [newEmbed], components: newButtons });
          } catch (error) {
            console.error('خطأ في تحديث حركة الذكاء الاصطناعي:', error);
          }
          
          if (game.gameOver) {
            activeXOGames.delete(gameId);
            
            if (game.winner === game.player1.id) {
              let generalPoints = await dbq.get(`points_${guild.id}.${game.winner}`) || 0;
              generalPoints += 3;
              await dbq.set(`points_${guild.id}.${game.winner}`, generalPoints);
              
              channel.send(`🎉 ${game.player1.username} فاز ضد الذكاء الاصطناعي وحصل على 3 نقاط عامة!`);
            }
          }
        }, 1500);
      } else if (game.gameOver) {
        activeXOGames.delete(gameId);
        
        if (game.winner && game.winner !== 'tie' && !game.isAI) {
          const winnerUser = game.winner === game.player1.id ? game.player1 : game.player2;
          channel.send(`🎉 ${winnerUser.username} فاز في لعبة XO وحصل على نقطتين عامتين!`);
        }
      }
    }
  



    

  setInterval(() => {
    const now = Date.now();
    for (const [gameId, game] of activeXOGames.entries()) {
      const gameAge = now - parseInt(gameId.split('_').pop());
      if (gameAge > 600000) {
        activeXOGames.delete(gameId);
      }
    }
  }, 600000);
           }
        });
   
    }



module.exports = { execute };
