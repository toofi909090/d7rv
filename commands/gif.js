

const gifShopData = {

  settings: {
    itemsPerPage: 4,
    previewSize: 160,
    canvasWidth: 800,
    canvasHeight: 600,
    itemsPerRow: 4,
    backgroundColor: 'transparent',
    textColor: '#FFFFFF',
    borderColor: '#3498DB',
    selectedColor: '#E74C3C',
    priceTextSize: '16px',
    numberTextSize: '18px',
    titleTextSize: '24px',
    shopTitle: '🎨 متجر الصور ',
    shopDescription: 'اختر صورة مميزة تظهر عند طرد اللاعبين!'
  },

  
  rarityColors: {
    common: '#95A5A6',     
    rare: '#3498DB',       
    epic: '#9B59B6',        
    legendary: '#F1C40F'    
  },





  
  gifs: [
    {
      id: 1,
      name: 'باي باي',
      fileName: 'bye-bye.gif',
      price: 30,
      rarity: 'common',       
      category: 'action',      
      unlocked: true,          
      limited: false          
    },
    {
      id: 2,
      name: 'رفسة',
      fileName: 'kick.gif',
      price: 30,
      rarity: 'common',
      category: 'funny',
      unlocked: true,
      limited: false
    },
    {
      id: 3,
      name: 'وردة',
      fileName: 'flower.jpg',
      price: 30,
      rarity: 'rare',
      category: 'anime',
      unlocked: true,
      limited: false
    },
    {
      id: 4,
      name: 'ضحكة',
      fileName: 'haha.png',
      price: 30,
      rarity: 'rare',
      category: 'action',
      unlocked: true,
      limited: false
    },
    {
      id: 5,
      name: '441',
      fileName: 'koksa.gif',
      price: 30,
      rarity: 'epic',
      category: 'anime',
      unlocked: true,
      limited: false
    },
    {
      id: 6,
      name: 'زبالة',
      fileName: 'zbal.gif',
      price: 30,
      rarity: 'rare',
      category: 'special',
      unlocked: true,
      limited: false
    },
    {
      id: 7,
      name: 'gtfo',
      fileName: 'gtfo.gif',
      price: 30,
      rarity: 'epic',
      category: 'action',
      unlocked: true,
      limited: false
    },
    {
      id: 8,
      name: 'معصب',
      fileName: 'angry.gif',
      price: 30,
      rarity: 'common',
      category: 'funny',
      unlocked: true,
      limited: false
    },
    {
      id: 9,
      name: 'كـف',
      fileName: 'slap.gif',
      price: 30,
      rarity: 'legendary',
      category: 'special',
      unlocked: true,
      limited: true
    },
    {
      id: 10,
      name: 'قطوه',
      fileName: 'cat.gif',
      price: 30,
    
      rarity: 'epic',
      category: 'action',
      unlocked: true,
      limited: false
      
    }
  ],

  
  messages: {
    insufficientFunds: 'ليس لديك نقاط كافية لشراء هذه الصورة!',
    alreadyOwned: 'تملك هذه الصورة بالفعل!',
    purchaseSuccess: 'تم شراء الصورة بنجاح! ✅',
    gifNotFound: 'لم يتم العثور على الصورة!',
    shopClosed: 'المتجر مغلق حالياً.',
    noGifsOwned: 'لا تملك أي صور حالياً.',
    gifEquipped: 'تم تجهيز الصورة بنجاح!',
    limitedTime: '⏰ عرض محدود الوقت!',
    comingSoon: '🔒 قريباً...'
  },


  discounts: {
    enabled: true,
    weekendDiscount: 0.1,    
    bulkBuyDiscount: {       
      threshold: 3,         
      discount: 0.15        
    },
    vipDiscount: 0.2,        
    newUserDiscount: 0.05   
  },


  dailyRewards: {
    enabled: true,
    baseReward: 10,         
    streakMultiplier: 1.2,  
    maxStreak: 7,           
    bonusGifChance: 0.05    
  },


  
};


