const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, Discord } = utils;


  function addRoundRectSupport(ctx) {
    if (!ctx.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
      };
    }
  }


  function createButton(style, customId, label, emoji, disabled = false) {
    const styles = {
      PRIMARY: ButtonStyle.Primary,
      SECONDARY: ButtonStyle.Secondary,
      SUCCESS: ButtonStyle.Success,
      DANGER: ButtonStyle.Danger
    };
    
    let btn = new ButtonBuilder()
      .setStyle(styles[style])
      .setCustomId(customId)
      .setLabel(label)
      .setDisabled(disabled);
    
    if (emoji) btn.setEmoji(emoji);
    return btn;
  }


  async function generateDiceImage(number, team = 'red') {
    try {
      const canvas = createCanvas(200, 200);
      const ctx = canvas.getContext('2d');
      addRoundRectSupport(ctx);

      const gradient = ctx.createLinearGradient(0, 0, 200, 200);
      if (team === 'red') {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f8f8f8');
      } else {
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(1, '#e8e8e8');
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(25, 25, 150, 150, 20);
      ctx.fill();
      
      ctx.strokeStyle = team === 'red' ? '#d32f2f' : '#424242';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(25, 25, 150, 150, 20);
      ctx.stroke();

      ctx.fillStyle = team === 'red' ? '#d32f2f' : '#212121';
      const dotSize = 12;
      const centerX = 100;
      const centerY = 100;

      switch (number) {
        case 1:
          ctx.beginPath();
          ctx.arc(centerX, centerY, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 2:
          ctx.beginPath();
          ctx.arc(centerX - 30, centerY - 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 30, centerY + 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 3:
          ctx.beginPath();
          ctx.arc(centerX - 30, centerY - 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX, centerY, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 30, centerY + 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 4:
          ctx.beginPath();
          ctx.arc(centerX - 30, centerY - 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 30, centerY - 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX - 30, centerY + 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 30, centerY + 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 5:
          ctx.beginPath();
          ctx.arc(centerX - 30, centerY - 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 30, centerY - 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX, centerY, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX - 30, centerY + 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 30, centerY + 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 6:
          ctx.beginPath();
          ctx.arc(centerX - 30, centerY - 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 30, centerY - 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX - 30, centerY, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 30, centerY, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX - 30, centerY + 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX + 30, centerY + 30, dotSize, 0, 2 * Math.PI);
          ctx.fill();
          break;
      }

      ctx.font = 'bold 20px cairo';
      ctx.fillStyle = team === 'red' ? '#ff0000' : '#000000';
      ctx.textAlign = 'right';
      const teamSymbol = team === 'red' ? '🔴' : '⚫';
      ctx.fillText(teamSymbol, 170, 50);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating dice image:', error);
      throw error;
    }
  }

  async function generateSpecialDiceImage(type, team = 'red') {
    try {
      const canvas = createCanvas(200, 200);
      const ctx = canvas.getContext('2d');
      addRoundRectSupport(ctx);

      let backgroundColor, textColor;
      if (type === '-4' || type === '-6') {
        backgroundColor = ctx.createLinearGradient(0, 0, 200, 200);
        if (team === 'red') {
          backgroundColor.addColorStop(0, '#FF6B6B');
          backgroundColor.addColorStop(1, '#DC143C');
        } else {
          backgroundColor.addColorStop(0, '#FF8A80');
          backgroundColor.addColorStop(1, '#F44336');
        }
        textColor = '#ffffff';
      } else if (type === 'x2') {
        backgroundColor = ctx.createLinearGradient(0, 0, 200, 200);
        backgroundColor.addColorStop(0, '#4ECDC4');
        backgroundColor.addColorStop(1, '#20B2AA');
        textColor = '#ffffff';
      } else if (type === 'steal') {
        backgroundColor = ctx.createLinearGradient(0, 0, 200, 200);
        backgroundColor.addColorStop(0, '#9C27B0');
        backgroundColor.addColorStop(1, '#673AB7');
        textColor = '#ffffff';
      } else if (type === '+2' || type === '+4') {
        backgroundColor = ctx.createLinearGradient(0, 0, 200, 200);
        backgroundColor.addColorStop(0, '#4CAF50');
        backgroundColor.addColorStop(1, '#2E7D32');
        textColor = '#ffffff';
      } else if (type === 'no') {
        backgroundColor = ctx.createLinearGradient(0, 0, 200, 200);
        backgroundColor.addColorStop(0, '#FF9800');
        backgroundColor.addColorStop(1, '#F57C00');
        textColor = '#ffffff';
      } else {
        backgroundColor = team === 'red' ? '#ffffff' : '#f0f0f0';
        textColor = '#000000';
      }
      
      ctx.fillStyle = backgroundColor;
      ctx.beginPath();
      ctx.roundRect(25, 25, 150, 150, 20);
      ctx.fill();
      
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(25, 25, 150, 150, 20);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 36px cairo';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;

      if (type === 'steal') {
        ctx.font = 'bold 30px cairo';
        ctx.fillText('🏴‍☠️', 100, 115);
      } else if (type === 'no') {
        ctx.font = 'bold 32px cairo';
        ctx.fillText('🚫', 100, 115);
      } else {
        ctx.fillText(type, 100, 115);
      }

      ctx.shadowColor = 'transparent';
      ctx.font = 'bold 18px cairo';
      ctx.fillStyle = team === 'red' ? '#ff0000' : '#000000';
      ctx.textAlign = 'right';
      const teamSymbol = team === 'red' ? '🔴' : '⚫';
      ctx.fillText(teamSymbol, 170, 50);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating special dice image:', error);
      throw error;
    }
  }

  async function showTeamDistribution(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;

      const canvas = createCanvas(900, 500);
      const ctx = canvas.getContext('2d');
      addRoundRectSupport(ctx);


      const gradient = ctx.createLinearGradient(0, 0, 0, 500);
      gradient.addColorStop(0, '#1e3c72');
      gradient.addColorStop(0.3, '#2a5298');
      gradient.addColorStop(0.7, '#3b73d1');
      gradient.addColorStop(1, '#1e3c72');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 900, 500);


      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 900, Math.random() * 500, Math.random() * 30 + 10, 0, 2 * Math.PI);
        ctx.fill();
      }


      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;
      ctx.font = 'bold 36px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('🎲 توزيع الفرق 🎲', 450, 60);
      

      ctx.shadowColor = 'transparent';


      const redGradient = ctx.createLinearGradient(50, 120, 50, 420);
      redGradient.addColorStop(0, '#FF6B6B');
      redGradient.addColorStop(0.5, '#FF5722');
      redGradient.addColorStop(1, '#D32F2F');
      ctx.fillStyle = redGradient;
      ctx.beginPath();
      ctx.roundRect(50, 120, 350, 320, 20);
      ctx.fill();


      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(50, 120, 350, 320, 20);
      ctx.stroke();


      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('🔴 الفريق الأحمر', 225, 155);


      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 170);
      ctx.lineTo(380, 170);
      ctx.stroke();


      let yPos = 200;
      for (let i = 0; i < data.redTeam.length && i < 8; i++) {
        const player = data.redTeam[i];
        

        const playerGradient = ctx.createLinearGradient(70, yPos, 70, yPos + 25);
        if (i % 2 === 0) {
          playerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
          playerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        } else {
          playerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
          playerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        }
        ctx.fillStyle = playerGradient;
        ctx.beginPath();
        ctx.roundRect(70, yPos, 310, 25, 12);
        ctx.fill();


        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px cairo';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, 85, yPos + 17);


        ctx.font = '16px cairo';
        ctx.textAlign = 'left';
        let displayName = player.displayName;
        if (displayName.length > 20) {
          displayName = displayName.substring(0, 20) + '...';
        }
        ctx.fillText(displayName, 105, yPos + 17);


        ctx.font = '14px cairo';
        ctx.textAlign = 'right';
        ctx.fillText('👤', 370, yPos + 17);

        yPos += 30;
      }


      const blackGradient = ctx.createLinearGradient(500, 120, 500, 420);
      blackGradient.addColorStop(0, '#616161');
      blackGradient.addColorStop(0.5, '#424242');
      blackGradient.addColorStop(1, '#212121');
      ctx.fillStyle = blackGradient;
      ctx.beginPath();
      ctx.roundRect(500, 120, 350, 320, 20);
      ctx.fill();


      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(500, 120, 350, 320, 20);
      ctx.stroke();


      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('⚫ الفريق الأسود', 675, 155);


      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(520, 170);
      ctx.lineTo(830, 170);
      ctx.stroke();


      yPos = 200;
      for (let i = 0; i < data.blackTeam.length && i < 8; i++) {
        const player = data.blackTeam[i];
        

        const playerGradient = ctx.createLinearGradient(520, yPos, 520, yPos + 25);
        if (i % 2 === 0) {
          playerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
          playerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        } else {
          playerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
          playerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        }
        ctx.fillStyle = playerGradient;
        ctx.beginPath();
        ctx.roundRect(520, yPos, 310, 25, 12);
        ctx.fill();


        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px cairo';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, 535, yPos + 17);


        ctx.font = '16px cairo';
        ctx.textAlign = 'left';
        let displayName = player.displayName;
        if (displayName.length > 20) {
          displayName = displayName.substring(0, 20) + '...';
        }
        ctx.fillText(displayName, 555, yPos + 17);


        ctx.font = '14px cairo';
        ctx.textAlign = 'right';
        ctx.fillText('👤', 820, yPos + 17);

        yPos += 30;
      }


      const statsY = 460;
      

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(50, statsY - 10, 800, 40, 20);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px cairo';
      ctx.textAlign = 'center';
      ctx.fillText(`🔴 الفريق الأحمر: ${data.redTeam.length} لاعب`, 225, statsY + 15);
      ctx.fillText(`⚫ الفريق الأسود: ${data.blackTeam.length} لاعب`, 675, statsY + 15);

      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'team-distribution.png' });


      await message.channel.send({
        content: `🎯 **تم توزيع اللاعبين على الفرق بنجاح!**\n\n🔴 **الفريق الأحمر:** ${data.redTeam.length} لاعب\n⚫ **الفريق الأسود:** ${data.blackTeam.length} لاعب\n\n⏳ ستبدأ اللعبة خلال لحظات...`,
        files: [attachment]
      });

    } catch (error) {
      console.error('Error showing team distribution:', error);

      await message.channel.send(`🎯 **تم توزيع اللاعبين على الفرق بنجاح!**\n\n🔴 **الفريق الأحمر:** ${data.redTeam.length} لاعب\n⚫ **الفريق الأسود:** ${data.blackTeam.length} لاعب`);
    }
  }


  async function startDiceGame(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data || data.players.length === 0) return;


      const shuffledPlayers = [...data.players].sort(() => Math.random() - 0.5);
      
      data.redTeam = [];
      data.blackTeam = [];

      shuffledPlayers.forEach((player, index) => {
        if (index % 2 === 0) {
          player.team = 'red';
          data.redTeam.push(player);
        } else {
          player.team = 'black';
          data.blackTeam.push(player);
        }
      });

      data.gameState = "playing";
      data.currentPlayerIndex = 0;
      
      has_play.set(message.guild.id, data);


      await showTeamDistribution(message);
      

      setTimeout(() => {
        startGameRound(message);
      }, 8000);
    } catch (error) {
      console.error('Error starting dice game:', error);
      message.channel.send('❌ حدث خطأ أثناء بدء اللعبة.');
      has_play.delete(message.guild.id);
    }
  }

  async function startGameRound(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      if (data.roundNumber > data.maxRounds) {
        await endGame(message);
        return;
      }


      const allPlayers = [...data.redTeam, ...data.blackTeam];
      

      let availablePlayers = allPlayers;
      if (data.lastPlayerIndex !== undefined && allPlayers.length > 1) {
        const lastPlayer = allPlayers[data.lastPlayerIndex];
        if (lastPlayer) {
          availablePlayers = allPlayers.filter(p => p.id !== lastPlayer.id);
          if (availablePlayers.length === 0) {
            availablePlayers = allPlayers;
          }
        }
      }
      
      const randomPlayerIndex = Math.floor(Math.random() * availablePlayers.length);
      let selectedPlayer = availablePlayers[randomPlayerIndex];
      

      if (data.blockedPlayers.includes(selectedPlayer.id)) {

        data.blockedPlayers = data.blockedPlayers.filter(id => id !== selectedPlayer.id);
        

        await message.channel.send({
          content: `🚫 **${selectedPlayer.displayName}** محجوب! سيتم تخطي دوره وانتقاء لاعب آخر...`
        });
        

        const otherPlayers = allPlayers.filter(p => p.id !== selectedPlayer.id);
        if (otherPlayers.length > 0) {
          const newRandomIndex = Math.floor(Math.random() * otherPlayers.length);
          selectedPlayer = otherPlayers[newRandomIndex];
        }
        

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      data.currentPlayer = selectedPlayer;
      

      data.lastPlayerIndex = allPlayers.findIndex(p => p.id === data.currentPlayer.id);

      has_play.set(message.guild.id, data);


      const teamEmoji = data.currentPlayer.team === 'red' ? '🔴' : '⚫';
      
      let blockedInfo = '';
      if (data.blockedPlayers.length > 0) {
        const blockedNames = [];
        data.blockedPlayers.forEach(playerId => {
          const blockedPlayer = allPlayers.find(p => p.id === playerId);
          if (blockedPlayer) {
            blockedNames.push(blockedPlayer.displayName);
          }
        });
        if (blockedNames.length > 0) {
          blockedInfo = `\n🚫 **سيتم تخطيهم إذا تم اختيارهم:** ${blockedNames.join(', ')}`;
        }
      }

      const actionRow = new ActionRowBuilder()
        .addComponents(
          createButton("SECONDARY", "roll_dice", "ارمي النرد", '🎲'),
          createButton("PRIMARY", "skip_turn", "تخطي", )
        );

      const roundMsg = await message.channel.send({
        content: `🎲 **الجولة ${data.roundNumber}/${data.maxRounds}**\n\n${teamEmoji} **دور <@${data.currentPlayer.id}>!\n⏱️ لديك **30 ثانية لاتخاذ قرار:**${blockedInfo}`,
        components: [actionRow]
      });


      const collector = roundMsg.createMessageComponentCollector({ 
        filter: i => i.user.id === data.currentPlayer.id,
        time: 30000 
      });

      collector.on('collect', async inter => {
        await handlePlayerAction(message, inter, roundMsg);
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await handlePlayerTimeout(message, roundMsg);
        }
      });

    } catch (error) {
      console.error('Error in game round:', error);
    }
  }


  async function handlePlayerAction(message, interaction, roundMsg) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;

      await interaction.deferUpdate();

      if (interaction.customId === "roll_dice") {
        await rollDice(message, data.currentPlayer, roundMsg);
      } else if (interaction.customId === "skip_turn") {
        await skipTurn(message, data.currentPlayer, roundMsg);
      }

    } catch (error) {
      console.error('Error handling player action:', error);
    }
  }


  async function skipTurn(message, player, roundMsg) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      data.teamHistory.push({
        round: data.roundNumber,
        player: player.displayName,
        team: player.team,
        action: 'skip',
        result: 0
      });

      data.playerScores[player.id].push({
        round: data.roundNumber,
        roll: 0,
        action: 'skip'
      });

      const teamEmoji = player.team === 'red' ? '🔴' : '⚫';

      await roundMsg.edit({
        content: `⭐️ **<@${player.id}>** ${teamEmoji} تخطى دوره!`,
        files: [],
        components: []
      });

      data.roundNumber++;
      has_play.set(message.guild.id, data);

      setTimeout(() => {
        startGameRound(message);
      }, 3000);

    } catch (error) {
      console.error('Error skipping turn:', error);
    }
  }


  async function handlePlayerTimeout(message, roundMsg) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;

      const teamEmoji = data.currentPlayer.team === 'red' ? '🔴' : '⚫';

      await roundMsg.edit({
        content: `⏰ **<@${data.currentPlayer.id}>** ${teamEmoji} لم يتفاعل في الوقت المحدد! تم تخطي الدور.`,
        files: [],
        components: []
      });


      data.teamHistory.push({
        round: data.roundNumber,
        player: data.currentPlayer.displayName,
        team: data.currentPlayer.team,
        action: 'timeout',
        result: 0
      });

      data.playerScores[data.currentPlayer.id].push({
        round: data.roundNumber,
        roll: 0,
        action: 'timeout'
      });

      data.roundNumber++;
      has_play.set(message.guild.id, data);

      setTimeout(() => {
        startGameRound(message);
      }, 3000);

    } catch (error) {
      console.error('Error handling timeout:', error);
    }
  }

  async function rollDice(message, player, roundMsg) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;


      let diceResult;
      let diceType = 'normal';
      const random = Math.random();
      
      if (random < 0.03) {
        diceResult = -4;
        diceType = 'minus4';
      } else if (random < 0.05) {
        diceResult = -6;
        diceType = 'minus6';
      } else if (random < 0.07) {
        diceResult = 'x2';
        diceType = 'double';
      } else if (random < 0.09) {
        diceResult = 'steal';
        diceType = 'steal';
      } else if (random < 0.12) {
        diceResult = '+2';
        diceType = 'plus2';
      } else if (random < 0.14) {
        diceResult = '+4';
        diceType = 'plus4';
      } else if (random < 0.16) {
        diceResult = 'no';
        diceType = 'block';
      } else {

        diceResult = Math.floor(Math.random() * 6) + 1;
        diceType = 'normal';
      }
      

      if (diceType === 'normal') {

        if (player.team === 'red') {
          data.redScore += diceResult;
        } else {
          data.blackScore += diceResult;
        }
        player.totalScore += diceResult;
        
        await processNormalDice(message, player, roundMsg, diceResult, data);
        
      } else if (diceType === 'minus4') {
        await processMinus4Dice(message, player, roundMsg, data);
        
      } else if (diceType === 'minus6') {
        await processMinus6Dice(message, player, roundMsg, data);
        
      } else if (diceType === 'double') {
        await processDoubleDice(message, player, roundMsg, data);
        
      } else if (diceType === 'steal') {
        await processStealDice(message, player, roundMsg, data);
        return;
      } else if (diceType === 'plus2') {
        await processPlus2Dice(message, player, roundMsg, data);
        
      } else if (diceType === 'plus4') {
        await processPlus4Dice(message, player, roundMsg, data);
        
      } else if (diceType === 'block') {
        await processBlockDice(message, player, roundMsg, data);
        return;
      }
      
      player.rollsCount++;
      

      data.roundNumber++;
      has_play.set(message.guild.id, data);

      setTimeout(() => {
        startGameRound(message);
      }, 4000);

    } catch (error) {
      console.error('Error rolling dice:', error);
    }
  }


  async function processNormalDice(message, player, roundMsg, diceResult, data) {
    try {
      data.playerScores[player.id].push({
        round: data.roundNumber,
        roll: diceResult,
        action: 'roll'
      });

      data.teamHistory.push({
        round: data.roundNumber,
        player: player.displayName,
        team: player.team,
        action: 'roll',
        result: diceResult
      });


      const diceFolder = player.team === 'red' ? 'dice1' : 'dice2';
      const diceImagePath = `./photo/${diceFolder}/dice (${diceResult}).png`;
      let diceAttachment;
      
      try {
        if (fs.existsSync(diceImagePath)) {
          diceAttachment = new AttachmentBuilder(diceImagePath, { name: `dice-${diceResult}.png` });
        } else {

          const fallbackPath = `./photo/dice1/dice (${diceResult}).png`;
          if (fs.existsSync(fallbackPath)) {
            diceAttachment = new AttachmentBuilder(fallbackPath, { name: `dice-${diceResult}.png` });
          } else {

            const diceFallback = await generateDiceImage(diceResult, player.team);
            diceAttachment = new AttachmentBuilder(diceFallback, { name: `dice-${diceResult}.png` });
          }
        }
      } catch (error) {
        const diceFallback = await generateDiceImage(diceResult, player.team);
        diceAttachment = new AttachmentBuilder(diceFallback, { name: `dice-${diceResult}.png` });
      }

      const teamEmoji = player.team === 'red' ? '🔴' : '⚫';

      await roundMsg.edit({
        content: `🎲 **<@${player.id}>** **رمى النرد وحصل على ${diceResult}**! حصل على ${diceResult} نقاط!`,
        files: [diceAttachment],
        components: []
      });


      try {
        let playerPoints = await dbq.get(`points_${message.guild.id}.${player.id}`) || 0;
        playerPoints += diceResult;
        await dbq.set(`points_${message.guild.id}.${player.id}`, playerPoints);
      } catch (error) {
        console.error('Error updating player points:', error);
      }
    } catch (error) {
      console.error('Error processing normal dice:', error);
    }
  }


  async function processMinus4Dice(message, player, roundMsg, data) {
    try {

      if (player.team === 'red') {
        data.redScore = Math.max(0, data.redScore - 4);
      } else {
        data.blackScore = Math.max(0, data.blackScore - 4);
      }
      
      player.totalScore = Math.max(0, player.totalScore - 4);

      data.playerScores[player.id].push({
        round: data.roundNumber,
        roll: -4,
        action: 'minus4'
      });

      data.teamHistory.push({
        round: data.roundNumber,
        player: player.displayName,
        team: player.team,
        action: 'minus4',
        result: -4
      });


      const diceFolder = player.team === 'red' ? 'dice1' : 'dice2';
      const diceImagePath = `./photo/${diceFolder}/-4.png`;
      let diceAttachment;
      
      try {
        if (fs.existsSync(diceImagePath)) {
          diceAttachment = new AttachmentBuilder(diceImagePath, { name: 'dice-minus4.png' });
        } else {

          const diceFallback = await generateSpecialDiceImage('-4', player.team);
          diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-minus4.png' });
        }
      } catch (error) {
        const diceFallback = await generateSpecialDiceImage('-4', player.team);
        diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-minus4.png' });
      }

      const teamEmoji = player.team === 'red' ? '🔴' : '⚫';

      await roundMsg.edit({
        content: `💥 **<@${player.id}>** حصل على مكعب التنقيص **-4**!\n${teamEmoji} فقد الفريق 4 نقاط! 😰`,
        files: [diceAttachment],
        components: []
      });


      try {
        let playerPoints = await dbq.get(`points_${message.guild.id}.${player.id}`) || 0;
        playerPoints = Math.max(0, playerPoints - 2);
        await dbq.set(`points_${message.guild.id}.${player.id}`, playerPoints);
      } catch (error) {
        console.error('Error updating player points:', error);
      }
    } catch (error) {
      console.error('Error processing minus4 dice:', error);
    }
  }


  async function processMinus6Dice(message, player, roundMsg, data) {
    try {
      if (player.team === 'red') {
        data.redScore = Math.max(0, data.redScore - 6);
      } else {
        data.blackScore = Math.max(0, data.blackScore - 6);
      }
      player.totalScore = Math.max(0, player.totalScore - 6);

      data.playerScores[player.id].push({
        round: data.roundNumber,
        roll: -6,
        action: 'minus6'
      });

      data.teamHistory.push({
        round: data.roundNumber,
        player: player.displayName,
        team: player.team,
        action: 'minus6',
        result: -6
      });


      const diceFolder = player.team === 'red' ? 'dice1' : 'dice2';
      const diceImagePath = `./photo/${diceFolder}/-6.png`;
      let diceAttachment;
      
      try {
        if (fs.existsSync(diceImagePath)) {
          diceAttachment = new AttachmentBuilder(diceImagePath, { name: 'dice-minus6.png' });
        } else {
          const diceFallback = await generateSpecialDiceImage('-6', player.team);
          diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-minus6.png' });
        }
      } catch (error) {
        const diceFallback = await generateSpecialDiceImage('-6', player.team);
        diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-minus6.png' });
      }

      const teamEmoji = player.team === 'red' ? '🔴' : '⚫';
      await roundMsg.edit({
        content: `💥💥 **<@${player.id}>** حصل على مكعب التنقيص **-6**!\n${teamEmoji} فقد الفريق 6 نقاط! 😱`,
        files: [diceAttachment],
        components: []
      });

      try {
        let playerPoints = await dbq.get(`points_${message.guild.id}.${player.id}`) || 0;
        playerPoints = Math.max(0, playerPoints - 3);
        await dbq.set(`points_${message.guild.id}.${player.id}`, playerPoints);
      } catch (error) {
        console.error('Error updating player points:', error);
      }
    } catch (error) {
      console.error('Error processing minus6 dice:', error);
    }
  }


  async function processDoubleDice(message, player, roundMsg, data) {
    try {
      const doubledPoints = player.totalScore;
      player.totalScore = doubledPoints * 2;
      
      const addedPoints = doubledPoints;
      if (player.team === 'red') {
        data.redScore += addedPoints;
      } else {
        data.blackScore += addedPoints;
      }

      data.playerScores[player.id].push({
        round: data.roundNumber,
        roll: doubledPoints,
        action: 'double'
      });

      data.teamHistory.push({
        round: data.roundNumber,
        player: player.displayName,
        team: player.team,
        action: 'double',
        result: addedPoints
      });


      const diceFolder = player.team === 'red' ? 'dice1' : 'dice2';
      const diceImagePath = `./photo/${diceFolder}/x2.png`;
      let diceAttachment;
      
      try {
        if (fs.existsSync(diceImagePath)) {
          diceAttachment = new AttachmentBuilder(diceImagePath, { name: 'dice-x2.png' });
        } else {
          const diceFallback = await generateSpecialDiceImage('x2', player.team);
          diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-x2.png' });
        }
      } catch (error) {
        const diceFallback = await generateSpecialDiceImage('x2', player.team);
        diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-x2.png' });
      }

      await roundMsg.edit({
        content: `🎉✨ **<@${player.id}>** حصل على مكعب التضعيف **x2**!\nتم تضعيف نقاطه من ${doubledPoints} إلى ${player.totalScore}! 🚀`,
        files: [diceAttachment],
        components: []
      });

      try {
        let playerPoints = await dbq.get(`points_${message.guild.id}.${player.id}`) || 0;
        playerPoints += addedPoints;
        await dbq.set(`points_${message.guild.id}.${player.id}`, playerPoints);
      } catch (error) {
        console.error('Error updating player points:', error);
      }
    } catch (error) {
      console.error('Error processing double dice:', error);
    }
  }

  async function processPlus2Dice(message, player, roundMsg, data) {
    try {
      const teamMembers = player.team === 'red' ? data.redTeam : data.blackTeam;
      const pointsPerMember = 2;
      const totalPoints = teamMembers.length * pointsPerMember;
      
      teamMembers.forEach(member => {
        member.totalScore += pointsPerMember;
      });
      
      if (player.team === 'red') {
        data.redScore += totalPoints;
      } else {
        data.blackScore += totalPoints;
      }

      data.playerScores[player.id].push({
        round: data.roundNumber,
        roll: totalPoints,
        action: 'plus2_team'
      });

      data.teamHistory.push({
        round: data.roundNumber,
        player: player.displayName,
        team: player.team,
        action: 'plus2_team',
        result: totalPoints
      });


      const diceFolder = player.team === 'red' ? 'dice1' : 'dice2';
      const diceImagePath = `./photo/${diceFolder}/+2.png`;
      let diceAttachment;
      
      try {
        if (fs.existsSync(diceImagePath)) {
          diceAttachment = new AttachmentBuilder(diceImagePath, { name: 'dice-plus2.png' });
        } else {
          const diceFallback = await generateSpecialDiceImage('+2', player.team);
          diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-plus2.png' });
        }
      } catch (error) {
        const diceFallback = await generateSpecialDiceImage('+2', player.team);
        diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-plus2.png' });
      }

      const teamEmoji = player.team === 'red' ? '🔴' : '⚫';
      const teamName = player.team === 'red' ? 'الأحمر' : 'الأسود';

      await roundMsg.edit({
        content: `🎉 **<@${player.id}>** حصل على مكعب المكافأة **+2**!\nكل عضو في ${teamEmoji} **الفريق ${teamName}** حصل على +2 نقطة!\n**المجموع:** ${totalPoints} نقطة للفريق! 🚀`,
        files: [diceAttachment],
        components: []
      });


      try {
        for (const member of teamMembers) {
          let playerPoints = await dbq.get(`points_${message.guild.id}.${member.id}`) || 0;
          playerPoints += pointsPerMember;
          await dbq.set(`points_${message.guild.id}.${member.id}`, playerPoints);
        }
      } catch (error) {
        console.error('Error updating player points:', error);
      }
    } catch (error) {
      console.error('Error processing plus2 dice:', error);
    }
  }


  async function processPlus4Dice(message, player, roundMsg, data) {
    try {
      const teamMembers = player.team === 'red' ? data.redTeam : data.blackTeam;
      const pointsPerMember = 4;
      const totalPoints = teamMembers.length * pointsPerMember;
      
      teamMembers.forEach(member => {
        member.totalScore += pointsPerMember;
      });
      
      if (player.team === 'red') {
        data.redScore += totalPoints;
      } else {
        data.blackScore += totalPoints;
      }

      data.playerScores[player.id].push({
        round: data.roundNumber,
        roll: totalPoints,
        action: 'plus4_team'
      });

      data.teamHistory.push({
        round: data.roundNumber,
        player: player.displayName,
        team: player.team,
        action: 'plus4_team',
        result: totalPoints
      });


      const diceFolder = player.team === 'red' ? 'dice1' : 'dice2';
      const diceImagePath = `./photo/${diceFolder}/+4.png`;
      let diceAttachment;
      
      try {
        if (fs.existsSync(diceImagePath)) {
          diceAttachment = new AttachmentBuilder(diceImagePath, { name: 'dice-plus4.png' });
        } else {
          const diceFallback = await generateSpecialDiceImage('+4', player.team);
          diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-plus4.png' });
        }
      } catch (error) {
        const diceFallback = await generateSpecialDiceImage('+4', player.team);
        diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-plus4.png' });
      }

      const teamEmoji = player.team === 'red' ? '🔴' : '⚫';
      const teamName = player.team === 'red' ? 'الأحمر' : 'الأسود';

      await roundMsg.edit({
        content: `🎉✨ **<@${player.id}>** حصل على مكعب **+4**!\nكل عضو في ${teamEmoji} **الفريق ${teamName}** حصل على +4 نقطة!\n**المجموع:** ${totalPoints} نقطة للفريق! 🎊`,
        files: [diceAttachment],
        components: []
      });

      try {
        for (const member of teamMembers) {
          let playerPoints = await dbq.get(`points_${message.guild.id}.${member.id}`) || 0;
          playerPoints += pointsPerMember;
          await dbq.set(`points_${message.guild.id}.${member.id}`, playerPoints);
        }
      } catch (error) {
        console.error('Error updating player points:', error);
      }
    } catch (error) {
      console.error('Error processing plus4 dice:', error);
    }
  }


  async function processStealDice(message, player, roundMsg, data) {
    try {
      const allPlayers = [...data.redTeam, ...data.blackTeam];
      const otherPlayers = allPlayers.filter(p => p.id !== player.id && p.totalScore > 0);


      const diceFolder = player.team === 'red' ? 'dice1' : 'dice2';
      const diceImagePath = `./photo/${diceFolder}/steal.png`;
      let diceAttachment;
      
      try {
        if (fs.existsSync(diceImagePath)) {
          diceAttachment = new AttachmentBuilder(diceImagePath, { name: 'dice-steal.png' });
        } else {
          const diceFallback = await generateSpecialDiceImage('steal', player.team);
          diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-steal.png' });
        }
      } catch (error) {
        const diceFallback = await generateSpecialDiceImage('steal', player.team);
        diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-steal.png' });
      }

      if (otherPlayers.length === 0) {
        await roundMsg.edit({
          content: `🏴‍☠️ **<@${player.id}>** حصل على مكعب السرقة، لكن لا يوجد لاعبين آخرين لديهم نقاط للسرقة! 😅`,
          files: [diceAttachment],
          components: []
        });

        data.playerScores[player.id].push({
          round: data.roundNumber,
          roll: 0,
          action: 'steal_failed'
        });

        player.rollsCount++;
        data.roundNumber++;
        has_play.set(message.guild.id, data);

        setTimeout(() => {
          startGameRound(message);
        }, 4000);
        return;
      }


      const stealButtons = [];
      let currentRow = new ActionRowBuilder();
      
      for (let i = 0; i < otherPlayers.length; i++) {
        const targetPlayer = otherPlayers[i];
        const teamEmoji = targetPlayer.team === 'red' ? '🔴' : '⚫';
        
        if (currentRow.components.length === 5) {
          stealButtons.push(currentRow);
          currentRow = new ActionRowBuilder();
        }
        
        currentRow.addComponents(
          createButton("DANGER", `steal_${targetPlayer.id}`, `${teamEmoji} ${targetPlayer.displayName} (${targetPlayer.totalScore})`, '🏴‍☠️')
        );
      }
      
      if (currentRow.components.length > 0) {
        stealButtons.push(currentRow);
      }

      await roundMsg.edit({
        content: `🏴‍☠️ **<@${player.id}>** حصل على مكعب السرقة!\nاختر اللاعب الذي تريد سرقة نصف نقاطه:\n\n⏱️ لديك **20 ثانية** للاختيار:`,
        files: [diceAttachment],
        components: stealButtons
      });


      const stealCollector = roundMsg.createMessageComponentCollector({ 
        filter: i => i.user.id === player.id && i.customId.startsWith('steal_'),
        time: 20000 
      });

      stealCollector.on('collect', async inter => {
        try {
          const targetPlayerId = inter.customId.replace('steal_', '');
          const targetPlayer = allPlayers.find(p => p.id === targetPlayerId);
          
          if (!targetPlayer) {
            await inter.reply({ content: 'اللاعب المحدد غير موجود!', ephemeral: true });
            return;
          }

          await inter.deferUpdate();


          const stolenPoints = Math.floor(targetPlayer.totalScore / 2);
          

          targetPlayer.totalScore -= stolenPoints;
          

          player.totalScore += stolenPoints;
          

          if (targetPlayer.team === 'red') {
            data.redScore -= stolenPoints;
          } else {
            data.blackScore -= stolenPoints;
          }
          
          if (player.team === 'red') {
            data.redScore += stolenPoints;
          } else {
            data.blackScore += stolenPoints;
          }


          data.playerScores[player.id].push({
            round: data.roundNumber,
            roll: stolenPoints,
            action: 'steal_success',
            target: targetPlayer.displayName
          });

          const playerTeamEmoji = player.team === 'red' ? '🔴' : '⚫';
          const targetTeamEmoji = targetPlayer.team === 'red' ? '🔴' : '⚫';

          await roundMsg.edit({
            content: `🏴‍☠️💰 **<@${player.id}>** ${playerTeamEmoji} سرق **${stolenPoints}** نقطة من **${targetPlayer.displayName}** ${targetTeamEmoji}!`,
            files: [diceAttachment],
            components: []
          });

          player.rollsCount++;
          data.roundNumber++;
          has_play.set(message.guild.id, data);

          setTimeout(() => {
            startGameRound(message);
          }, 4000);

        } catch (error) {
          console.error('Error processing steal action:', error);
        }
      });

      stealCollector.on('end', async (collected) => {
        if (collected.size === 0) {
          await roundMsg.edit({
            content: `⏰ **<@${player.id}>** لم يختر أحداً للسرقة في الوقت المحدد! ضاعت الفرصة! 😅`,
            files: [diceAttachment],
            components: []
          });

          data.playerScores[player.id].push({
            round: data.roundNumber,
            roll: 0,
            action: 'steal_timeout'
          });

          player.rollsCount++;
          data.roundNumber++;
          has_play.set(message.guild.id, data);

          setTimeout(() => {
            startGameRound(message);
          }, 3000);
        }
      });

    } catch (error) {
      console.error('Error processing steal dice:', error);
    }
  }

  async function processBlockDice(message, player, roundMsg, data) {
    try {
      const allPlayers = [...data.redTeam, ...data.blackTeam];
      const otherPlayers = allPlayers.filter(p => p.id !== player.id);


      const diceFolder = player.team === 'red' ? 'dice1' : 'dice2';
      const diceImagePath = `./photo/${diceFolder}/no.png`;
      let diceAttachment;
      
      try {
        if (fs.existsSync(diceImagePath)) {
          diceAttachment = new AttachmentBuilder(diceImagePath, { name: 'dice-block.png' });
        } else {
          const diceFallback = await generateSpecialDiceImage('no', player.team);
          diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-block.png' });
        }
      } catch (error) {
        const diceFallback = await generateSpecialDiceImage('no', player.team);
        diceAttachment = new AttachmentBuilder(diceFallback, { name: 'dice-block.png' });
      }

      if (otherPlayers.length === 0) {
        await roundMsg.edit({
          content: `🚫 **<@${player.id}>** حصل على مكعب المنع، لكن لا يوجد لاعبين آخرين للمنع! 😅`,
          files: [diceAttachment],
          components: []
        });
        player.rollsCount++;
        data.roundNumber++;
        has_play.set(message.guild.id, data);
        setTimeout(() => startGameRound(message), 4000);
        return;
      }


      const blockButtons = [];
      let currentRow = new ActionRowBuilder();
      
      for (let i = 0; i < otherPlayers.length; i++) {
        const targetPlayer = otherPlayers[i];
        const teamEmoji = targetPlayer.team === 'red' ? '🔴' : '⚫';
        
        if (currentRow.components.length === 5) {
          blockButtons.push(currentRow);
          currentRow = new ActionRowBuilder();
        }
        
        currentRow.addComponents(
          createButton("DANGER", `block_${targetPlayer.id}`, `${teamEmoji} ${targetPlayer.displayName}`, '🚫')
        );
      }
      
      if (currentRow.components.length > 0) {
        blockButtons.push(currentRow);
      }

      await roundMsg.edit({
        content: `🚫 **<@${player.id}>** حصل على مكعب المنع!\nاختر اللاعب الذي تريد تخطي دوره في المرة القادمة التي يختاره البوت:\n\n⏱️ لديك **20 ثانية** للاختيار:`,
        files: [diceAttachment],
        components: blockButtons
      });

      const blockCollector = roundMsg.createMessageComponentCollector({ 
        filter: i => i.user.id === player.id && i.customId.startsWith('block_'),
        time: 20000 
      });

      blockCollector.on('collect', async inter => {
        try {
          const targetPlayerId = inter.customId.replace('block_', '');
          const targetPlayer = allPlayers.find(p => p.id === targetPlayerId);
          
          if (!targetPlayer) {
            await inter.reply({ content: 'اللاعب المحدد غير موجود!', ephemeral: true });
            return;
          }

          await inter.deferUpdate();

          if (!data.blockedPlayers.includes(targetPlayerId)) {
            data.blockedPlayers.push(targetPlayerId);
          }

          const playerTeamEmoji = player.team === 'red' ? '🔴' : '⚫';
          const targetTeamEmoji = targetPlayer.team === 'red' ? '🔴' : '⚫';

          await roundMsg.edit({
            content: `🚫💨 **<@${player.id}>** ${playerTeamEmoji} منع **${targetPlayer.displayName}** ${targetTeamEmoji}!\nسيتم تخطي دور **${targetPlayer.displayName}** في المرة القادمة التي يختاره البوت! 🚫`,
            files: [diceAttachment],
            components: []
          });

          player.rollsCount++;
          data.roundNumber++;
          has_play.set(message.guild.id, data);

          setTimeout(() => {
            startGameRound(message);
          }, 4000);

        } catch (error) {
          console.error('Error processing block action:', error);
        }
      });

      blockCollector.on('end', async (collected) => {
        if (collected.size === 0) {
          await roundMsg.edit({
            content: `⏰ **<@${player.id}>** لم يختر أحداً لمنعه في الوقت المحدد! ضاعت الفرصة! 😅`,
            files: [diceAttachment],
            components: []
          });
          player.rollsCount++;
          data.roundNumber++;
          has_play.set(message.guild.id, data);
          setTimeout(() => startGameRound(message), 3000);
        }
      });

    } catch (error) {
      console.error('Error processing block dice:', error);
    }
  }


  client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    
    const args = message.content.split(" ");
    
    if (args[0] === prefix + "نرد") {
      try {

        const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
        if (!commandChannel || message.channel.id !== commandChannel) return;
        

        const mgames = await dbq.get(`managergamess_${message.guild.id}`);
        if (!message.member.roles.cache.has(mgames) && !owners.includes(message.author.id)) return;
        

        if (has_play.get(message.guild.id)) {
          return message.reply({ content: `🛑 - هناك بالفعل لعبة فعالة في هذا السيرفر!` });
        }


        const storedTime = await dbq.get(`timerdice_${message.author.id}`) || 30000;
        const data = {
          author: message.author.id,
          players: [],
          start_in: Date.now() + storedTime,
          type: "dice",
          maxPlayers: 20,
          minPlayers: 2,
          gameState: "waiting",
          redTeam: [],
          blackTeam: [],
          redScore: 0,
          blackScore: 0,
          currentPlayer: null,
          currentPlayerIndex: 0,
          roundNumber: 1,
          maxRounds: 15,
          playerScores: {},
          teamHistory: [],
          lastPlayerIndex: undefined,
          blockedPlayers: []
        };


        let attachment;
        const diceImage = `./imager/diceimage_${message.guild.id}.png`;
        
        try {
          if (fs.existsSync(diceImage)) {
            attachment = new AttachmentBuilder(diceImage);
          } else {
            attachment = new AttachmentBuilder(`./photo/dice.png`);
          }
        } catch (error) {
          attachment = new AttachmentBuilder(`./photo/dice.png`);
        }

        const content_time1 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>**`;
        let content_players1 = `**(0 / ${data.maxPlayers})**`;


        const row = new ActionRowBuilder().addComponents(
          createButton("SECONDARY", "join_dice", "انضم للعبة", '1243848352026591274'),
          createButton("SECONDARY", "leave_dice", "غادر اللعبة", '1243848354535047230'),
          createButton("SECONDARY", "explain_dice", "طريقة اللعب", '1254234763699687476')
        );

        const msg = await message.channel.send({ 
          content: `${content_time1}\n${content_players1}`, 
          files: [attachment], 
          components: [row] 
        });

        if (!msg) return;
        
        has_play.set(message.guild.id, data);
        const start_c = msg.createMessageComponentCollector({ time: storedTime });
        

        async function updateCounter() {
          const currentData = has_play.get(message.guild.id);
          if (!currentData) return;
          
          const counter = currentData.players.length;
          const content_players2 = `**(${counter} / ${currentData.maxPlayers})**`;
          
          try {
            await msg.edit({ 
              content: `${content_time1}\n${content_players2}`, 
              components: [row] 
            });
          } catch (error) {
            console.error('Error updating counter:', error);
          }
        }


        start_c.on("collect", async inter => {
          try {
            const currentData = has_play.get(message.guild.id);
            if (!currentData) return;

            if (inter.customId === "join_dice") {

              if (currentData.players.find(u => u.id === inter.user.id)) {
                return inter.reply({ content: `لقد انضممت للعبة بالفعل!`, ephemeral: true });
              }
              

              if (currentData.players.length >= currentData.maxPlayers) {
                return inter.reply({ 
                  content: `عذراً، اكتمل عدد اللاعبين! الحد الأقصى ${currentData.maxPlayers} لاعب.`, 
                  ephemeral: true 
                });
              }


              currentData.players.push({
                id: inter.user.id,
                username: inter.user.username,
                displayName: inter.user.displayName || inter.user.username,
                avatar: inter.user.displayAvatarURL({ dynamic: true }),
                totalScore: 0,
                rollsCount: 0,
                team: null
              });
              
              currentData.playerScores[inter.user.id] = [];
              has_play.set(message.guild.id, currentData);
              
              await updateCounter();
              await inter.reply({ 
                content: `🎲 تم انضمامك للعبة بنجاح! سيتم توزيعك على فريق عشوائياً!`, 
                ephemeral: true 
              });

            } else if (inter.customId === "leave_dice") {
              const playerIndex = currentData.players.findIndex(p => p.id === inter.user.id);
              if (playerIndex === -1) {
                return inter.reply({ content: `أنت لست منضماً للعبة!`, ephemeral: true });
              }

              currentData.players.splice(playerIndex, 1);
              delete currentData.playerScores[inter.user.id];
              
              has_play.set(message.guild.id, currentData);
              await updateCounter();
              await inter.reply({ content: `✅ تم خروجك من اللعبة.`, ephemeral: true });

            } else if (inter.customId === "explain_dice") {
              await inter.reply({
                content: `
**🎲 طريقة لعب النرد بالفرق:**

🎯 **الهدف:** الفريق الذي يجمع أكثر النقاط يفوز!

⚡ **قواعد اللعب:**
• يتم توزيع اللاعبين على فريقين: 🔴 **الأحمر** و ⚫ **الأسود**
• كل لاعب في دوره يختار: **ارمي النرد** أو **تخطي**
• النرد يعطي **1-6 نقاط** عشوائياً
• النقاط تُضاف لفريق اللاعب
• **${currentData.maxRounds} جولة** للعبة الكاملة

🎮 **آلية اللعب:**
• البوت يختار لاعباً عشوائياً من أي فريق
• اللاعب لديه **30 ثانية** لاتخاذ قرار
• **ارمي النرد:** احصل على نقاط لفريقك
• **تخطي:** تمرير الدور للاعب التالي

🎲 **أنواع المكعبات الخاصة:**
• **النرد العادي (1-6):** نقاط عادية
• **مكعب -4:** يقلل 4 نقاط من الفريق
• **مكعب -6:** يقلل 6 نقاط من الفريق
• **مكعب x2:** يضعف نقاط اللاعب
• **مكعب السرقة:** سرقة نصف نقاط لاعب آخر
• **مكعب +2:** يعطي نقطتين لكل عضو في الفريق
• **مكعب +4:** يعطي 4 نقاط لكل عضو في الفريق
• **مكعب المنع:** منع لاعب من اللعب مرة واحدة عند اختياره

🏆 **النقاط والفوز:**
• نقاط النرد: **1-6 نقاط** لكل رمية
• الفريق الفائز: **+10 نقاط عامة** لكل عضو
• الفريق الخاسر: **+3 نقاط عامة** لكل عضو
• أفضل لاعب (أكثر نقاط): **+5 نقاط إضافية**

**استعدوا للمنافسة الملحمية!** 🔥`,
                ephemeral: true
              });
            }
          } catch (error) {
            console.error('Error in collector:', error);
          }
        });
        

        start_c.on("end", async () => {
          try {
            const currentData = has_play.get(message.guild.id);
            if (!currentData) return;

            const content_players4 = `**(${currentData.players.length} / ${currentData.maxPlayers})**`;
            
            try {
              await msg.edit({ content: content_players4, components: [] });
            } catch (error) {
              console.error('Error editing message on end:', error);
            }

            if (currentData.players.length < currentData.minPlayers) {
              has_play.delete(message.guild.id);
              return message.channel.send({ 
                content: `تم إيقاف اللعبة لعدم وجود **${currentData.minPlayers}** لاعبين على الأقل - ⛔.` 
              });
            }

            await message.channel.send({ 
              content: `🎲 ستبدأ لعبة النرد بالفرق خلال 5 ثواني! سيتم توزيع الفرق...` 
            });
            
            setTimeout(() => {
              startDiceGame(message);
            }, 5000);
          } catch (error) {
            console.error('Error in end event:', error);
          }
        });

      } catch (error) {
        console.error('Error in dice command:', error);
        message.reply('❌ حدث خطأ أثناء إنشاء اللعبة.');
      }
    }


    if (args[0] === prefix + "ايقاف_نرد") {
      try {
        const commandChannel = await dbq.get(`smchannel_${message.guild.id}`);
        if (!commandChannel || message.channel.id !== commandChannel) return;

        const mgames = await dbq.get(`managergamess_${message.guild.id}`);
        if (!message.member.roles.cache.has(mgames) && !owners.includes(message.author.id)) {
          return message.reply("❌ ليس لديك الصلاحيات لإيقاف اللعبة.");
        }

        const data = has_play.get(message.guild.id);
        if (data && data.type === "dice") {
          has_play.delete(message.guild.id);
          await message.reply('⏱ تم إيقاف لعبة النرد بالفرق بنجاح.');
        } else {
          message.reply('❌ لا يوجد لعبة نرد قيد التشغيل.');
        }
      } catch (error) {
        console.error('Error stopping dice game:', error);
        message.reply('❌ حدث خطأ أثناء إيقاف اللعبة.');
      }
    }
  });

  async function endGame(message) {
    try {
      const data = has_play.get(message.guild.id);
      if (!data) return;

      const winnerTeam = data.redScore > data.blackScore ? 'red' : 
                        data.blackScore > data.redScore ? 'black' : 'tie';

      const allPlayers = [...data.redTeam, ...data.blackTeam];
      const bestPlayer = allPlayers.reduce((best, current) => 
        current.totalScore > best.totalScore ? current : best
      );

      const finalResultsImage = await generateFinalResultsCanvas(data, winnerTeam, bestPlayer, message.guild.id);
      const attachment = new AttachmentBuilder(finalResultsImage, { name: 'final-results.png' });

      const winnerPoints = 10;
      const loserPoints = 3;
      const bestPlayerBonus = 5;

      try {
        if (winnerTeam !== 'tie') {
          const winners = winnerTeam === 'red' ? data.redTeam : data.blackTeam;
          const losers = winnerTeam === 'red' ? data.blackTeam : data.redTeam;

          for (const player of winners) {
            let playerPoints = await dbq.get(`points_${message.guild.id}.${player.id}`) || 0;
            playerPoints += winnerPoints;
            await dbq.set(`points_${message.guild.id}.${player.id}`, playerPoints);
          }

          for (const player of losers) {
            let playerPoints = await dbq.get(`points_${message.guild.id}.${player.id}`) || 0;
            playerPoints += loserPoints;
            await dbq.set(`points_${message.guild.id}.${player.id}`, playerPoints);
          }
        } else {
          for (const player of allPlayers) {
            let playerPoints = await dbq.get(`points_${message.guild.id}.${player.id}`) || 0;
            playerPoints += Math.floor((winnerPoints + loserPoints) / 2);
            await dbq.set(`points_${message.guild.id}.${player.id}`, playerPoints);
          }
        }

        let bestPlayerPoints = await dbq.get(`points_${message.guild.id}.${bestPlayer.id}`) || 0;
        bestPlayerPoints += bestPlayerBonus;
        await dbq.set(`points_${message.guild.id}.${bestPlayer.id}`, bestPlayerPoints);
      } catch (error) {
        console.error('Error updating points:', error);
      }

      let resultMessage = '';
      const teamEmoji = winnerTeam === 'red' ? '🔴' : winnerTeam === 'black' ? '⚫' : '🤝';
      
      if (winnerTeam === 'tie') {
        resultMessage = `🤝 **تعادل!** النتيجة النهائية: ${data.redScore} - ${data.blackScore}`;
      } else {
        const teamName = winnerTeam === 'red' ? 'الأحمر' : 'الأسود';
        resultMessage = `🎉 **فوز الفريق ${teamName}!** ${teamEmoji}\n📊 النتيجة النهائية: 🔴 ${data.redScore} - ⚫ ${data.blackScore}`;
      }

      resultMessage += `\n\n⭐ **أفضل لاعب:** ${bestPlayer.displayName} (${bestPlayer.totalScore} نقطة)`;
      resultMessage += `\n\n💰 **المكافآت:**`;
      
      if (winnerTeam !== 'tie') {
        resultMessage += `\n🏆 الفائزون: +${winnerPoints} نقطة`;
        resultMessage += `\n🥉 الخاسرون: +${loserPoints} نقطة`;
      } else {
        resultMessage += `\n🤝 جميع اللاعبين: +${Math.floor((winnerPoints + loserPoints) / 2)} نقطة`;
      }
      
      resultMessage += `\n⭐ أفضل لاعب: +${bestPlayerBonus} نقطة إضافية`;

      await message.channel.send({
        content: resultMessage,
        files: [attachment]
      });

      has_play.delete(message.guild.id);

    } catch (error) {
      console.error('Error ending game:', error);
      has_play.delete(message.guild.id);
      message.channel.send('❌ حدث خطأ أثناء إنهاء اللعبة، ولكن تم إيقافها بنجاح.');
    }
  }


  async function generateFinalResultsCanvas(data, winnerTeam, bestPlayer, guildId) {
    try {
      const canvas = createCanvas(1000, 600);
      const ctx = canvas.getContext('2d');
      addRoundRectSupport(ctx);


      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.3, '#16213e');
      gradient.addColorStop(0.7, '#0f3460');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1000, 600);


      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 1000, Math.random() * 600, Math.random() * 40 + 15, 0, 2 * Math.PI);
        ctx.fill();
      }


      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 48px cairo';
      ctx.textAlign = 'center';
      
      if (winnerTeam === 'tie') {
        ctx.fillText('🤝 تعادل ملحمي! 🤝', 500, 80);
      } else {
        const teamName = winnerTeam === 'red' ? 'الأحمر' : 'الأسود';
        const emoji = winnerTeam === 'red' ? '🔴' : '⚫';
        ctx.fillText(`${emoji} فوز الفريق ${teamName}! ${emoji}`, 500, 80);
      }
      

      ctx.shadowColor = 'transparent';


      const scoreBoxGradient = ctx.createLinearGradient(300, 120, 700, 180);
      scoreBoxGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      scoreBoxGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = scoreBoxGradient;
      ctx.beginPath();
      ctx.roundRect(300, 120, 400, 60, 30);
      ctx.fill();


      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(300, 120, 400, 60, 30);
      ctx.stroke();


      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px cairo';
      ctx.textAlign = 'center';
      ctx.fillText(`${data.redScore} - ${data.blackScore}`, 500, 160);


      ctx.font = 'bold 24px cairo';
      ctx.fillText('🔴', 320, 160);
      ctx.fillText('⚫', 680, 160);


      ctx.font = 'bold 20px cairo';
      ctx.fillText(`الجولة ${data.roundNumber - 1}/${data.maxRounds}`, 500, 210);


      const sortedRedTeam = [...data.redTeam].sort((a, b) => b.totalScore - a.totalScore);
      const sortedBlackTeam = [...data.blackTeam].sort((a, b) => b.totalScore - a.totalScore);

      const startY = 250;
      const rowHeight = 40;
      const maxPlayersToShow = 8;


      const redHeaderGradient = ctx.createLinearGradient(50, 220, 450, 250);
      redHeaderGradient.addColorStop(0, '#FF6B6B');
      redHeaderGradient.addColorStop(1, '#FF5722');
      ctx.fillStyle = redHeaderGradient;
      ctx.beginPath();
      ctx.roundRect(50, 220, 400, 30, 15);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('🔴 الفريق الأحمر 🔴', 250, 240);


      for (let i = 0; i < Math.min(sortedRedTeam.length, maxPlayersToShow); i++) {
        const player = sortedRedTeam[i];
        const yPos = startY + (i * rowHeight);
        

        if (player.id === bestPlayer.id) {
          const goldGradient = ctx.createLinearGradient(70, yPos, 430, yPos + 35);
          goldGradient.addColorStop(0, '#FFD700');
          goldGradient.addColorStop(0.5, '#FFA500');
          goldGradient.addColorStop(1, '#FFD700');
          ctx.fillStyle = goldGradient;
        } else {
          const playerGradient = ctx.createLinearGradient(70, yPos, 430, yPos + 35);
          if (i % 2 === 0) {
            playerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            playerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
          } else {
            playerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
            playerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
          }
          ctx.fillStyle = playerGradient;
        }
        
        ctx.beginPath();
        ctx.roundRect(70, yPos, 360, 35, 17);
        ctx.fill();


        if (player.id === bestPlayer.id) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(70, yPos, 360, 35, 17);
          ctx.stroke();
        }


        ctx.fillStyle = player.id === bestPlayer.id ? '#000000' : '#ffffff';
        ctx.font = 'bold 16px cairo';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, 90, yPos + 22);


        ctx.font = '16px cairo';
        ctx.textAlign = 'left';
        let displayName = player.displayName;
        if (displayName.length > 15) {
          displayName = displayName.substring(0, 15) + '...';
        }
        
        if (player.id === bestPlayer.id) {
          ctx.fillText('⭐ ' + displayName, 110, yPos + 22);
        } else {
          ctx.fillText(displayName, 110, yPos + 22);
        }


        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(370, yPos + 5, 50, 25, 12);
        ctx.fill();
        
        ctx.fillStyle = player.id === bestPlayer.id ? '#000000' : '#37474F';
        ctx.font = 'bold 14px cairo';
        ctx.textAlign = 'center';
        ctx.fillText(player.totalScore.toString().padStart(2, '0'), 395, yPos + 20);
      }


      const blackHeaderGradient = ctx.createLinearGradient(550, 220, 950, 250);
      blackHeaderGradient.addColorStop(0, '#616161');
      blackHeaderGradient.addColorStop(1, '#424242');
      ctx.fillStyle = blackHeaderGradient;
      ctx.beginPath();
      ctx.roundRect(550, 220, 400, 30, 15);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('⚫ الفريق الأسود ⚫', 750, 240);


      for (let i = 0; i < Math.min(sortedBlackTeam.length, maxPlayersToShow); i++) {
        const player = sortedBlackTeam[i];
        const yPos = startY + (i * rowHeight);
        

        if (player.id === bestPlayer.id) {
          const goldGradient = ctx.createLinearGradient(570, yPos, 930, yPos + 35);
          goldGradient.addColorStop(0, '#FFD700');
          goldGradient.addColorStop(0.5, '#FFA500');
          goldGradient.addColorStop(1, '#FFD700');
          ctx.fillStyle = goldGradient;
        } else {
          const playerGradient = ctx.createLinearGradient(570, yPos, 930, yPos + 35);
          if (i % 2 === 0) {
            playerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            playerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
          } else {
            playerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
            playerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
          }
          ctx.fillStyle = playerGradient;
        }
        
        ctx.beginPath();
        ctx.roundRect(570, yPos, 360, 35, 17);
        ctx.fill();

        if (player.id === bestPlayer.id) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(570, yPos, 360, 35, 17);
          ctx.stroke();
        }


        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(580, yPos + 5, 50, 25, 12);
        ctx.fill();
        
        ctx.fillStyle = player.id === bestPlayer.id ? '#000000' : '#37474F';
        ctx.font = 'bold 14px cairo';
        ctx.textAlign = 'center';
        ctx.fillText(player.totalScore.toString().padStart(2, '0'), 605, yPos + 20);


        ctx.fillStyle = player.id === bestPlayer.id ? '#000000' : '#ffffff';
        ctx.font = '16px cairo';
        ctx.textAlign = 'left';
        let displayName = player.displayName;
        if (displayName.length > 15) {
          displayName = displayName.substring(0, 15) + '...';
        }
        
        if (player.id === bestPlayer.id) {
          ctx.fillText('⭐ ' + displayName, 640, yPos + 22);
        } else {
          ctx.fillText(displayName, 640, yPos + 22);
        }


        ctx.fillStyle = player.id === bestPlayer.id ? '#000000' : '#ffffff';
        ctx.font = 'bold 16px cairo';
        ctx.textAlign = 'right';
        ctx.fillText(`${i + 1}`, 910, yPos + 22);
      }


      const bestPlayerY = 540;
      const bestPlayerGradient = ctx.createLinearGradient(200, bestPlayerY, 800, bestPlayerY + 40);
      bestPlayerGradient.addColorStop(0, '#FFD700');
      bestPlayerGradient.addColorStop(0.5, '#FFA500');
      bestPlayerGradient.addColorStop(1, '#FFD700');
      ctx.fillStyle = bestPlayerGradient;
      ctx.beginPath();
      ctx.roundRect(200, bestPlayerY, 600, 40, 20);
      ctx.fill();


      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(200, bestPlayerY, 600, 40, 20);
      ctx.stroke();


      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px cairo';
      ctx.textAlign = 'center';
      ctx.fillText(`⭐ أفضل لاعب: ${bestPlayer.displayName} (${bestPlayer.totalScore} نقطة) ⭐`, 500, bestPlayerY + 27);

      return canvas.toBuffer();
    } catch (error) {
      console.error('Error generating final results canvas:', error);
      throw error;
    }
  }


  function cleanupGame(guildId, reason = 'unknown') {
    console.log(`Cleaning up game for guild ${guildId}, reason: ${reason}`);
    has_play.delete(guildId);
  }

  client.on('disconnect', () => {
    console.log('Bot disconnected, cleaning up all games...');
    has_play.clear();
  });

  client.on('ready', () => {
    console.log('Bot reconnected, clearing any remaining game data...');
    has_play.clear();
  });
}

module.exports = { execute };
