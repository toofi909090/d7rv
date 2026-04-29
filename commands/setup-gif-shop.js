

const fs = require('fs');
const path = require('path');
const { gifShopData, gifShopUtils } = require('./gif.js');

console.log('Commands are being processed...\n'.yellow.bold);



function createGifDirectory() {
  const gifDir = './ggif';
  
  if (!fs.existsSync(gifDir)) {
    fs.mkdirSync(gifDir, { recursive: true });
    console.log('✅ تم إنشاء مجلد ./ggif');
  } else {
    console.log('📁 مجلد ./ggif موجود بالفعل');
  }
}


function createGifReadme() {
  const readmeContent = `# مجلد الصور المتحركة

ضع ملفات GIF التالية في هذا المجلد:

${gifShopData.gifs.map(gif => `- ${gif.fileName} (${gif.name})`).join('\n')}

## معلومات الصور:

${gifShopData.gifs.map(gif => 
  `### ${gif.id}. ${gif.name}
- **الملف:** ${gif.fileName}
- **السعر:** ${gif.price} نقطة
- **النادرية:** ${gif.rarity} ${gifShopData.rarityEmojis[gif.rarity]}
- **الفئة:** ${gif.category} ${gifShopData.categoryEmojis[gif.category]}
- **الوصف:** ${gif.description}
`).join('\n')}

## نصائح:
- تأكد من أن الصور بصيغة .gif
- الحجم المثالي: 500x500 بكسل أو أقل
- تجنب الملفات الكبيرة جداً (أكثر من 5MB)
`;

  fs.writeFileSync('./ggif/README.md', readmeContent);
  console.log('📝 تم إنشاء ملف README.md في مجلد ggif');
}


function checkRequiredFiles() {
  const requiredFiles = [
    './gif.js',
    './gif-shop-system.js'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.log('❌ ملفات مطلوبة مفقودة:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    return false;
  }
  
  console.log('✅ جميع الملفات المطلوبة موجودة');
  return true;
}


function checkGifFiles() {
  console.log('\n🔍 فحص ملفات GIF...');
  const missingFiles = gifShopUtils.validateGifFiles();
  
  if (missingFiles.length === 0) {
    console.log('✅ جميع ملفات GIF موجودة!');
  } else {
    console.log(`❌ يوجد ${missingFiles.length} ملف مفقود`);
    console.log('\n📋 قائمة الملفات المطلوبة:');
    gifShopData.gifs.forEach(gif => {
      const exists = fs.existsSync(gifShopUtils.getGifPath(gif.fileName));
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${gif.fileName} (${gif.name})`);
    });
  }
}


function displayShopStats() {
  console.log('\n📊 إحصائيات المتجر:');
  const stats = gifShopUtils.getShopStats();
  
  console.log(`   📦 إجمالي الصور: ${stats.totalGifs}`);
  console.log(`   💰 متوسط السعر: ${stats.averagePrice} نقطة`);
  
  console.log('\n   🏆 توزيع النادرية:');
  Object.entries(stats.rarityCount).forEach(([rarity, count]) => {
    const emoji = gifShopData.rarityEmojis[rarity];
    console.log(`      ${emoji} ${rarity}: ${count} صورة`);
  });
  
  console.log('\n   📂 توزيع الفئات:');
  Object.entries(stats.categoryCount).forEach(([category, count]) => {
    const emoji = gifShopData.categoryEmojis[category];
    console.log(`      ${emoji} ${category}: ${count} صورة`);
  });
}


function createTestFile() {
  const testContent = `// test-gif-shop.js - ملف اختبار متجر الصور

const { GifShopSystem } = require('./gif-shop-system.js');


function testGifShop() {
  console.log('🧪 اختبار متجر الصور...');
  

  const mockDB = new Map();
  const dbq = {
    get: (key) => mockDB.get(key),
    set: (key, value) => mockDB.set(key, value)
  };
  

  const gifShop = new GifShopSystem(dbq);
  
  console.log('✅ تم إنشاء متجر الصور بنجاح!');
  console.log('📝 يمكنك الآن دمج النظام مع البوت الخاص بك');
}


if (require.main === module) {
  testGifShop();
}

module.exports = { testGifShop };
`;

  fs.writeFileSync('./test-gif-shop.js', testContent);
  console.log('🧪 تم إنشاء ملف الاختبار test-gif-shop.js');
}


function setupGifShop() {
  console.log('🚀 بدء عملية الإعداد...\n');
  

  if (!checkRequiredFiles()) {
    console.log('\n❌ لا يمكن المتابعة بدون الملفات المطلوبة');
    return;
  }
  

  createGifDirectory();
  

  createGifReadme();
  

  checkGifFiles();
  

  displayShopStats();
  

  createTestFile();
  

}


if (require.main === module) {
  setupGifShop();
}

module.exports = { setupGifShop };