const gifShopUtils = {
  

  getGifById(id) {
    return gifShopData.gifs.find(gif => gif.id === id);
  },


  getGifsByCategory(category) {
    return gifShopData.gifs.filter(gif => gif.category === category);
  },

 
  getGifsByRarity(rarity) {
    return gifShopData.gifs.filter(gif => gif.rarity === rarity);
  },


  calculatePrice(gifId, userId, isVip = false, isNewUser = false) {
    const gif = this.getGifById(gifId);
    if (!gif) return null;

    let price = gif.price;
    let appliedDiscounts = [];


    if (gifShopData.discounts.enabled) {
      const now = new Date();
      const isWeekend = now.getDay() === 5 || now.getDay() === 6; 
      
      if (isWeekend && gifShopData.discounts.weekendDiscount > 0) {
        price *= (1 - gifShopData.discounts.weekendDiscount);
        appliedDiscounts.push(`خصم نهاية الأسبوع (${Math.round(gifShopData.discounts.weekendDiscount * 100)}%)`);
      }

 
      if (isVip && gifShopData.discounts.vipDiscount > 0) {
        price *= (1 - gifShopData.discounts.vipDiscount);
        appliedDiscounts.push(`خصم VIP (${Math.round(gifShopData.discounts.vipDiscount * 100)}%)`);
      }


      if (isNewUser && gifShopData.discounts.newUserDiscount > 0) {
        price *= (1 - gifShopData.discounts.newUserDiscount);
        appliedDiscounts.push(`خصم المستخدم الجديد (${Math.round(gifShopData.discounts.newUserDiscount * 100)}%)`);
      }
    }

    return {
      originalPrice: gif.price,
      finalPrice: Math.floor(price),
      appliedDiscounts
    };
  },


  isGifAvailable(gifId) {
    const gif = this.getGifById(gifId);
    if (!gif) return false;
    
    return gif.unlocked && !gif.limited;
  },


  getGifPath(fileName) {
    return `./ggif/${fileName}`;
  },


  formatGifInfo(gif, userPoints = 0, isVip = false, isNewUser = false) {

    if (!gif) {
      return null;
    }


    const rarityEmojis = gifShopData.rarityEmojis || {};
    const categoryEmojis = gifShopData.categoryEmojis || {};
    const rarityColors = gifShopData.rarityColors || {};

    const priceInfo = this.calculatePrice(gif.id, null, isVip, isNewUser);
    if (!priceInfo) {
      return {
        ...gif,
        displayPrice: gif.price,
        originalPrice: gif.price,
        discounted: false,
        appliedDiscounts: [],
        canAfford: userPoints >= gif.price,
        rarityEmoji: rarityEmojis[gif.rarity] || '',
        categoryEmoji: categoryEmojis[gif.category] || '',
        rarityColor: rarityColors[gif.rarity] || '#95A5A6'
      };
    }
    
    const canAfford = userPoints >= priceInfo.finalPrice;
    const rarityEmoji = rarityEmojis[gif.rarity] || '';
    const categoryEmoji = categoryEmojis[gif.category] || '';

    return {
      ...gif,
      displayPrice: priceInfo.finalPrice,
      originalPrice: priceInfo.originalPrice,
      discounted: priceInfo.finalPrice < priceInfo.originalPrice,
      appliedDiscounts: priceInfo.appliedDiscounts,
      canAfford,
      rarityEmoji,
      categoryEmoji,
      rarityColor: rarityColors[gif.rarity] || '#95A5A6'
    };
  },


  ensureGifDirectoryExists() {
    const fs = require('fs');
    const gifDir = './ggif';
    
    if (!fs.existsSync(gifDir)) {
      fs.mkdirSync(gifDir, { recursive: true });
      console.log('📁 تم إنشاء مجلد ./ggif للصور المتحركة');
    }
  },


  validateGifFiles() {
    const fs = require('fs');
    const missingFiles = [];
    
    for (const gif of gifShopData.gifs) {
      const gifPath = this.getGifPath(gif.fileName);
      if (!fs.existsSync(gifPath)) {
        missingFiles.push(gif.fileName);
      }
    }
    
    if (missingFiles.length > 0) {
      console.warn('⚠️ ملفات GIF مفقودة:');
      missingFiles.forEach(file => console.warn(`   - ${file}`));
      console.warn('   ضع هذه الملفات في مجلد ./ggif/');
    } else {
      console.log('✅ جميع ملفات GIF موجودة!');
    }
    
    return missingFiles;
  },


  getShopStats() {
    const totalGifs = gifShopData.gifs.length;
    const rarityCount = {};
    const categoryCount = {};
    
    gifShopData.gifs.forEach(gif => {
      rarityCount[gif.rarity] = (rarityCount[gif.rarity] || 0) + 1;
      categoryCount[gif.category] = (categoryCount[gif.category] || 0) + 1;
    });
    
    return {
      totalGifs,
      rarityCount,
      categoryCount,
      averagePrice: Math.round(gifShopData.gifs.reduce((sum, gif) => sum + gif.price, 0) / totalGifs)
    };
  }
};

module.exports = {
  gifShopData,
  gifShopUtils
};
