const { Client, GatewayIntentBits, Collection, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners, isGameRunning, setGameRunning } = utils;


  const activeRPSGames = new Map();


  async function getCustomColors(guildId) {
    try {
      const customColor = await dbq.get(`custom_color_${guildId}`);
      if (customColor) {
        return {
          baseColor: customColor,
          lightColor: lightenColor(customColor, 20),
          darkColor: darkenColor(customColor, 20)
        };
      }
    } catch (error) {
      console.warn('استخدام الألوان الافتراضية');
    }
    

    return {
      baseColor: ' #082838',
      lightColor: '#764ba2',
      darkColor: '#4a5c96'
    };
  }


  function lightenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  function darkenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  }

  /**
   * الحصول على إيموجي النقاط المخصص للمستخدم
   */
  async function getUserGameEmoji(userId, guildId, dbq) {
    try {
      const selectedEmoji = await dbq.get(`selected_game_emoji_${guildId}.${userId}`);
      if (!selectedEmoji) return '🧩';
      
      const userEmojis = await dbq.get(`game_emojis_${guildId}.${userId}`) || {};
      const emojiData = userEmojis[selectedEmoji];
      
      return emojiData ? emojiData.emoji : '🧩';
    } catch (error) {
      console.error('Error in getUserGameEmoji:', error);
      return '🧩';
    }
  }


  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }


  async function loadAvatarImage(avatarUrl, username) {
    try {

      const pngUrl = avatarUrl.replace(/\.webp(\?.*)?$/, '.png$1');
      const image = await loadImage(pngUrl);
      return image;
      
    } catch (error) {
      console.error(`خطأ في تحميل الأفاتار لـ ${username}:`, error);
      

      try {
        const fallbackUrl = avatarUrl.replace(/\.(webp|gif)(\?.*)?$/, '.png?size=128');
        const fallbackImage = await loadImage(fallbackUrl);
        return fallbackImage;
        
      } catch (fallbackError) {
        console.error(`فشل في تحميل الأفاتار البديل لـ ${username}:`, fallbackError);
        

        const defaultCanvas = createCanvas(128, 128);
        const defaultCtx = defaultCanvas.getContext('2d');
        

        defaultCtx.fillStyle = '#7289da';
        defaultCtx.fillRect(0, 0, 128, 128);
        
        defaultCtx.fillStyle = '#ffffff';
        defaultCtx.font = 'bold 60px cairo';
        defaultCtx.textAlign = 'center';
        defaultCtx.fillText('👤', 64, 80);
        
        const defaultBuffer = defaultCanvas.toBuffer();
        return await loadImage(defaultBuffer);
      }
    }
  }


  async function createBattleImage(player1, player2, guildId) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');
    

    const colors = await getCustomColors(guildId);
    

    try {
      const fontPath = './photo/Cairo.ttf';
      if (fs.existsSync(fontPath)) {
        registerFont(fontPath, { family: 'Cairo' });
      }
    } catch (error) {
      console.warn('تعذر تحميل الخط العربي');
    }
    

    try {
      let backgroundPath;
      

      const customVsPath = `./imager/rpsvsimage_${guildId}.png`;
      if (fs.existsSync(customVsPath)) {
        backgroundPath = customVsPath;
        console.log('استخدام صورة VS مخصصة:', backgroundPath);
      } else {

        backgroundPath = './photo/vs.png';
        if (!fs.existsSync(backgroundPath)) {
          throw new Error('لم يتم العثور على صورة VS');
        }
      }
      
      const backgroundImage = await loadImage(backgroundPath);

      ctx.drawImage(backgroundImage, 0, 0, 800, 450);
      
    } catch (error) {
      console.warn('استخدام الخلفية المخصصة:', error);
      

      const gradient = ctx.createLinearGradient(0, 0, 800, 450);
      gradient.addColorStop(0, colors.lightColor);
      gradient.addColorStop(0.3, colors.baseColor);
      gradient.addColorStop(0.7, colors.baseColor);
      gradient.addColorStop(1, colors.darkColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 450);
    }
    
    try {

      const avatar1 = await loadAvatarImage(player1.avatar, player1.username);
      

      ctx.save();
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(200, 225, 100, 0, Math.PI * 2);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#00ff88';
      ctx.stroke();
      

      ctx.beginPath();
      ctx.arc(200, 225, 90, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.shadowBlur = 0;
      

      ctx.beginPath();
      ctx.arc(200, 225, 85, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar1, 115, 140, 170, 170);
      ctx.restore();
      

      const avatar2 = await loadAvatarImage(player2.avatar, player2.username);
      
      ctx.save();
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(600, 225, 100, 0, Math.PI * 2);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      

      ctx.beginPath();
      ctx.arc(600, 225, 90, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      ctx.beginPath();
      ctx.arc(600, 225, 85, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar2, 515, 140, 170, 170);
      ctx.restore();
      
    } catch (error) {
      console.error('خطأ في رسم صور اللاعبين:', error);
      

      ctx.fillStyle = '#2c3e50';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(200, 225, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(600, 225, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      

      ctx.fillStyle = '#ecf0f1';
      ctx.font = 'bold 80px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('👤', 200, 245);
      ctx.fillText('👤', 600, 245);
    }
    

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    

    drawRoundedRect(ctx, 50, 350, 300, 50, 25);
    ctx.fill();
    

    drawRoundedRect(ctx, 450, 350, 300, 50, 25);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.font = 'bold 28px Cairo, cairo';
    ctx.textAlign = 'center';
    

    ctx.strokeText(player1.username, 200, 380);
    ctx.fillText(player1.username, 200, 380);
    

    ctx.strokeText(player2.username, 600, 380);
    ctx.fillText(player2.username, 600, 380);
    
    return canvas.toBuffer();
  }


  async function createResultImage(player1, choice1, player2, choice2, result, guildId) {
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');
    

    const colors = await getCustomColors(guildId);
    

    try {
      const fontPath = './photo/Cairo.ttf';
      if (fs.existsSync(fontPath)) {
        registerFont(fontPath, { family: 'Cairo' });
      }
    } catch (error) {
      console.warn('تعذر تحميل الخط العربي');
    }
    

    const gradient = ctx.createLinearGradient(0, 0, 800, 500);
    gradient.addColorStop(0, lightenColor(colors.baseColor, 30));
    gradient.addColorStop(0.5, colors.baseColor);
    gradient.addColorStop(1, colors.darkColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 500);
    
    try {

      const avatar1 = await loadAvatarImage(player1.avatar, player1.username);
      

      if (result === 'player2') {
        ctx.filter = 'grayscale(100%) brightness(0.6)';
      }
      

      ctx.save();
      ctx.shadowColor = result === 'player1' ? '#f1c40f' : result === 'player2' ? '#e74c3c' : '#3498db';
      ctx.shadowBlur = result === 'player1' ? 25 : 0;
      ctx.beginPath();
      ctx.arc(150, 180, 90, 0, Math.PI * 2);
      ctx.lineWidth = 10;
      ctx.strokeStyle = result === 'player1' ? '#f1c40f' : result === 'player2' ? '#e74c3c' : '#ffffff';
      ctx.stroke();
      

      ctx.beginPath();
      ctx.arc(150, 180, 80, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar1, 70, 100, 160, 160);
      ctx.restore();
      ctx.filter = 'none';
      

      const avatar2 = await loadAvatarImage(player2.avatar, player2.username);
      
      if (result === 'player1') {
        ctx.filter = 'grayscale(100%) brightness(0.6)';
      }
      
      ctx.save();
      ctx.shadowColor = result === 'player2' ? '#f1c40f' : result === 'player1' ? '#e74c3c' : '#3498db';
      ctx.shadowBlur = result === 'player2' ? 25 : 0;
      ctx.beginPath();
      ctx.arc(650, 180, 90, 0, Math.PI * 2);
      ctx.lineWidth = 10;
      ctx.strokeStyle = result === 'player2' ? '#f1c40f' : result === 'player1' ? '#e74c3c' : '#ffffff';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(650, 180, 80, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar2, 570, 100, 160, 160);
      ctx.restore();
      ctx.filter = 'none';
      
    } catch (error) {
      console.error('خطأ في رسم صور اللاعبين في النتيجة:', error);
      

      ctx.fillStyle = result === 'player2' ? '#7f8c8d' : '#34495e';
      ctx.strokeStyle = result === 'player1' ? '#f1c40f' : result === 'player2' ? '#e74c3c' : '#ffffff';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(150, 180, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = result === 'player1' ? '#7f8c8d' : '#34495e';
      ctx.strokeStyle = result === 'player2' ? '#f1c40f' : result === 'player1' ? '#e74c3c' : '#ffffff';
      ctx.beginPath();
      ctx.arc(650, 180, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      

      ctx.fillStyle = '#ecf0f1';
      ctx.font = 'bold 100px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('👤', 150, 210);
      ctx.fillText('👤', 650, 210);
    }
    

    try {
      if (result === 'player1') {

        const crownImage = await loadImage('./photo/crown.png');
        ctx.drawImage(crownImage, 120, 80, 60, 60);
        

        const bheartImage = await loadImage('./photo/bheart.png');
        ctx.drawImage(bheartImage, 620, 80, 60, 60);
        
      } else if (result === 'player2') {

        const bheartImage = await loadImage('./photo/bheart.png');
        ctx.drawImage(bheartImage, 120, 80, 60, 60);
        

        const crownImage = await loadImage('./photo/crown.png');
        ctx.drawImage(crownImage, 620, 80, 60, 60);
        
      } else {

        ctx.font = '60px cairo';
        ctx.textAlign = 'center';
        ctx.fillText('🤝', 150, 110);
        ctx.fillText('🤝', 650, 110);
      }
    } catch (error) {
      console.warn('استخدام الإيموجيات بدلاً من الصور:', error);

      ctx.font = '60px cairo';
      ctx.textAlign = 'center';
      if (result === 'player1') {
        ctx.fillText('👑', 150, 110);
        ctx.fillText('💔', 650, 110);
      } else if (result === 'player2') {
        ctx.fillText('💔', 150, 110);
        ctx.fillText('👑', 650, 110);
      } else {
        ctx.fillText('🤝', 150, 110);
        ctx.fillText('🤝', 650, 110);
      }
    }
    

    const choiceFiles = {
      'rock': './photo/rock.png',
      'paper': './photo/paper.png', 
      'scissors': './photo/scissors.png'
    };
    

    try {
      const choice1Image = await loadImage(choiceFiles[choice1]);
      
      ctx.save();
      ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(25, 42, 86, 0.4)';
      
      const x1 = 270, y1 = 140, width1 = 100, height1 = 100;
      drawRoundedRect(ctx, x1, y1, width1, height1, 20);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.clip();
      ctx.drawImage(choice1Image, x1 + 10, y1 + 10, width1 - 20, height1 - 20);
      ctx.restore();
      
    } catch (e) {
      console.warn('استخدام إيموجي للخيار الأول:', e);
      
      ctx.save();
      ctx.fillStyle = 'rgba(25, 42, 86, 0.4)';
      
      const x1 = 270, y1 = 140, width1 = 100, height1 = 100;
      drawRoundedRect(ctx, x1, y1, width1, height1, 20);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '60px cairo';
      ctx.textAlign = 'center';
      const choiceEmojis = { 'rock': '🪨', 'paper': '📄', 'scissors': '✂️' };
      ctx.fillText(choiceEmojis[choice1], x1 + width1/2, y1 + height1/2 + 20);
      ctx.restore();
    }
    

    try {
      const choice2Image = await loadImage(choiceFiles[choice2]);
      
      ctx.save();
      ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(25, 42, 86, 0.4)';
      
      const x2 = 430, y2 = 140, width2 = 100, height2 = 100;
      drawRoundedRect(ctx, x2, y2, width2, height2, 20);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.clip();
      ctx.drawImage(choice2Image, x2 + 10, y2 + 10, width2 - 20, height2 - 20);
      ctx.restore();
      
    } catch (e) {
      console.warn('استخدام إيموجي للخيار الثاني:', e);
      
      ctx.save();
      ctx.fillStyle = 'rgba(25, 42, 86, 0.4)';
      
      const x2 = 430, y2 = 140, width2 = 100, height2 = 100;
      drawRoundedRect(ctx, x2, y2, width2, height2, 20);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '60px cairo';
      ctx.textAlign = 'center';
      const choiceEmojis = { 'rock': '🪨', 'paper': '📄', 'scissors': '✂️' };
      ctx.fillText(choiceEmojis[choice2], x2 + width2/2, y2 + height2/2 + 20);
      ctx.restore();
    }
    


    try {

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(320, 320, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      

      const avatar1 = await loadAvatarImage(player1.avatar, player1.username);
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(320, 320, 30, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar1, 290, 290, 60, 60);
      ctx.restore();
      
    } catch (error) {
      console.warn('استخدام أيقونة بديلة للاعب الأول:', error);
      

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(320, 320, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      

      ctx.fillStyle = '#2c3e50';
      ctx.font = '30px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('👤', 320, 330);
    }
    

    try {

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(480, 320, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      

      const avatar2 = await loadAvatarImage(player2.avatar, player2.username);
      

      ctx.save();
      ctx.beginPath();
      ctx.arc(480, 320, 30, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar2, 450, 290, 60, 60);
      ctx.restore();
      
    } catch (error) {
      console.warn('استخدام أيقونة بديلة للاعب الثاني:', error);
      

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(480, 320, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      

      ctx.fillStyle = '#2c3e50';
      ctx.font = '30px cairo';
      ctx.textAlign = 'center';
      ctx.fillText('👤', 480, 330);
    }
    

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    

    drawRoundedRect(ctx, 270, 380, 100, 35, 15);
    ctx.fill();
    

    drawRoundedRect(ctx, 430, 380, 100, 35, 15);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.font = 'bold 20px Cairo, cairo';
    ctx.textAlign = 'center';
    
    const choiceNames = { 'rock': 'حجر', 'paper': 'ورق', 'scissors': 'مقص' };
    
    ctx.strokeText(choiceNames[choice1], 320, 403);
    ctx.fillText(choiceNames[choice1], 320, 403);
    
    ctx.strokeText(choiceNames[choice2], 480, 403);
    ctx.fillText(choiceNames[choice2], 480, 403);
    

    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.font = 'bold 45px Cairo, cairo';
    ctx.textAlign = 'center';
    
    if (result === 'draw') {
      ctx.strokeText('🤝 تعادل!', 400, 70);
      ctx.fillText('🤝 تعادل!', 400, 70);
    } else {
      try {
        const winImage = await loadImage('./photo/win.png');
        let resultText = result === 'player1' ? `فاز ${player1.username}` : `فاز ${player2.username}`;
        ctx.drawImage(winImage, 280, 30, 40, 40);
        ctx.strokeText(resultText, 430, 70);
        ctx.fillText(resultText, 430, 70);
      } catch (error) {
        console.warn('استخدام إيموجي للفوز:', error);
        let resultText = result === 'player1' ? `🎉 فاز ${player1.username}` : `🎉 فاز ${player2.username}`;
        ctx.strokeText(resultText, 400, 70);
        ctx.fillText(resultText, 400, 70);
      }
    }
    ctx.restore();
    

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    

    drawRoundedRect(ctx, 50, 420, 200, 50, 20);
    ctx.fill();
    

    drawRoundedRect(ctx, 550, 420, 200, 50, 20);
    ctx.fill();
    
    ctx.font = 'bold 28px Cairo, cairo';
    ctx.textAlign = 'center';
    

    ctx.fillStyle = result === 'player1' ? '#00ff88' : result === 'player2' ? '#ff4757' : '#ffffff';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeText(player1.username, 150, 452);
    ctx.fillText(player1.username, 150, 452);
    

    ctx.fillStyle = result === 'player2' ? '#00ff88' : result === 'player1' ? '#ff4757' : '#ffffff';
    ctx.strokeText(player2.username, 650, 452);
    ctx.fillText(player2.username, 650, 452);
    
    return canvas.toBuffer();
  }


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


  function determineWinner(choice1, choice2) {
    if (choice1 === choice2) return 'draw';
    
    const winConditions = {
      'rock': 'scissors',
      'paper': 'rock', 
      'scissors': 'paper'
    };
    
    if (winConditions[choice1] === choice2) return 'player1';
    return 'player2';
  }


  client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    
    const args = message.content.split(' ');
    const command = args[0];
    

    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;


    if (command === prefix + 'حجره') {
      

      if (activeRPSGames.get(message.guild.id)) {
        return message.reply({ content: `🛑 - هناك بالفعل لعبة فعالة في هذا السيرفر!` });
      }
      

      const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) {
        return message.reply({ content: `❌ ليس لديك صلاحية لتشغيل هذه اللعبة!` });
      }

      const storedTime = await dbq.get(`timerRPS_${message.author.id}`) || 10000;
      let time = storedTime;
      let data = {
        author: message.author.id,
        players: [],
        start_in: Date.now() + time,
        type: "rock_paper_scissors",
        currentRound: 0,
        winners: [],
        gameStarted: false
      };

      const playerNumber = 10;

      let attachment;
      const image = `./photo/rps_main.png`;
      
      try {
        if (fs.existsSync(image)) {
          attachment = new AttachmentBuilder(image);
        } else {
          throw new Error('File not found');
        }
      } catch (error) {

        const canvas = createCanvas(500, 350);
        const ctx = canvas.getContext('2d');
        

        const colors = await getCustomColors(message.guild.id);
        

        try {
          const fontPath = './photo/Cairo.ttf';
          if (fs.existsSync(fontPath)) {
            registerFont(fontPath, { family: 'Cairo' });
          }
        } catch (error) {
         
        }
        

        const gradient = ctx.createLinearGradient(0, 0, 500, 350);
        gradient.addColorStop(0, colors.lightColor);
        gradient.addColorStop(1, colors.baseColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 500, 350);
        

        ctx.font = 'bold 60px cairo';
        ctx.textAlign = 'center';
        ctx.fillText('🪨📄✂️', 250, 150);
        

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 40px Cairo, cairo';
        ctx.strokeText('حجر ورق مقص', 250, 220);
        ctx.fillText('حجر ورق مقص', 250, 220);
        

        ctx.font = 'bold 20px Cairo, cairo';
        ctx.lineWidth = 2;
        ctx.strokeText('اضغط دخول للمشاركة!', 250, 280);
        ctx.fillText('اضغط دخول للمشاركة!', 250, 280);
        
        attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rps_main.png' });
      }

      let content_time = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>`;
      let content_players = `(${data.players.length} / ${playerNumber})**`;

      let row = new ActionRowBuilder()
        .addComponents(
          createButton("SECONDARY", `join_rps`, `دخول`, '1243848352026591274'),
          createButton("SECONDARY", `leave_rps`, `خروج`, '1243848354535047230'),
          createButton("SECONDARY", `explain_rps`, `الشرح`, '1254234763699687476')
        );
        
      let row_disabled = new ActionRowBuilder()
        .addComponents(
          createButton("SECONDARY", `join_rps`, `دخول`, '1243848352026591274', true),
          createButton("SECONDARY", `leave_rps`, `خروج`, '1243848354535047230', true),
          createButton("SECONDARY", `explain_rps`, `الشرح`, '1254234763699687476', true)
        );

      let msg = await message.channel.send({ 
        content: `${content_time}\n${content_players}`, 
        files: [attachment], 
        components: [row] 
      }).catch(() => 0);
      
      if (!msg) return;
      activeRPSGames.set(message.guild.id, data);
      
      let start_collector = msg.createMessageComponentCollector({ time: time });

      start_collector.on("collect", async inter => {
        if (!activeRPSGames.get(message.guild.id)) return;
        
        if (inter.customId === "join_rps") {
          if (data.players.find(u => u.id === inter.user.id)) {
            return inter.reply({ content: `لقد سجلت بالفعل.`, ephemeral: true });
          }
          if (data.players.length >= playerNumber) {
            return inter.reply({ content: `عدد المشاركين مكتمل`, ephemeral: true });
          }
          
          data.players.push({
            id: inter.user.id,
            username: inter.user.username,
            avatar: inter.user.displayAvatarURL({ dynamic: false, format: "png", size: 128 }),
            isActive: true
          });
          activeRPSGames.set(message.guild.id, data);

          let content_time2 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>`;
          let content_players2 = `(${data.players.length} / ${playerNumber})**`;

          msg.edit({ content: `${content_time2}\n${content_players2}` }).catch(() => 0);
          inter.reply({ content: `✅ تم إضافتك للعبة بنجاح`, ephemeral: true });
          
        } else if (inter.customId === "leave_rps") {
          let index = data.players.findIndex(i => i.id === inter.user.id);
          if (index === -1) {
            return inter.reply({ content: `❌ - انت غير مشارك بالفعل`, ephemeral: true });
          }
          data.players.splice(index, 1);
          activeRPSGames.set(message.guild.id, data);

          let content_time3 = `**__ستبدأ اللعبة خلال__: <t:${Math.floor(data.start_in / 1000)}:R>`;
          let content_players3 = `(${data.players.length} / ${playerNumber})**`;

          msg.edit({ content: `${content_time3}\n${content_players3}` }).catch(() => 0);
          inter.reply({ content: `✅ تم إزالتك من اللعبة`, ephemeral: true });
          
        } else if (inter.customId === "explain_rps") {
          inter.reply({
            content: `
**طريقة اللعب:**
1- شارك في اللعبة بالضغط على زر الدخول
2- سيتم اختيار لاعبين عشوائياً في كل جولة
3- كل لاعب يختار: حجر 🪨 أو ورق 📄 أو مقص ✂️
4- قوانين الفوز:
   • الحجر يكسر المقص
   • المقص يقطع الورق  
   • الورق يغطي الحجر
5- الفائز يتقدم للجولة التالية
6- آخر لاعب يبقى هو الفائز ويحصل على نقطة

**🎮 المكافآت:**
• الفوز = +1 نقطة عامة`, 
            ephemeral: true
          });
        }
      });

      start_collector.on("end", async (end, reason) => {
        if (!activeRPSGames.get(message.guild.id)) return;

        let content_players4 = `**(${data.players.length}/10)**`;
        msg.edit({ content: `${content_players4}`, components: [row_disabled] }).catch(() => 0);
        
        if (data.players.length < 2) {
          activeRPSGames.delete(message.guild.id);
          return message.channel.send({ content: "⛔ - يجب ان تحتوي اللعبه على `2` اشخاص على الاقل لبدء اللعبة ." });
        }

        data.gameStarted = true;
        activeRPSGames.set(message.guild.id, data);
        
        message.channel.send({ content: `🎮 بدأت اللعبة! بـ ${data.players.length} لاعب` });
        await sleep(2000);
        startGame(message);
      });


      async function startGame(message) {
        let data = activeRPSGames.get(message.guild.id);
        if (!data) return;
        
        let activePlayers = data.players.filter(p => p.isActive);
        
        if (activePlayers.length === 1) {

          const winner = activePlayers[0];
          

          let generalPoints = await dbq.get(`points_${message.guild.id}.${winner.id}`) || 0;
          generalPoints += 1;
          await dbq.set(`points_${message.guild.id}.${winner.id}`, generalPoints);
          

          const userEmoji = await getUserGameEmoji(winner.id, message.guild.id, dbq);
          

          const colors = await getCustomColors(message.guild.id);
          
          const embed = new EmbedBuilder()
            .setTitle('🏆 انتهت اللعبة!')
            .setDescription(`**الفائز النهائي:** <@${winner.id}>\n${userEmoji} **حصل على نقطة عامة واحدة!**`)
            .setColor(colors.baseColor)
            .setThumbnail(winner.avatar);
            
          message.channel.send({ embeds: [embed] });
          activeRPSGames.delete(message.guild.id);
          return;
        }
        
        if (activePlayers.length < 2) {
          message.channel.send({ content: "**تم إيقاف اللعبة لعدم وجود `2` لاعبين على الأقل - ⛔.**" });
          activeRPSGames.delete(message.guild.id);
          return;
        }


        const shuffled = activePlayers.sort(() => Math.random() - 0.5);
        const player1 = shuffled[0];
        const player2 = shuffled[1];
        
        data.currentRound++;
        activeRPSGames.set(message.guild.id, data);
        
        await playRound(message, player1, player2);
      }


      async function playRound(message, player1, player2) {
        let data = activeRPSGames.get(message.guild.id);
        if (!data) return;
        

        const battleImage = await createBattleImage(player1, player2, message.guild.id);
        const battleAttachment = new AttachmentBuilder(battleImage, { name: 'battle.png' });
        
        let gameButtons = new ActionRowBuilder()
          .addComponents(
            createButton("SECONDARY", `rps_rock`, `حجر`,'1401256439909191890'),
            createButton("SECONDARY", `rps_paper`, `ورق`,'1401256441557418145'),
            createButton("SECONDARY", `rps_scissors`, `مقص`,'1401256443277217912')
          );

        let battleMsg = await message.channel.send({
          content: `🥊 **الجولة ${data.currentRound}:**\n<@${player1.id}> **VS** <@${player2.id}>\n⏰ لديكم 15 ثانية للاختيار!`,
          files: [battleAttachment],
          components: [gameButtons]
        });

        let choices = {};
        let responded = [];
        
        let gameCollector = battleMsg.createMessageComponentCollector({ 
          filter: i => (i.user.id === player1.id || i.user.id === player2.id) && !responded.includes(i.user.id),
          time: 15000 
        });

        gameCollector.on("collect", async inter => {
          if (responded.includes(inter.user.id)) return;
          
          responded.push(inter.user.id);
          choices[inter.user.id] = inter.customId.replace('rps_', '');
          
          await inter.reply({ content: `✅ تم تسجيل اختيارك!`, flags: 64 });
          
          if (responded.length === 2) {
            gameCollector.stop();
          }
        });

        gameCollector.on("end", async () => {

          let disabledButtons = new ActionRowBuilder()
            .addComponents(
              createButton("SECONDARY", `rps_rock`, `حجر`, '1401256439909191890', true),
              createButton("SECONDARY", `rps_paper`, `ورق`, '1401256441557418145', true),
              createButton("SECONDARY", `rps_scissors`, `مقص`, '1401256443277217912', true)
            );
          battleMsg.edit({ components: [disabledButtons] });


          const choice1 = choices[player1.id];
          const choice2 = choices[player2.id];
          
          if (!choice1 || !choice2) {

            let winner, loser;
            if (choice1 && !choice2) {
              winner = player1;
              loser = player2;
            } else if (!choice1 && choice2) {
              winner = player2;
              loser = player1;
            } else {

              const random = Math.random() < 0.5;
              winner = random ? player1 : player2;
              loser = random ? player2 : player1;
            }
            
            message.channel.send({ content: `⏰ <@${loser.id}> لم يختر في الوقت المحدد وتم إقصاؤه!` });
            

            let data = activeRPSGames.get(message.guild.id);
            let loserIndex = data.players.findIndex(p => p.id === loser.id);
            if (loserIndex !== -1) {
              data.players[loserIndex].isActive = false;
            }
            activeRPSGames.set(message.guild.id, data);
            
            await sleep(3000);
            return startGame(message);
          }


          const result = determineWinner(choice1, choice2);
          let winner, loser, isDraw = false;
          
          if (result === 'draw') {
            isDraw = true;
          } else if (result === 'player1') {
            winner = player1;
            loser = player2;
          } else {
            winner = player2;
            loser = player1;
          }


          const resultImage = await createResultImage(player1, choice1, player2, choice2, result, message.guild.id);
          const resultAttachment = new AttachmentBuilder(resultImage, { name: 'result.png' });

          if (isDraw) {
            message.channel.send({
              content: `🤝 **تعادل!**\nسيتم إعادة الجولة...`,
              files: [resultAttachment]
            });
            await sleep(3000);
            return playRound(message, player1, player2);
          } else {
            message.channel.send({
              content: `🎉 **فاز:** <@${winner.id}>\n💔 **خسر:** <@${loser.id}>`,
              files: [resultAttachment]
            });
            

            let data = activeRPSGames.get(message.guild.id);
            let loserIndex = data.players.findIndex(p => p.id === loser.id);
            if (loserIndex !== -1) {
              data.players[loserIndex].isActive = false;
            }
            activeRPSGames.set(message.guild.id, data);
            
            await sleep(3000);
            return startGame(message);
          }
        });
      }
    }
  });
}

module.exports = { execute };
