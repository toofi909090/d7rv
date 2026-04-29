const { AttachmentBuilder } = require("discord.js");
const { Canvas } = require("canvas-constructor/napi-rs");

const random = [
  " تحب تستفزه ؟",
  " صورة تحس إنك ابدعت بتصويرها.",
  " إيش سهران ؟",
  " تتوقع يطالعك طول الوقت بدون ملل ؟",
  " جالس الحين ؟",
  " من عشرة تقيم يومك ؟",
  " مدة نمت فيها كم ساعه ؟",
  " سنة ميلادية مرت عليك ؟",
  " رسالة بالواتس جاتك من مين ؟",
  " مانمت ؟",
  " فيه أحد يراقبك ؟",
  " من عشره تعطي حظك ؟",
  " ماسكه معك الفترة هذي ؟",
  " مستحيل تمل منه ؟",
  " تنام بالعادة ؟",
  " من عشرة جاهز للدراسة ؟",
  " صديقك الفزعة",
  " نفسك يرجع بكل تفاصيله ؟",
  " صورة بجوالك ؟",
  " أغرب مكان قد صحتوا فيه؟",
  " جاك خبر مفرح اول واحد تعلمه فيه مين ؟",
  " لو يختفي تصير الحياة جميلة ؟",
  " من عشرة تشوف نفسك محظوظ ؟",
  " نفسك بكلمة وحدة بس",
  " لأقرب شخص لقلبك ؟",
  " الصداقة بالمدة ولا بالمواقف ؟",
  "@منشن.شخص وقوله : حركتك مالها داعي.",
  " مسلسلات ولا م تهتم ؟",
  " يعني لك الكثير ؟",
  " عدد اللي معطيهم بلوك ؟",
  " الغباء انك ؟",
  " شيء محتاجه الحين ؟",
  "@منشن شخص تقوله : بطل تفكر فيني ابي انام",
  " مسهرك ؟.",
  " ولا مبسوط ؟",
  " سوالف مين ؟",
  " من عشرة روتينك ممل ؟",
  " مستحيل ترفضه ؟.",
  " من عشرة الإيجابية فيك ؟.",
  " اشباهك الاربعين عايشين حياة حلوة ؟.",
  " جالس عندك ؟",
  " من عشرة تشوف نفسك انسان ناجح ؟",
  " حظك فيه حلو ؟.",
  " من عشرة الصبر عندك ؟",
  " مرة نزل عندكم مطر ؟",
  " مشاكلك بسبب ؟",
  " شعور ممكن يحسه انسان ؟",
  " تحب تنشبله ؟",
  " شيء ؟",
  " تسكن وحدك ؟",
  " لونين تحبهم مع بعض ؟",
  " تكره نفسك ؟",
  " من عشرة مروق ؟",
  " تتمنى تعيش وتستقر فيها طول عمرك ؟",
  " للحياة لون إيش بيكون لون حياتك ؟",
  " في يوم من الأيام تصبح شخص نباتي ؟.",
  " قابلت شخص يشبهك ؟",
  " شخص تهاوشت معه ؟",
  " ساعة ايش كنت تسوي ؟",
  " تقولها للي ببالك ؟",
  " شيء مضيع وقتك فيه ؟",
  " فتحتا خزانتك إيش اكثر لون بنشوف ؟",
  " خارقة تتمنى تمتلكها ؟",
  " مصايبك مع مين ؟",
  " زعلت إيش يرضيك ؟",
  " النوع اللي تعترف بسرعه ولا تجحد ؟",
  " الاشياء البسيطة اللي تسعدك ؟",
  " مره بكيت",
  " على شخص قال : انا بطلع من حياتك؟.",
  " يعبر عن وضعك الحين ؟",
  " المنتظر بالنسبة لك ؟",
  " بنسمعك إيش بتقول ؟",
  " اللي ولدت فيها ؟",
  " شخص مستحيل يمر يوم وما تكلمه ؟",
  " تقولها لنفسك ؟",
  " من عشرة متفائل بالمستقبل ؟",
  " المعتاد اذا أحد ناداك ؟",
  "حط @منشن لشخص وقله الله يسامحك بس",
  " كلمه تسمعها من أمك ؟",
  " تفضل عمل ميداني ولاعمل مكتبي ؟",
  " حيوان تحبه ؟",
  " مشاكلك بسبب ؟",
  " صوت تكرهه ؟",
  " تتمنى انها م تنتهي ؟",
  " صعب تتقبلها بسرعه ؟",
  " من عشرة راضي عن وضعك الحالي ؟",
  " م تقدر تمسك ضحكتك ؟",
  " شخص قالك كلمة حلوة ؟",
  " شيء تحبه بنفسك ؟",
  " نفسك يرجع ؟",
  " وقتك ضايع على ؟",
  " تعرفت على اعز صديق لك ؟",
  " ان في حُب من أول نظرة ولا لا ؟.",
  " اهم شيء الفترة هذي ؟",
  " م تحب تناقشه ؟",
  "تقييمك للديسكورد الفترة ذي ؟"
];

function execute(client, dbq, has_play, config, utils) {
  const { prefix, owners } = utils;
  const canvass = require("canvas-constructor/napi-rs");

  client.on('messageCreate', async message => {
    const result = random[Math.floor(Math.random() * random.length)];
    const commandChannel = await dbq.get(`commandChannel_${message.guild.id}`);
    if (!commandChannel || message.channel.id !== commandChannel) return;
    
    if (message.content === prefix + "كت") {
      const mgamess = await dbq.get(`managergamesfr_${message.guild.id}`);
      if (!message.member.roles.cache.has(`${mgamess}`) && (!owners.includes(message.author.id))) return;
      
      let backgroundImage;
      const image = `./imager/sbgrouns_${message.guild.id}.png`;
      
      try {
        backgroundImage = await canvass.loadImage(image);
      } catch (error) {
        backgroundImage = await canvass.loadImage(`./photo/cut.png`);
      }

      async function createCanvas() {
        const background = await canvass.loadImage(backgroundImage);
        const name = new Canvas(2560, 1080)
          .printImage(background, 0, 0, 2560, 1080)
          .setColor("#FFFFFF")
          .setTextFont("bold 120px cairo")
          .setTextAlign("center")
          .printText(`كتويت`, 1320, 250)
          .pngAsync();

        const question = new Canvas(2560, 1080)
          .printImage(await canvass.loadImage(await name), 0, 0, 2560, 1050)
          .setColor("#FFFFFF")
          .setTextFont("bold 120px cairo")
          .setTextAlign("center")
          .printText(result, 1280, 600)
          .pngAsync();

        return question;
      }
      
      let attachment = new AttachmentBuilder(await createCanvas(), {
        name: "Njm-Store.png"
      });

      message.channel.send({ files: [attachment] });
    }
  });
}

module.exports = { execute };
