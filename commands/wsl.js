
async function updateButtonInstantly(inter, row, col, player) {
  try {

    const currentComponents = inter.message.components;
    

    const newComponents = currentComponents.map(actionRow => {
      const newRow = new ActionRowBuilder();
      
      actionRow.components.forEach(component => {
        const newButton = new ButtonBuilder()
          .setCustomId(component.customId)
          .setStyle(component.style)
          .setDisabled(component.disabled);
        

        if (component.customId === `wasl_cell_${row}_${col}`) {
          if (player === 1) {
            newButton.setEmoji('<:red:1403282094934720653>');
            newButton.setStyle(4);
          } else {
            newButton.setEmoji('<:yellow:1403282096738402334>');
            newButton.setStyle(1);
          }
          newButton.setDisabled(true);
        } else {

          if (component.label) {
            newButton.setLabel(component.label);
          }
          if (component.emoji) {
            newButton.setEmoji(component.emoji);
          }
        }
        
        newRow.addComponents(newButton);
      });
      
      return newRow;
    });
    

    await inter.update({ components: newComponents });
    
  } catch (error) {
    console.error('Error updating button instantly:', error);

    await inter.deferUpdate().catch(() => {});
  }
}

const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;


  function createEmptyBoard() {
    const rows = 4;
    const cols = 5;
    return Array(rows).fill().map(() => Array(cols).fill(0));
  }


  function dropPiece(board, col, player) {

    for (let row = board.length - 1; row >= 0; row--) {
      if (board[row][col] === 0) {
        board[row][col] = player;
        return { success: true, row: row, col: col };
      }
    }

    return { success: false, row: -1, col: col };
  }


  function canDropInColumn(board, col) {
    if (col < 0 || col >= board[0].length) return false;
    return board[0][col] === 0;
  }


  function checkWinnerGrid4x5(board, row, col, player) {
    const rows = board.length;
    const cols = board[0].length;


    let count = 1;

    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;

    for (let c = col + 1; c < cols && board[row][c] === player; c++) count++;
    if (count >= 4) return true;


    count = 1;

    for (let r = row + 1; r < rows && board[r][col] === player; r++) count++;
    if (count >= 4) return true;


    count = 1;

    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && board[r][c] === player; r--, c--) count++;

    for (let r = row + 1, c = col + 1; r < rows && c < cols && board[r][c] === player; r++, c++) count++;
    if (count >= 4) return true;


    count = 1;

    for (let r = row - 1, c = col + 1; r >= 0 && c < cols && board[r][c] === player; r--, c++) count++;

    for (let r = row + 1, c = col - 1; r < rows && c >= 0 && board[r][c] === player; r++, c--) count++;
    if (count >= 4) return true;

    return false;
  }


  function isBoardFullGrid4x5(board) {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] === 0) return false;
      }
    }
    return true;
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
      .setDisabled(disabled || false);
    

    if (label && label.trim() !== '') {
      btn.setLabel(label);
    }
    

    if (emoji) {
      btn.setEmoji(emoji);
    }
    
    return btn;
  }


  async function giveGroupGamePoints(guildId, userId, points) {
    try {
      let groupGamePoints = await dbq.get(`groupgamepoints_${guildId}.${userId}`) || 0;
      groupGamePoints += points;
      await dbq.set(`groupgamepoints_${guildId}.${userId}`, groupGamePoints);
    } catch (error) {
      console.error('Error giving group game points:', error);
    }
  }


  async function updatePlayerStats(guildId, userId, won = false) {
    try {
      let games = await dbq.get(`waslgames_${guildId}.${userId}`) || 0;
      await dbq.set(`waslgames_${guildId}.${userId}`, games + 1);

      if (won) {
        let wins = await dbq.get(`waslwins_${guildId}.${userId}`) || 0;
        await dbq.set(`waslwins_${guildId}.${userId}`, wins + 1);
      }
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  }


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    
    if (args[0] === prefix + "وصل") {
      const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
      if (!commandChannel || message.channel.id !== commandChannel) return;
      
      const mgames = await dbq.get(`managergamess_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgames}`) && (!owners.includes(message.author.id))) return;
      
      if (has_play.get(message.guild.id)) {
        return message.reply({ content: `⌐ هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      }


      const storedTime = await dbq.get(`timerwasl_${message.author.id}`) || 30000;
      let data = {
        author: message.author.id,
        players: [],
        start_in: Date.now() + storedTime,
        type: "wasl",
        maxPlayers: 20,
        minPlayers: 2,
        gameState: "waiting",
        gameBoard: createEmptyBoard(),
        player1: null,
        player2: null,
        currentPlayer: 1,
        gameActive: false,
        winner: null
      };


      let attachment;
      const waslImage = `./imager/waslimage_${message.guild.id}.png`;
      
      try {
        if (fs.existsSync(waslImage)) {
          attachment = new AttachmentBuilder(waslImage);
        } else {
          attachment = new AttachmentBuilder(`./photo/wasl.png`);
        }
      } catch (error) {
        attachment = new AttachmentBuilder(`./photo/wasl.png`);
      }

      let content_time1 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`;
      let content_players1 = `**(0 / ${data.maxPlayers})**`;


      let row = [
        new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "join_wasl", "دخول", '1243848352026591274'),
          createButton("SECONDARY", "leave_wasl", "خروج", '1243848354535047230'),
          createButton("SECONDARY", "explain_wasl", "شرح اللعبة", '1254234763699687476')
        )
      ];

      let msg = await message.channel.send({ 
        content: `${content_time1}\n${content_players1}`, 
        files: [attachment], 
        components: row 
      }).catch(() => 0);

      if (!msg) return;
      
      has_play.set(message.guild.id, data);
      let start_c = msg.createMessageComponentCollector({ time: storedTime });


      async function updateCounter() {
        let data = has_play.get(message.guild.id);
        if (!data) return;
        let counter = data.players.length;
        let content_players2 = `**(${counter} / ${data.maxPlayers})**`;
        await msg.edit({ content: `${content_time1}\n${content_players2}`, components: row }).catch(() => {});
      }


      start_c.on("collect", async inter => {
        if (!has_play.get(message.guild.id)) return;
        let data = has_play.get(message.guild.id);

        if (inter.customId === "join_wasl") {
          if (data.players.find(u => u.id === inter.user.id)) {
            return inter.reply({ content: `لقد انضممت للعبة بالفعل!`, ephemeral: true });
          }
          
          if (data.players.length >= data.maxPlayers) {
            return inter.reply({ content: `عذراً، اكتمل عدد اللاعبين! الحد الأقصى ${data.maxPlayers} لاعب.`, ephemeral: true });
          }

          data.players.push({
            id: inter.user.id,
            username: inter.user.username,
            displayName: inter.user.displayName,
            avatar: inter.user.displayAvatarURL({ 
              extension: "png", 
              format: 'png', 
              size: 512, 
              forceStatic: true 
            }),
            number: data.players.length + 1
          });
          
          has_play.set(message.guild.id, data);
          await updateCounter();
          inter.reply({ content: `✅ تم انضمامك للعبة  !`, ephemeral: true });

        } else if (inter.customId === "leave_wasl") {
          let playerIndex = data.players.findIndex(p => p.id === inter.user.id);
          if (playerIndex === -1) {
            return inter.reply({ content: `أنت لست منضماً للعبة!`, ephemeral: true });
          }

          data.players.splice(playerIndex, 1);

          data.players.forEach((player, index) => {
            player.number = index + 1;
          });
          
          has_play.set(message.guild.id, data);
          await updateCounter();
          inter.reply({ content: `✅ تم خروجك من اللعبة.`, ephemeral: true });

        } else if (inter.customId === "explain_wasl") {
          inter.reply({
            content: `
**🔴 طريقة لعب وصل:**

🎯 **الهدف:** كن أول من يصل 4 قطع متتالية!

⚡ **القواعد:**
• سيتم اختيار لاعبين عشوائياً من المشاركين
• اللاعب الأول: 🔴 (أحمر)
• اللاعب الثاني: 🟡 (أصفر)
• اضغط على رقم العمود لإسقاط قطعتك

🎮 **آلية اللعب:**
• الشبكة 4 صفوف × 5 أعمدة
• اضغط على رقم العمود (1-5) لإسقاط قطعتك
• القطعة ستسقط تلقائياً لأسفل مكان فارغ
• تناوب الأدوار بين اللاعبين

🏆 **طرق الفوز:**
• 4 قطع متتالية أفقياً ←→
• 4 قطع متتالية عمودياً ↕️
• 4 قطع متتالية قطرياً ↗️↘️

🎮 **المكافآت:**
• الفوز = +3 نقاط ألعاب جماعية
• المشاركة = +1 نقطة ألعاب جماعية

💡 **استراتيجية:** فكر قبل اللعب وامنع خصمك من الوصل!`,
            ephemeral: true
          });
        }
      });


      start_c.on("end", async () => {
        if (!has_play.get(message.guild.id)) return;
        let data = has_play.get(message.guild.id);

        let content_players4 = `**(${data.players.length} / ${data.maxPlayers})**`;
        await msg.edit({ content: `${content_players4}`, components: [] }).catch(() => 0);

        if (data.players.length < data.minPlayers) {
          has_play.delete(message.guild.id);
          return message.channel.send({ 
            content: `تم إيقاف اللعبة لعدم وجود **${data.minPlayers}** لاعبين على الأقل - ⛔.` 
          });
        }

        message.channel.send({ content: `⏳ تم تسجيل اللاعبين سوف تبدأ اللعبة قريباً...` });
        
        setTimeout(() => {
          startWaslGame(message);
        }, 5000);
      });
    }
  });


  async function startWaslGame(message) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data || data.players.length === 0) return;


      const shuffledPlayers = [...data.players].sort(() => Math.random() - 0.5);
      data.player1 = shuffledPlayers[0];
      data.player2 = shuffledPlayers[1];
      
      data.gameState = "playing";
      data.gameActive = true;
      data.currentPlayer = 1;
      has_play.set(message.guild.id, data);


      for (const player of data.players) {
        await giveGroupGamePoints(message.guild.id, player.id, 1);
      }

      setTimeout(() => {
        sendGameBoard(message);
      }, 3000);

    } catch (error) {
      console.error('Error starting wasl game:', error);
      message.channel.send('⌐ حدث خطأ أثناء بدء اللعبة.');
      has_play.delete(message.guild.id);
    }
  }


  async function sendGameBoard(message) {
    try {
      let data = has_play.get(message.guild.id);
      if (!data || !data.gameActive) return;

      const currentPlayerData = data.currentPlayer === 1 ? data.player1 : data.player2;
      const currentPlayerEmoji = data.currentPlayer === 1 ? '🔴' : '🟡';


      const vsImage = await generateVSGameImage(data.player1, data.player2, message.guild.id);
      const attachment = new AttachmentBuilder(vsImage, { name: 'vs_game.png' });


      const rows = [];


      const dropRow = new ActionRowBuilder();
      for (let col = 0; col < 5; col++) {
        const canDrop = canDropInColumn(data.gameBoard, col);
        dropRow.addComponents(
          createButton(
            canDrop ? "SUCCESS" : "SECONDARY",
            `wasl_drop_${col}`,
            `${col + 1}`,
            "🔽",
            !canDrop
          )
        );
      }
      rows.push(dropRow);


      for (let row = 0; row < 4; row++) {
        const gameRow = new ActionRowBuilder();
        for (let col = 0; col < 5; col++) {
          const cellValue = data.gameBoard[row][col];
          let style = "SECONDARY";
          let disabled = true;
          
          if (cellValue === 1) {
            style = "SECONDARY";
            disabled = true;
          } else if (cellValue === 2) {
            style = "SECONDARY";
            disabled = true;
          }
          
          gameRow.addComponents(
            createButton(
              style,
              `wasl_cell_${row}_${col}`,
              "⬜",
              null,
              disabled
            )
          );
        }
        rows.push(gameRow);
      }

      const gameMsg = await message.channel.send({
        content: `**دور:** <@${currentPlayerData.id}>\n⏰ **لديك 30 ثانية للجواب**`,
        files: [attachment],
        components: rows
      });


      const gameCollector = gameMsg.createMessageComponentCollector({ time: 30000 });

      gameCollector.on('collect', async inter => {

        const currentGameData = has_play.get(message.guild.id);
        if (!currentGameData || !currentGameData.gameActive) {
          gameCollector.stop();
          return;
        }
        
        await handlePlayerMove(inter, currentGameData, message);
        gameCollector.stop();
      });

      gameCollector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          let currentData = has_play.get(message.guild.id);
          if (currentData && currentData.gameActive) {
            const currentPlayerData = currentData.currentPlayer === 1 ? currentData.player1 : currentData.player2;
            const otherPlayerData = currentData.currentPlayer === 1 ? currentData.player2 : currentData.player1;
            

            currentData.gameActive = false;
            has_play.set(message.guild.id, currentData);
            
            await gameMsg.edit({ components: [] });
            

            await message.channel.send({
              content: `⏰ **انتهى وقت <@${currentPlayerData.id}>! تم إخراجه من اللعبة.**\n\n🎉 **الفائز: <@${otherPlayerData.id}>!** 🏆`
            });
            

            await sendWinImage(message, otherPlayerData);
            

            await giveGroupGamePoints(message.guild.id, otherPlayerData.id, 1);
            await updatePlayerStats(message.guild.id, otherPlayerData.id, true);
            await updatePlayerStats(message.guild.id, currentPlayerData.id, false);
            
            has_play.delete(message.guild.id);
          }
        }
      });

    } catch (error) {
      console.error('Error sending game board:', error);
    }
  }


  async function handlePlayerMove(inter, currentData, message) {
    if (!currentData || !currentData.gameActive) return;

    const currentPlayerData = currentData.currentPlayer === 1 ? currentData.player1 : currentData.player2;
    

    if (inter.user.id !== currentPlayerData.id) {
      return inter.reply({ content: 'ليس دورك في اللعب!', ephemeral: true });
    }


    if (!inter.customId.startsWith('wasl_drop_')) {
      return inter.reply({ content: 'اضغط على الأرقام العلوية لإسقاط قطعتك!', ephemeral: true });
    }


    const col = parseInt(inter.customId.split('_')[2]);
    

    const latestData = has_play.get(message.guild.id);
    if (!latestData || !latestData.gameActive) return;
    
    if (!canDropInColumn(latestData.gameBoard, col)) {
      return inter.reply({ content: 'هذا العمود ممتلئ! اختر عموداً آخر.', ephemeral: true });
    }


    const dropResult = dropPiece(latestData.gameBoard, col, latestData.currentPlayer);
    
    if (!dropResult.success) {
      return inter.reply({ content: 'لا يمكن اللعب في هذا العمود!', ephemeral: true });
    }

    has_play.set(message.guild.id, latestData);


    await updateButtonInstantly(inter, dropResult.row, dropResult.col, latestData.currentPlayer);


    const winner = checkWinnerGrid4x5(latestData.gameBoard, dropResult.row, dropResult.col, latestData.currentPlayer);
    
    if (winner) {
      latestData.winner = latestData.currentPlayer === 1 ? latestData.player1 : latestData.player2;
      latestData.gameActive = false;
      has_play.set(message.guild.id, latestData);
      

      setTimeout(async () => {
        await inter.message.edit({ components: [] });

        await announceWinnerWithImage(message, latestData.winner, latestData.gameBoard);
        has_play.delete(message.guild.id);
      }, 500);
      return;
    }


    if (isBoardFullGrid4x5(latestData.gameBoard)) {
      latestData.gameActive = false;
      has_play.set(message.guild.id, latestData);
      
      setTimeout(async () => {
        await inter.message.edit({ components: [] });
        await announceDraw(message, latestData.gameBoard);
        has_play.delete(message.guild.id);
      }, 500);
      return;
    }


    latestData.currentPlayer = latestData.currentPlayer === 1 ? 2 : 1;
    has_play.set(message.guild.id, latestData);


    setTimeout(async () => {
      await updateGameBoardGridFast(inter, latestData);
      

      const newCollector = inter.message.createMessageComponentCollector({ time: 30000 });
      
      newCollector.on('collect', async newInter => {

        const currentGameData = has_play.get(message.guild.id);
        if (!currentGameData || !currentGameData.gameActive) {
          newCollector.stop();
          return;
        }
        

        await handlePlayerMove(newInter, currentGameData, message);
        newCollector.stop();
      });
      
      newCollector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          let timeoutData = has_play.get(message.guild.id);
          if (timeoutData && timeoutData.gameActive) {
            const timeoutPlayerData = timeoutData.currentPlayer === 1 ? timeoutData.player1 : timeoutData.player2;
            const winnerPlayerData = timeoutData.currentPlayer === 1 ? timeoutData.player2 : timeoutData.player1;
            

            timeoutData.gameActive = false;
            has_play.set(message.guild.id, timeoutData);
            
            await inter.message.edit({ components: [] });
            
            await message.channel.send({
              content: `⏰ **انتهى وقت <@${timeoutPlayerData.id}>! تم إخراجه من اللعبة.**\n\n🎉 **الفائز: <@${winnerPlayerData.id}>!**`
            });
            

            await announceWinnerWithImage(message, winnerPlayerData, timeoutData.gameBoard);
            

            await giveGroupGamePoints(message.guild.id, winnerPlayerData.id, 1);
            await updatePlayerStats(message.guild.id, winnerPlayerData.id, true);
            await updatePlayerStats(message.guild.id, timeoutPlayerData.id, false);
            
            has_play.delete(message.guild.id);
          }
        }
      });
    }, 100);
  }


  async function updateGameBoardGridFast(inter, data) {
    try {
      const currentPlayerData = data.currentPlayer === 1 ? data.player1 : data.player2;
      const currentPlayerEmoji = data.currentPlayer === 1 ? '🔴' : '🟡';


      const vsImage = await generateVSGameImage(data.player1, data.player2, data.guild || inter.guild.id);
      const attachment = new AttachmentBuilder(vsImage, { name: 'updated_vs.png' });

      const rows = [];


      const dropRow = new ActionRowBuilder();
      for (let col = 0; col < 5; col++) {
        const canDrop = canDropInColumn(data.gameBoard, col);
        dropRow.addComponents(
          createButton(
            canDrop ? "SUCCESS" : "SECONDARY",
            `wasl_drop_${col}`,
            `${col + 1}`,
            "🔽",
            !canDrop
          )
        );
      }
      rows.push(dropRow);


      for (let row = 0; row < 4; row++) {
        const gameRow = new ActionRowBuilder();
        for (let col = 0; col < 5; col++) {
          const cellValue = data.gameBoard[row][col];
          let style = "SECONDARY";
          let disabled = true;
          
          if (cellValue === 1) {
            style = "DANGER";
            disabled = true;
            gameRow.addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`wasl_cell_${row}_${col}`)
                .setEmoji('<:red:1403282094934720653>')
                .setDisabled(true)
            );
          } else if (cellValue === 2) {
            style = "PRIMARY";
            disabled = true;
            gameRow.addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`wasl_cell_${row}_${col}`)
                .setEmoji('<:yellow:1403282096738402334>')
                .setDisabled(true)
            );
          } else {
            gameRow.addComponents(
              createButton(
                "SECONDARY",
                `wasl_cell_${row}_${col}`,
                "⬜",
                null,
                true
              )
            );
          }
        }
        rows.push(gameRow);
      }

      await inter.editReply({
        content: `\n${currentPlayerEmoji} **دور:** <@${currentPlayerData.id}>\n⏰ **لديك 30 ثانية للجواب**`,
        files: [attachment],
        components: rows
      });

    } catch (error) {
      console.error('Error updating game board fast:', error);
    }
  }


  async function generateVSGameImage(player1, player2, guildId) {
    try {

      const canvas = createCanvas(1400, 600);
      const ctx = canvas.getContext('2d');


      ctx.clearRect(0, 0, canvas.width, canvas.height);


      await drawPlayerWithCircle(ctx, player1, 80, 80, '🔴', 'red');
      

      await drawPlayerWithCircle(ctx, player2, 1100, 80, '🟡', 'yellow');


      try {
        const vsImage = await loadImage('./photo/vs2.png');
        

        const vsWidth = 200;
        const vsHeight = 150;
        const vsX = (canvas.width / 2) - (vsWidth / 2);
        const vsY = (canvas.height / 2) - (vsHeight / 2);
        
        ctx.drawImage(vsImage, vsX, vsY, vsWidth, vsHeight);
        
      } catch (vsError) {

        ctx.font = 'bold 140px cairo';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText('VS', canvas.width / 2, canvas.height / 2);
        ctx.fillText('VS', canvas.width / 2, canvas.height / 2);
      }

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating VS game image:', error);
      return await createEmergencyGameImage(player1, player2);
    }
  }


  async function drawPlayerWithCircle(ctx, player, x, y, emoji, circleColor) {
    try {

      const avatarSize = 220;
      

      let avatar;
      try {
        avatar = await loadImage(player.avatar);
      } catch {
        avatar = await createDefaultAvatar(emoji);
      }


      const centerX = x + avatarSize / 2;
      const centerY = y + avatarSize / 2;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, avatarSize / 2 + 12, 0, Math.PI * 2);
      ctx.fillStyle = circleColor === 'red' ? '#ff4444' : '#ffcc00';
      ctx.fill();
      ctx.restore();


      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
      ctx.restore();


      ctx.font = 'bold 36px cairo';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      
      const textY = y + avatarSize + 50;
      ctx.strokeText(player.displayName, centerX, textY);
      ctx.fillText(player.displayName, centerX, textY);


      let circleImage;
      try {
        const circlePath = circleColor === 'red' ? './photo/red.png' : './photo/yellow.png';
        circleImage = await loadImage(circlePath);
      } catch {

        circleImage = await createColorCircle(circleColor);
      }


      const circleSize = 100;
      const circleX = centerX - circleSize / 2; 
      const circleY = textY + 25;
      ctx.drawImage(circleImage, circleX, circleY, circleSize, circleSize);

    } catch (error) {
      console.error('Error drawing player with circle:', error);
    }
  }


  async function createColorCircle(color) {
    try {

      const canvas = createCanvas(200, 200);
      const ctx = canvas.getContext('2d');
      

      ctx.clearRect(0, 0, 200, 200);
      

      ctx.beginPath();
      ctx.arc(100, 100, 85, 0, Math.PI * 2);
      ctx.fillStyle = color === 'red' ? '#FF4444' : '#FFD700';
      ctx.fill();
      

      ctx.strokeStyle = color === 'red' ? '#CC0000' : '#FFAA00';
      ctx.lineWidth = 8;
      ctx.stroke();
      
      return canvas;
    } catch (error) {
      console.error('Error creating color circle:', error);
      const canvas = createCanvas(200, 200);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color === 'red' ? '#FF4444' : '#FFD700';
      ctx.fillRect(0, 0, 200, 200);
      return canvas;
    }
  }


  async function createDefaultAvatar(emoji) {
    try {
      const canvas = createCanvas(400, 400);
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 200);
      gradient.addColorStop(0, emoji === '🔴' ? '#ff6666' : '#ffdd44');
      gradient.addColorStop(1, emoji === '🔴' ? '#cc0000' : '#cc9900');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 400);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 150px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 200, 200);
      
      return canvas;
    } catch (error) {
      const canvas = createCanvas(400, 400);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#666666';
      ctx.fillRect(0, 0, 400, 400);
      return canvas;
    }
  }


  async function sendWinImage(message, winner) {
    try {

      const winnerImage = await generateWinnerImage(winner, null, message.guild.id);
      const attachment = new AttachmentBuilder(winnerImage, { name: 'winner.png' });


      const pointsEarned = 1;
      const totalGroupGamePoints = await dbq.get(`groupgamepoints_${message.guild.id}.${winner.id}`) || 0;

      const row = new ActionRowBuilder()
        .addComponents(
          createButton("SECONDARY", "winner_points", `🎮 +${pointsEarned} (${totalGroupGamePoints})`, null, true)
        );

      await message.channel.send({
        files: [attachment],
        components: [row]
      });

    } catch (error) {
      console.error('Error sending win image:', error);

      try {
        const pointsEarned = 1;
        const totalGroupGamePoints = await dbq.get(`groupgamepoints_${message.guild.id}.${winner.id}`) || 0;

        const row = new ActionRowBuilder()
          .addComponents(
            createButton("SECONDARY", "winner_points", `🎮 +${pointsEarned} (${totalGroupGamePoints})`, null, true)
          );

        if (fs.existsSync('./photo/win.png')) {
          const fallbackAttachment = new AttachmentBuilder('./photo/win.png');
          await message.channel.send({
            files: [fallbackAttachment],
            components: [row]
          });
        }
      } catch (fallbackError) {
        console.error('Error sending fallback win image:', fallbackError);
      }
    }
  }


  async function announceWinnerWithImage(message, winner, board) {
    try {

      const pointsEarned = 1;
      await giveGroupGamePoints(message.guild.id, winner.id, pointsEarned);
      
      await updatePlayerStats(message.guild.id, winner.id, true);


      await message.channel.send({ 
        content: `🎉 **تهانينا <@${winner.id}>!** 🏆`
      });


      await sendWinImage(message, winner);

    } catch (error) {
      console.error('Error announcing winner with image:', error);
      await message.channel.send(`🎉 **تهانينا <@${winner.id}>!** 🏆`);
      await sendWinImage(message, winner);
    }
  }


  async function announceDraw(message, board) {
    try {
      await message.channel.send({ 
        content: `🤝 **تعادل!** 🤝`
      });
    } catch (error) {
      console.error('Error announcing draw:', error);
    }
  }


  async function generateWinnerImage(winner, board, guildId) {
    try {
      const canvas = createCanvas(2560, 1080);
      const ctx = canvas.getContext('2d');


      let backgroundImage;
      const winImagePath = `./imager/messageimage_${guildId}.png`;
      
      try {
        if (fs.existsSync(winImagePath)) {
          backgroundImage = await loadImage(winImagePath);
        } else {
          backgroundImage = await loadImage('./photo/win.png');
        }
      } catch (error) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      }


      let avatar;
      try {
        avatar = await loadImage(winner.avatar);
      } catch {
        avatar = await createDefaultAvatar('🏆');
      }


      const avatarSize = 720;
      const avatarX = 962;
      const avatarY = 68;
      
      drawCircularImageWithBorder(ctx, avatar, avatarX, avatarY, avatarSize);


      ctx.font = '90px cairo';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const textName = winner.displayName || 'الفائز';
      const textX = 275 + avatarSize + 280;
      const textY = 985;

      ctx.strokeText(textName, textX, textY - 100);
      ctx.fillText(textName, textX, textY - 100);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating winner image:', error);
      return await createEmergencyWinnerImage(winner.displayName);
    }
  }


  function drawCircularImageWithBorder(ctx, image, x, y, size) {
    try {
      if (!image) {
        throw new Error('Image object is null or undefined');
      }


      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 12, 0, Math.PI * 2, true);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.restore();
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 6, 0, Math.PI * 2, true);
      ctx.fillStyle = '#B8860B';
      ctx.fill();
      ctx.restore();
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      
      if (image.width && image.height) {
        ctx.drawImage(image, x, y, size, size);
      } else {
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(x, y, size, size);
      }
      
      ctx.restore();
      
    } catch (error) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.fillStyle = '#B8860B';
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 60px cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏆', x + size / 2, y + size / 2);
      
      ctx.restore();
    }
  }


  async function createEmergencyWinnerImage(playerName) {
    try {
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');
      

      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(0.5, '#FFA500');
      gradient.addColorStop(1, '#FF8C00');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 400);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 فائز لعبة وصل 🏆', 400, 150);
      
      ctx.font = 'bold 28px cairo';
      ctx.fillText(playerName || 'اللاعب', 400, 250);
      
      return canvas.toBuffer();
    } catch (error) {
      throw error;
    }
  }


  async function createEmergencyGameImage(player1, player2) {
    try {
      const canvas = createCanvas(1400, 600);
      const ctx = canvas.getContext('2d');
      

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.font = 'bold 36px cairo';
      ctx.textAlign = 'center';
      
      ctx.strokeText('🔴 ' + (player1.displayName || 'اللاعب 1'), 350, 200);
      ctx.fillText('🔴 ' + (player1.displayName || 'اللاعب 1'), 350, 200);
      
      ctx.font = 'bold 140px cairo';
      ctx.lineWidth = 8;
      ctx.strokeText('VS', canvas.width / 2, canvas.height / 2);
      ctx.fillText('VS', canvas.width / 2, canvas.height / 2);
      
      ctx.font = 'bold 36px cairo';
      ctx.lineWidth = 4;
      ctx.strokeText('🟡 ' + (player2.displayName || 'اللاعب 2'), 1050, 200);
      ctx.fillText('🟡 ' + (player2.displayName || 'اللاعب 2'), 1050, 200);
      
      return canvas.toBuffer();
    } catch (error) {
      throw error;
    }
  }

}

module.exports = { execute };
