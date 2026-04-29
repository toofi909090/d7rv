const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas');

function execute(client, dbq, has_play, config, utils) {
  const { prefix } = utils;


  try {
    registerFont('./photo/Al Qabas Bold.ttf', { family: 'Al Qabas' });
  } catch (fontError) {
    console.log('ERROR AL QABAS FONT');
  }


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
      baseColor: '#4a9ebb',
      lightColor: '#6bb8d6',
      darkColor: '#2a5f72'
    };
  }


  const gameTypes = {
    'general': {
      name: 'النقاط العامة',
      emoji: '🎮',
      key: 'points',
      crown: '👑'
    },
    'individual': {
      name: 'النقاط الفردية', 
      emoji: '🎯',
      key: 'individual_points',
      crown: '🏆'
    },
    'roulette': {
      name: 'نقاط الروليت',
      emoji: '🕹',
      key: 'roulette_points', 
      crown: '🎰'
    },
    'mafia': {
      name: 'نقاط المافيا',
      emoji: '🕵️',
      key: 'mafia_points',
      crown: '🎭'
    },
    'bomb': {
      name: 'نقاط البومب',
      emoji: '💣',
      key: 'bomb_points',
      crown: '💥'
    },
    'wsl': {
      name: 'نقاط الوصل',
      emoji: '🔗',
      key: 'wsl_points',
      crown: '🔗'
    },
    'hide': {
      name: 'نقاط الهايد',
      emoji: '👻',
      key: 'hide_points',
      crown: '👻'
    },
    'krase': {
      name: 'نقاط الكراسي',
      emoji: '🪑',
      key: 'krase_points',
      crown: '🪑'
    },
    'dice-teams': {
      name: 'نقاط نرد ',
      emoji: '🎲',
      key: 'dice-teams_points',
      crown: '🎲'
    },
    'bra': {
      name: 'نقاط برا السالفة',
      emoji: '💬',
      key: 'bra_points',
      crown: '🗣️'
    }
  };


  function drawCircularImage(ctx, image, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
  }


  function drawGamePodium(ctx, colors) {

    const baseColor = colors.baseColor;
    const podiumSideColor = baseColor;
    const podiumTopColor = colors.lightColor;
    const podiumDarkColor = colors.darkColor;
    

    const centerX = 600;
    const centerY = 300;
    const centerWidth = 200;
    const centerHeight = 160;
    

    const leftX = centerX - centerWidth/2 - 100;
    const leftY = 350;
    const leftWidth = 200;
    const leftHeight = 110;
    

    const rightX = centerX + centerWidth/2 + 100;
    const rightY = 380;
    const rightWidth = 200;
    const rightHeight = 80;
    

    ctx.fillStyle = podiumSideColor;
    ctx.fillRect(leftX - leftWidth/2, leftY, leftWidth, leftHeight);
    
    ctx.fillStyle = podiumTopColor;
    ctx.beginPath();
    ctx.moveTo(leftX - leftWidth/2, leftY);
    ctx.lineTo(leftX - leftWidth/2 + 20, leftY - 20);
    ctx.lineTo(leftX + leftWidth/2 + 20, leftY - 20);
    ctx.lineTo(leftX + leftWidth/2, leftY);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = podiumDarkColor;
    ctx.beginPath();
    ctx.moveTo(leftX + leftWidth/2, leftY);
    ctx.lineTo(leftX + leftWidth/2 + 20, leftY - 20);
    ctx.lineTo(leftX + leftWidth/2 + 20, leftY + leftHeight - 20);
    ctx.lineTo(leftX + leftWidth/2, leftY + leftHeight);
    ctx.closePath();
    ctx.fill();
    

    ctx.fillStyle = podiumSideColor;
    ctx.fillRect(centerX - centerWidth/2, centerY, centerWidth, centerHeight);
    
    ctx.fillStyle = podiumTopColor;
    ctx.beginPath();
    ctx.moveTo(centerX - centerWidth/2, centerY);
    ctx.lineTo(centerX - centerWidth/2 + 25, centerY - 25);
    ctx.lineTo(centerX + centerWidth/2 + 25, centerY - 25);
    ctx.lineTo(centerX + centerWidth/2, centerY);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = podiumDarkColor;
    ctx.beginPath();
    ctx.moveTo(centerX + centerWidth/2, centerY);
    ctx.lineTo(centerX + centerWidth/2 + 25, centerY - 25);
    ctx.lineTo(centerX + centerWidth/2 + 25, centerY + centerHeight - 25);
    ctx.lineTo(centerX + centerWidth/2, centerY + centerHeight);
    ctx.closePath();
    ctx.fill();
    

    ctx.fillStyle = podiumSideColor;
    ctx.fillRect(rightX - rightWidth/2, rightY, rightWidth, rightHeight);
    
    ctx.fillStyle = podiumTopColor;
    ctx.beginPath();
    ctx.moveTo(rightX - rightWidth/2, rightY);
    ctx.lineTo(rightX - rightWidth/2 + 20, rightY - 20);
    ctx.lineTo(rightX + rightWidth/2 + 20, rightY - 20);
    ctx.lineTo(rightX + rightWidth/2, rightY);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = podiumDarkColor;
    ctx.beginPath();
    ctx.moveTo(rightX + rightWidth/2, rightY);
    ctx.lineTo(rightX + rightWidth/2 + 20, rightY - 20);
    ctx.lineTo(rightX + rightWidth/2 + 20, rightY + rightHeight - 20);
    ctx.lineTo(rightX + rightWidth/2, rightY + rightHeight);
    ctx.closePath();
    ctx.fill();
    

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 90px "Al Qabas", cairo';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText('2', leftX, leftY + leftHeight/2);
    ctx.fillText('1', centerX, centerY + centerHeight/2);
    ctx.fillText('3', rightX, rightY + rightHeight/2);
    
    return {
      center: { x: centerX, y: centerY - 30 },
      left: { x: leftX, y: leftY - 30 },
      right: { x: rightX, y: rightY - 30 }
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


  function drawRoundedRect(ctx, x, y, width, height, radius, fillColor) {
    ctx.save();
    ctx.fillStyle = fillColor;
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
    ctx.fill();
    ctx.restore();
  }


  function drawGameBackground(ctx, colors) {
    const baseColor = colors.baseColor;
    

    const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, lightenColor(baseColor, 25));
    gradient.addColorStop(0.3, baseColor);
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(1, darkenColor(baseColor, 25));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);
  }


  function drawBackgroundDecorations(ctx, gameInfo) {

    const dots = [
      { x: 150, y: 100, size: 4, opacity: 0.4 },
      { x: 300, y: 80, size: 3, opacity: 0.3 },
      { x: 450, y: 60, size: 5, opacity: 0.35 },
      { x: 750, y: 90, size: 4, opacity: 0.4 },
      { x: 900, y: 70, size: 3, opacity: 0.3 },
      { x: 1050, y: 110, size: 5, opacity: 0.35 },
      { x: 80, y: 200, size: 6, opacity: 0.25 },
      { x: 200, y: 280, size: 7, opacity: 0.3 },
      { x: 1000, y: 180, size: 6, opacity: 0.25 },
      { x: 1120, y: 260, size: 7, opacity: 0.3 },
      { x: 100, y: 600, size: 4, opacity: 0.35 },
      { x: 250, y: 750, size: 5, opacity: 0.4 },
      { x: 950, y: 650, size: 4, opacity: 0.35 },
      { x: 1100, y: 720, size: 5, opacity: 0.4 }
    ];

    dots.forEach(dot => {
      ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
      ctx.fill();
    });


    ctx.font = '60px cairo';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillText(gameInfo.emoji, 100, 100);
    ctx.fillText(gameInfo.emoji, 1050, 100);
    ctx.fillText(gameInfo.emoji, 100, 750);
    ctx.fillText(gameInfo.emoji, 1050, 750);
  }


  async function createTopImage(guildId, gameType) {
    const gameInfo = gameTypes[gameType];
    const colors = await getCustomColors(guildId);
    const pointsKey = `${gameInfo.key}_${guildId}`;
    const userPointsData = await dbq.get(pointsKey);

    if (!userPointsData) {
      const canvas = createCanvas(1200, 800);
      const ctx = canvas.getContext('2d');

      drawGameBackground(ctx, colors);
      drawBackgroundDecorations(ctx, gameInfo);


      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 52px "Al Qabas", cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${gameInfo.emoji} ${gameInfo.name}`, 600, 300);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 36px "Al Qabas", cairo';
      ctx.fillText('لا توجد بيانات متاحة', 600, 380);

      ctx.font = 'bold 28px "Al Qabas", cairo';
      ctx.fillText('ابدأ اللعب لتظهر النتائج هنا!', 600, 430);

      return canvas.toBuffer();
    }

    const topPlayers = Object.entries(userPointsData)
      .sort(([, pointsA], [, pointsB]) => pointsB - pointsA)
      .filter(([, points]) => points > 0);

    const canvas = createCanvas(1200, 800);
    const ctx = canvas.getContext('2d');


    drawGameBackground(ctx, colors);
    drawBackgroundDecorations(ctx, gameInfo);


    const podiumPositions = drawGamePodium(ctx, colors);


    await drawPlayersOnPodium(ctx, topPlayers, podiumPositions, gameType);


    await drawBottomContainer(ctx, topPlayers.slice(3), gameType, colors);

    return canvas.toBuffer();
  }


  async function drawPlayersOnPodium(ctx, topPlayers, podiumPositions, gameType) {
    const gameInfo = gameTypes[gameType];
    

    if (topPlayers.length > 0) {
      await drawPlayerOnPodium(ctx, topPlayers[0], podiumPositions.center, 130, gameInfo.crown, gameType, 1);
    }


    if (topPlayers.length > 1) {
      await drawPlayerOnPodium(ctx, topPlayers[1], podiumPositions.left, 110, '🥈', gameType, 2);
    }


    if (topPlayers.length > 2) {
      await drawPlayerOnPodium(ctx, topPlayers[2], podiumPositions.right, 100, '🥉', gameType, 3);
    }
  }


  async function drawPlayerOnPodium(ctx, playerData, position, avatarSize, crownEmoji, gameType, rank) {
    const [userId, points] = playerData;
    const cleanUserId = userId.replace(/[<@!>]/g, '');
    const gameInfo = gameTypes[gameType];

    try {
      const user = await client.users.fetch(cleanUserId);
      
      let avatarImage;
      try {
        const avatarURL = user.displayAvatarURL({ 
          extension: 'png', 
          size: 128,
          dynamic: false
        });
        avatarImage = await loadImage(avatarURL);
      } catch (avatarError) {
        const defaultAvatarURL = `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;
        avatarImage = await loadImage(defaultAvatarURL);
      }


      let x, y, crownY, nameY, pointsY;
      
      if (rank === 1) {

        x = 600;
        y = 140;
        crownY = y - avatarSize/2 - 50;
        nameY = y + avatarSize/2 + 35;
        pointsY = y + avatarSize/2 + 70;
      } else if (rank === 2) {

        x = 400;
        y = 210;
        crownY = y - avatarSize/2 - 45;
        nameY = y + avatarSize/2 + 30;
        pointsY = y + avatarSize/2 + 60;
      } else {

        x = 800;
        y = 240;
        crownY = y - avatarSize/2 - 40;
        nameY = y + avatarSize/2 + 25;
        pointsY = y + avatarSize/2 + 50;
      }
      

      ctx.strokeStyle = rank === 1 ? '#FFD700' : '#FFFFFF';
      ctx.lineWidth = rank === 1 ? 10 : rank === 2 ? 8 : 6;
      ctx.beginPath();
      ctx.arc(x, y, avatarSize/2 + 5, 0, Math.PI * 2);
      ctx.stroke();
      

      drawCircularImage(ctx, avatarImage, 
        x - avatarSize/2, 
        y - avatarSize/2, 
        avatarSize
      );


      if (rank === 1) {

        try {
          const crownImage = await loadImage('./photo/crown.png');
          const crownSize = 70;
          const crownX = x - crownSize/2;
          ctx.drawImage(crownImage, crownX, crownY - crownSize/2, crownSize, crownSize);
        } catch (crownError) {

          ctx.font = '60px cairo';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('👑', x, crownY);
        }
      } else if (rank === 2) {

        try {
          const medalImage = await loadImage('./photo/2.png');
          const medalSize = 60;
          const medalX = x - medalSize/2;
          ctx.drawImage(medalImage, medalX, crownY - medalSize/2, medalSize, medalSize);
        } catch (medalError) {

          ctx.font = '50px cairo';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('🥈', x, crownY);
        }
      } else if (rank === 3) {

        try {
          const medalImage = await loadImage('./photo/3.png');
          const medalSize = 55;
          const medalX = x - medalSize/2;
          ctx.drawImage(medalImage, medalX, crownY - medalSize/2, medalSize, medalSize);
        } catch (medalError) {

          ctx.font = '45px cairo';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('🥉', x, crownY);
        }
      }


      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${rank === 1 ? '28' : rank === 2 ? '24' : '22'}px "Al Qabas", cairo`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const displayName = user.displayName || user.username;
      const maxLength = rank === 1 ? 15 : rank === 2 ? 12 : 10;
      const truncatedName = displayName.length > maxLength ? 
        displayName.substring(0, maxLength) + '...' : displayName;
      ctx.fillText(truncatedName, x, nameY);


      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${rank === 1 ? '24' : rank === 2 ? '20' : '18'}px "Al Qabas", cairo`;
      
      const pointsText = `${points}`;
      const textWidth = ctx.measureText(pointsText).width;
      

      const iconSize = rank === 1 ? 30 : rank === 2 ? 26 : 24;
      const totalWidth = textWidth + iconSize + 8;
      const startX = x - totalWidth/2;
      

      ctx.textAlign = 'left';
      ctx.fillText(pointsText, startX, pointsY);


      try {
        const pointImage = await loadImage('./photo/point.png');
        const pointX = startX + textWidth + 5;
        const pointY = pointsY - iconSize/2;
        ctx.drawImage(pointImage, pointX, pointY, iconSize, iconSize);
      } catch (pointError) {

        ctx.font = `${rank === 1 ? '28' : rank === 2 ? '24' : '22'}px cairo`;
        ctx.textAlign = 'left';
        ctx.fillText(gameInfo.emoji, startX + textWidth + 5, pointsY);
      }

    } catch (userError) {
      console.error(`خطأ في جلب بيانات المستخدم:`, userError);
    }
  }


  async function drawBottomContainer(ctx, remainingPlayers, gameType, colors) {
    const gameInfo = gameTypes[gameType];
    
    const containerX = 150;
    const containerY = 480;
    const containerWidth = 900;
    const containerHeight = 300;
    const containerRadius = 45;


    const containerColor = `rgba(${hexToRgb(colors.baseColor).r}, ${hexToRgb(colors.baseColor).g}, ${hexToRgb(colors.baseColor).b}, 0.9)`;
    drawRoundedRect(ctx, containerX, containerY, containerWidth, containerHeight, containerRadius, containerColor);

    const maxDisplayInList = 4;
    const playersToShow = remainingPlayers.slice(0, maxDisplayInList);
    
    const rowHeight = 65;
    const rowWidth = 820;
    const rowX = containerX + 40;
    const startY = containerY + 50;


    for (let i = 0; i < 4; i++) {
      const rank = i + 4;
      const y = startY + (i * rowHeight);
      

      const rowColor = `rgba(${hexToRgb(darkenColor(colors.baseColor, 15)).r}, ${hexToRgb(darkenColor(colors.baseColor, 15)).g}, ${hexToRgb(darkenColor(colors.baseColor, 15)).b}, 0.9)`;
      drawRoundedRect(ctx, rowX, y - 28, rowWidth, 56, 28, rowColor);
      

      ctx.fillStyle = darkenColor(colors.baseColor, 30);
      ctx.beginPath();
      ctx.arc(rowX + 45, y, 23, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "Al Qabas", cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rank.toString(), rowX + 45, y);


      if (i < playersToShow.length) {
        await drawPlayerInList(ctx, playersToShow[i], rowX, y, rowWidth, gameType);
      }
    }


    if (remainingPlayers.length > maxDisplayInList) {
      const morePlayersCount = remainingPlayers.length - maxDisplayInList;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 20px "Al Qabas", cairo';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`و ${morePlayersCount} لاعبين آخرين...`, containerX + containerWidth/2, containerY + containerHeight - 25);
    }
  }


  async function drawPlayerInList(ctx, playerData, rowX, y, rowWidth, gameType) {
    const [userId, points] = playerData;
    const cleanUserId = userId.replace(/[<@!>]/g, '');
    const gameInfo = gameTypes[gameType];

    try {
      const user = await client.users.fetch(cleanUserId);
      
      let avatarImage;
      try {
        const avatarURL = user.displayAvatarURL({ 
          extension: 'png', 
          size: 64,
          dynamic: false
        });
        avatarImage = await loadImage(avatarURL);
      } catch (avatarError) {
        const defaultAvatarURL = `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;
        avatarImage = await loadImage(defaultAvatarURL);
      }


      const smallAvatarSize = 36;
      const avatarX = rowX + 100;
      const avatarY = y - smallAvatarSize/2;
      

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(avatarX + smallAvatarSize/2, avatarY + smallAvatarSize/2, smallAvatarSize/2 + 1, 0, Math.PI * 2);
      ctx.stroke();
      
      drawCircularImage(ctx, avatarImage, avatarX, avatarY, smallAvatarSize);


      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px "Al Qabas", cairo';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const displayName = user.displayName || user.username;
      const truncatedName = displayName.length > 22 ? 
        displayName.substring(0, 22) + '...' : displayName;
      
      const nameX = rowX + 150;
      ctx.fillText(truncatedName, nameX, y);


      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "Al Qabas", cairo';
      ctx.textAlign = 'right';
      
      const pointsText = `${points}`;
      const pointsX = rowX + rowWidth - 80;
      
      ctx.fillText(pointsText, pointsX, y);


      try {
        const pointImage = await loadImage('./photo/point.png');
        const iconSize = 28;
        const iconX = pointsX + 15;
        const iconY = y - iconSize/2;
        ctx.drawImage(pointImage, iconX, iconY, iconSize, iconSize);
      } catch (pointError) {

        ctx.font = '28px cairo';
        ctx.textAlign = 'center';
        ctx.fillText(gameInfo.emoji, pointsX + 35, y);
      }

    } catch (userError) {
      console.error(`خطأ في جلب بيانات المستخدم:`, userError);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "Al Qabas", cairo';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('مستخدم غير موجود', rowX + 150, y);
    }
  }


  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }


  client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;

    if (message.content.startsWith(prefix + 'توب')) {
      try {
        const args = message.content.split(' ').slice(1);
        let gameType = 'general';


        if (args.length > 0) {
          const gameArg = args[0].toLowerCase();
          

          const gameMapping = {
            'عام': 'general',
            'عامة': 'general',
            'general': 'general',
            'فردي': 'individual',
            'فردية': 'individual',
            'individual': 'individual',
            'روليت': 'roulette',
            'roulette': 'roulette',
            'مافيا': 'mafia',
            'mafia': 'mafia',
            'بومب': 'bomb',
            'bomb': 'bomb',
            'برا': 'bra',
            'bra': 'bra',
            'السالفة': 'bra',
            'dice-teams': 'نرد',
            'wsl': 'وصل',
             'krase': 'كراسي',
            'hide': 'هايد',
            'براسالفة': 'bra'
          };

          if (gameMapping[gameArg]) {
            gameType = gameMapping[gameArg];
          }
        }


        const imageBuffer = await createTopImage(message.guild.id, gameType);
        const gameInfo = gameTypes[gameType];

        const attachment = new AttachmentBuilder(imageBuffer, {
          name: `top-${gameType}.png`
        });


        const detailsButton = new ButtonBuilder()
          .setCustomId(`show_top_details_${gameType}`)
          .setLabel('عرض التفاصيل')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('<:magnifier:1377869108464320542>');

        const switchGameButton = new ButtonBuilder()
          .setCustomId('switch_game_type')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('<:game:1400990288272556112>');

        const row = new ActionRowBuilder().addComponents(detailsButton, switchGameButton);

        await message.channel.send({
          files: [attachment],
          components: [row]
        });

      } catch (error) {
        console.error("خطأ في إنشاء صورة التوب:", error);
        message.channel.send("❌ حدث خطأ أثناء إنشاء قائمة أفضل اللاعبين.");
      }
    }
  });


  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    try {

      if (interaction.customId.startsWith('show_top_details_')) {
        const gameType = interaction.customId.replace('show_top_details_', '');
        const gameInfo = gameTypes[gameType];
        const colors = await getCustomColors(interaction.guild.id);
        
        if (!gameInfo) {
          return interaction.reply({
            content: "❌ نوع لعبة غير صحيح.",
            ephemeral: true
          });
        }

        const pointsKey = `${gameInfo.key}_${interaction.guild.id}`;
        const userPointsData = await dbq.get(pointsKey);
        
        if (!userPointsData) {
          return interaction.reply({
            content: `❌ لا يوجد بيانات متاحة لـ${gameInfo.name}.`,
            ephemeral: true
          });
        }

        const topPlayers = Object.entries(userPointsData)
          .sort(([, pointsA], [, pointsB]) => pointsB - pointsA)
          .slice(0, 15)
          .map(([userId, points], index) => {
            let emoji = '';
            switch (index) {
              case 0: emoji = '🥇'; break;
              case 1: emoji = '🥈'; break;
              case 2: emoji = '🥉'; break;
              default: emoji = `${index + 1}.`;
            }
            return `${emoji} <@${userId}>: **${points}** نقطة`;
          });

        if (topPlayers.length === 0) {
          return interaction.reply({
            content: `❌ لا يوجد لاعبين مع نقاط في ${gameInfo.name}.`,
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setColor(colors.baseColor)
          .setTitle(`${gameInfo.emoji} أفضل 15 لاعب في ${gameInfo.name}`)
          .setDescription(topPlayers.join('\n'))
          .setFooter({ 
            text: `إجمالي اللاعبين: ${Object.keys(userPointsData).length} • مرئية لك فقط`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTimestamp();

        await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }


      else if (interaction.customId === 'switch_game_type') {
        const colors = await getCustomColors(interaction.guild.id);
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('select_game_type')
          .setPlaceholder('اختر نوع اللعبة لعرض التوب')
          .addOptions([
            {
              label: 'النقاط العامة',
              description: 'عرض أفضل اللاعبين في النقاط العامة',
              value: 'general',
              emoji: '🎮'
            },
            {
              label: 'النقاط الفردية',
              description: 'عرض أفضل اللاعبين في الألعاب الفردية',
              value: 'individual',
              emoji: '🎯'
            },
            {
              label: 'نقاط الروليت',
              description: 'عرض أفضل اللاعبين في لعبة الروليت',
              value: 'roulette',
              emoji: '🕹'
            },
            {
              label: 'نقاط المافيا',
              description: 'عرض أفضل اللاعبين في لعبة المافيا',
              value: 'mafia',
              emoji: '🕵️'
            },
            {
              label: 'نقاط البومب',
              description: 'عرض أفضل اللاعبين في لعبة البومب',
              value: 'bomb',
              emoji: '💣'
            },
            {
              label: 'نقاط الهايد',
              description: 'عرض أفضل اللاعبين في لعبة الهايد',
              value: 'hide',
              emoji: '🔍'
            },
            {
              label: 'نقاط النرد',
              description: 'عرض أفضل اللاعبين في لعبة النرد',
              value: 'dice-teams',
              emoji: '🎲'
            },
            {
              label: 'نقاط الوصل',
              description: 'عرض أفضل اللاعبين في لعبة الوصل',
              value: 'wsl',
              emoji: '🔗'
            },
            {
              label: 'نقاط الكراسي',
              description: 'عرض أفضل اللاعبين في لعبة الكراسي',
              value: 'krase',
              emoji: '🪑'
            },
            {
              label: 'نقاط برا السالفة',
              description: 'عرض أفضل اللاعبين في لعبة برا السالفة',
              value: 'bra',
              emoji: '💬'
            }
          ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
          .setColor(colors.baseColor)
          .setTitle('🎮 اختيار نوع اللعبة')
          .setDescription('اختر نوع اللعبة التي تريد عرض أفضل اللاعبين فيها:')
          .addFields([
            { name: '🎮 النقاط العامة', value: 'مجموع نقاط جميع الألعاب', inline: true },
            { name: '🎯 النقاط الفردية', value: 'نقاط الألعاب الفردية فقط', inline: true },
            { name: '🕹 نقاط الروليت', value: 'نقاط لعبة الروليت', inline: true },
            { name: '🕵️ نقاط المافيا', value: 'نقاط لعبة المافيا', inline: true },
            { name: '💣 نقاط البومب', value: 'نقاط لعبة البومب', inline: true },
            { name: '💬 نقاط برا السالفة', value: 'نقاط لعبة برا السالفة', inline: true }
          ]);

        await interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      }


      else if (interaction.customId === 'select_game_type') {
        const gameType = interaction.values[0];
        const gameInfo = gameTypes[gameType];

        if (!gameInfo) {
          return interaction.reply({
            content: "❌ نوع لعبة غير صحيح.",
            ephemeral: true
          });
        }

        await interaction.deferReply({ ephemeral: true });

        try {

          const imageBuffer = await createTopImage(interaction.guild.id, gameType);

          const attachment = new AttachmentBuilder(imageBuffer, {
            name: `top-${gameType}.png`
          });


          const detailsButton = new ButtonBuilder()
            .setCustomId(`show_top_details_${gameType}`)
            .setLabel('عرض التفاصيل')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:magnifier:1377869108464320542>');

          const backButton = new ButtonBuilder()
            .setCustomId('switch_game_type')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:game:1400990288272556112>');

          const row = new ActionRowBuilder().addComponents(detailsButton, backButton);

          await interaction.editReply({
            files: [attachment],
            components: [row]
          });

        } catch (error) {
          console.error("خطأ في إنشاء صورة التوب:", error);
          await interaction.editReply({
            content: "❌ حدث خطأ أثناء إنشاء قائمة أفضل اللاعبين.",
            embeds: [],
            components: []
          });
        }
      }

    } catch (error) {
      console.error("خطأ في معالجة التفاعل:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ حدث خطأ أثناء معالجة طلبك.",
          ephemeral: true
        });
      }
    }
  });
}

module.exports = { execute };
