const { GifEncoder } = require("@skyra/gifenc")
const { buffer } = require("node:stream/consumers")
const { join } = require("node:path")
const fs = require("fs")


let fetch
try {
  fetch = globalThis.fetch || require('node-fetch')
} catch {
 
}


let createCanvas, loadImage, GlobalFonts, registerFont
try {
  const canvasModule = require("canvas")
  createCanvas = canvasModule.createCanvas
  loadImage = canvasModule.loadImage
  GlobalFonts = canvasModule.GlobalFonts
  registerFont = canvasModule.registerFont
} catch (error) {
 
  process.exit(1)
}


function registerFontsIfExist() {
  const fonts = [
    { path: join(".", "node_modules", "roulette-image", "fonts", "Tajawal.ttf"), family: "Tajawal" },
    { path: join(".", "node_modules", "roulette-image", "fonts", "cairo.ttf"), family: "cairo" },
    { path: join(".", "node_modules", "roulette-image", "fonts", "DejaVuSans.ttf"), family: "DejaVuSans" },
    { path: join(".", "node_modules", "roulette-image", "fonts", "Symbola_hint.ttf"), family: "Symbola_hint" },
    { path: join(".", "node_modules", "roulette-image", "fonts", "Symbola.ttf"), family: "Symbola" },
    { path: join(".", "node_modules", "roulette-image", "fonts", "NotoEmoji.ttf"), family: "NotoEmoji" },
    { path: join(".", "node_modules", "roulette-image", "fonts", "NotoRegular.ttf"), family: "NotoRegular" }
  ]

  fonts.forEach(font => {
    try {
      if (fs.existsSync(font.path)) {
        if (GlobalFonts && GlobalFonts.registerFromPath) {

          GlobalFonts.registerFromPath(font.path, font.family)
        } else if (registerFont) {

          registerFont(font.path, { family: font.family })
        }
      
      } else {
      
      }
    } catch (error) {
     
    }
  })
}


registerFontsIfExist()


async function createDefaultAvatar() {
  const canvas = createCanvas(150, 150)
  const ctx = canvas.getContext("2d")
  

  ctx.fillStyle = "#4A90E2"
  ctx.beginPath()
  ctx.arc(75, 75, 75, 0, Math.PI * 2)
  ctx.fill()
  

  ctx.fillStyle = "#FFFFFF"
  ctx.font = "bold 60px cairo"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("👤", 75, 75)
  
  return await loadImage(canvas.toBuffer())
}


async function validateImageUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) return false
    
    const contentType = response.headers.get('content-type')
    return contentType && contentType.startsWith('image/')
  } catch {
    return false
  }
}
const imageCache = new Map()
const canvasCache = new Map()
const CACHE_TTL = 300000
const MAX_CACHE_SIZE = 50


function cleanCache() {
  if (imageCache.size > MAX_CACHE_SIZE) {
    const oldestKey = imageCache.keys().next().value
    imageCache.delete(oldestKey)
  }
  if (canvasCache.size > MAX_CACHE_SIZE) {
    const oldestKey = canvasCache.keys().next().value
    canvasCache.delete(oldestKey)
  }
}


async function loadImageFast(imagePath) {
  const cached = imageCache.get(imagePath)
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.image
  }
  
  try {
    let image
    

    if (typeof imagePath === 'string') {

      if (imagePath.startsWith('http')) {

        const response = await fetch(imagePath, { method: 'HEAD' })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`نوع المحتوى غير صحيح: ${contentType}`)
        }
        
        image = await loadImage(imagePath)
      } 

      else if (fs.existsSync(imagePath)) {
        image = await loadImage(imagePath)
      }

      else {
        image = await loadImage(imagePath)
      }
    } 

    else if (Buffer.isBuffer(imagePath)) {
      image = await loadImage(imagePath)
    }
    else {
      throw new Error('نوع المسار غير مدعوم')
    }
    
    imageCache.set(imagePath, { image, timestamp: Date.now() })
    cleanCache()
    return image
    
  } catch (error) {
    
    

    return await createDefaultAvatar()
  }
}


async function createRouletteGifImage(sectors, serverImage, return_stream = false, fps = 700) {
  const startTime = Date.now()
  
  try {

    const frameCount = 30
    const totalRotation = Math.PI * 4
    

    const [baseRouletteBuffer, avatar] = await Promise.all([
      createRouletteImageFast(sectors),
      loadImageFast(serverImage).catch(async (error) => {
       
        return await createDefaultAvatar()
      })
    ])
    

    const encoder = new GifEncoder(500, 500)
    const stream = encoder.createReadStream()
    
    encoder.start()
    encoder.setRepeat(-1)
    encoder.setQuality(8)
    encoder.setTransparent(1)
    

    const baseImage = await loadImage(baseRouletteBuffer)
    

    const frames = await createSmoothFrames(baseImage, avatar, frameCount, totalRotation, sectors)
    

    for (let i = 0; i < frames.length; i++) {

      const progress = i / (frames.length - 1)
      const easeOut = 1 - Math.pow(1 - progress, 2)
      const delay = Math.round(50 + (easeOut * 200))
      
      encoder.setDelay(delay)
      encoder.addFrame(frames[i])
    }
    

    const finalFrame = await createFinalFrame(sectors, avatar)
    encoder.setDelay(1000)
    encoder.addFrame(finalFrame)
    
    await encoder.finish()
    
    
    
    return return_stream ? stream : await buffer(stream)
    
  } catch (error) {
    
    throw error
  }
}


async function createRouletteImageFast(sectors) {
  const cacheKey = `roulette_${sectors.length}_${sectors.map(s => s.displayName || s.username).join('_')}`
  
  if (canvasCache.has(cacheKey)) {
    return canvasCache.get(cacheKey)
  }
  
  const canvas = createCanvas(500, 500)
  const ctx = canvas.getContext("2d")
  

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  const sectorAngle = (2 * Math.PI) / sectors.length
  

  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i]
    const startAngle = sectorAngle * i
    const endAngle = startAngle + sectorAngle
    

    ctx.beginPath()
    ctx.moveTo(250, 250)
    ctx.arc(250, 250, 244, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = sector.color
    ctx.fill()
    

    ctx.save()
    ctx.translate(250, 250)
    ctx.rotate(startAngle + sectorAngle / 2)
    

    const optimalFontSize = Math.max(12, Math.min(20, 300 / sectors.length))
    ctx.font = `bold ${optimalFontSize}px cairo, Tajawal`
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    

    const displayName = sector.displayName || sector.username || 'Player'
    const text = `${sector.number + 1}- ${displayName}`.trim()
    const maxLength = Math.max(8, 16 - Math.floor(sectors.length / 3))
    const displayText = text.length > maxLength ? text.slice(0, maxLength - 2) + ".." : text
    
    const textX = Math.min(140, 200 - sectors.length * 2)
    

    ctx.fillText(displayText, textX, 0)
    ctx.restore()
    

    ctx.beginPath()
    ctx.moveTo(250, 250)
    const x = Math.cos(startAngle) * 244 + 250
    const y = Math.sin(startAngle) * 244 + 250
    ctx.lineTo(x, y)
    ctx.lineWidth = 2
    ctx.strokeStyle = "#ffffff"
    ctx.stroke()
  }
  

  ctx.beginPath()
  ctx.arc(250, 250, 244, 0, 2 * Math.PI)
  ctx.lineWidth = 3
  ctx.strokeStyle = "#ffffff"
  ctx.stroke()
  
  const buffer = await canvas.toBuffer("image/png")
  canvasCache.set(cacheKey, buffer)
  cleanCache()
  
  return buffer
}


async function createSmoothFrames(baseImage, avatar, frameCount, totalRotation, sectors) {
  const frames = []
  const sectorAngle = (2 * Math.PI) / sectors.length
  

  for (let i = 0; i < frameCount; i++) {
    const progress = i / (frameCount - 1)
    

    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    const currentAngle = totalRotation * easeOutQuart
    

    const currentPersonAvatar = getCurrentPersonAvatar(currentAngle, sectors, sectorAngle)
    
    const frame = await createOptimizedFrame(baseImage, currentPersonAvatar, currentAngle)
    frames.push(frame)
  }
  
  return frames
}


function getCurrentPersonAvatar(currentAngle, sectors, sectorAngle) {

  const normalizedAngle = ((currentAngle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)
  

  const arrowAngle = 0
  

  let relativeAngle = (arrowAngle - normalizedAngle + (2 * Math.PI)) % (2 * Math.PI)
  

  const sectorIndex = Math.floor(relativeAngle / sectorAngle) % sectors.length
  
  return sectors[sectorIndex].avatarURL || sectors[sectorIndex].avatar
}


async function createOptimizedFrame(baseImage, currentPersonAvatar, angle) {
  const canvas = createCanvas(500, 500)
  const ctx = canvas.getContext("2d")
  

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.globalCompositeOperation = 'source-over'
  

  ctx.save()
  ctx.translate(250, 250)
  ctx.rotate(angle)
  ctx.drawImage(baseImage, -250, -250, 500, 500)
  ctx.restore()
  

  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = "#e2e2e2"
  ctx.beginPath()
  ctx.moveTo(497, 220)
  ctx.lineTo(478, 235)
  ctx.lineTo(497, 250)
  ctx.closePath()
  ctx.fill()
  

  try {
    const personAvatar = await loadImageFast(currentPersonAvatar)
    await drawOptimizedAvatar(ctx, personAvatar, 250, 250, 75)
  } catch (error) {

    const defaultAvatar = await createDefaultAvatar()
    await drawOptimizedAvatar(ctx, defaultAvatar, 250, 250, 75)
  }
  
  return ctx
}


async function drawOptimizedAvatar(ctx, avatar, x, y, radius) {
  ctx.save()
  

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  

  ctx.beginPath()
  ctx.arc(x, y, radius + 4, 0, Math.PI * 2)
  ctx.fillStyle = "#FFFFFF"
  ctx.fill()
  ctx.strokeStyle = "#E0E0E0"
  ctx.lineWidth = 2
  ctx.stroke()
  

  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.clip()
  

  const aspectRatio = avatar.height / avatar.width
  const drawSize = radius * 2
  let drawWidth, drawHeight
  
  if (aspectRatio > 1) {

    drawHeight = drawSize
    drawWidth = drawSize / aspectRatio
  } else {

    drawWidth = drawSize
    drawHeight = drawSize * aspectRatio
  }
  

  ctx.drawImage(
    avatar,
    x - drawWidth / 2,
    y - drawHeight / 2,
    drawWidth,
    drawHeight
  )
  
  ctx.restore()
}


async function createFinalFrame(sectors, avatar) {

  const winner = sectors[sectors.length - 1]
  const winnerAvatar = winner.avatarURL || winner.avatar
  
  return createRouletteImage(sectors, true, true, winnerAvatar)
}


async function createRouletteImage(sectors, return_ctx = false, pointer = true, specific_win_avatar) {
  const canvas = createCanvas(500, 500)
  const ctx = canvas.getContext("2d")
  
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  const sectorAngle = (2 * Math.PI) / sectors.length
  

  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i]
    const startAngle = sectorAngle * i
    const endAngle = startAngle + sectorAngle
    
    ctx.beginPath()
    ctx.moveTo(250, 250)
    ctx.arc(250, 250, 244, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = sector.color
    ctx.fill()
    
   
    ctx.save()
    ctx.translate(250, 250)
    ctx.rotate(startAngle + sectorAngle / 2)
    
    const displayName = sector.displayName || sector.username || 'Player'
    const text = `${sector.number + 1}- ${displayName}`.trim()
    const optimalFontSize = Math.max(12, Math.min(18, 280 / sectors.length))
    
    ctx.font = `bold ${optimalFontSize}px Tajawal, cairo, DejaVuSans`
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    
    const maxLength = Math.max(8, 15 - Math.floor(sectors.length / 4))
    const displayText = text.length > maxLength ? text.slice(0, maxLength - 2) + ".." : text
    
    const textX = Math.min(130, 180 - sectors.length * 1.5)
    

    ctx.fillText(displayText, textX, 0)
    ctx.restore()
    

    ctx.beginPath()
    ctx.moveTo(250, 250)
    const x = Math.cos(startAngle) * 244 + 250
    const y = Math.sin(startAngle) * 244 + 250
    ctx.lineTo(x, y)
    ctx.lineWidth = 2
    ctx.strokeStyle = "#ffffff"
    ctx.stroke()
  }
  

  ctx.beginPath()
  ctx.arc(250, 250, 244, 0, 2 * Math.PI)
  ctx.lineWidth = 3
  ctx.strokeStyle = "#ffffff"
  ctx.stroke()
  
  if (pointer) {

    ctx.fillStyle = "#e2e2e2"
    ctx.beginPath()
    ctx.moveTo(490, 220)
    ctx.lineTo(471, 235)
    ctx.lineTo(490, 250)
    ctx.fill()
    

    try {
      const avatarPath = specific_win_avatar || sectors[sectors.length - 1].avatarURL
      

      let avatarImage
      if (typeof avatarPath === 'string' && avatarPath.startsWith('http')) {
        const isValid = await validateImageUrl(avatarPath)
        if (isValid) {
          avatarImage = await loadImageFast(avatarPath)
        } else {
         
          avatarImage = await createDefaultAvatar()
        }
      } else {
        avatarImage = await loadImageFast(avatarPath)
      }
      
      await drawOptimizedAvatar(ctx, avatarImage, 250, 250, 75)
    } catch (error) {
     
      const defaultAvatar = await createDefaultAvatar()
      await drawOptimizedAvatar(ctx, defaultAvatar, 250, 250, 75)
    }
  }
  
  return return_ctx ? ctx : await canvas.toBuffer("image/png")
}


function getRandomNumber(length, excludedNumbers = []) {
  let number = 0
  do {
    number = Math.floor(Math.random() * length) + 1
  } while (excludedNumbers.includes(number))
  return number
}

function getRandomGifColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

function getRandomDarkHexCode() {
  const darkColors = [
    '#2C3E50', '#8E44AD', '#2980B9', '#27AE60', '#F39C12',
    '#E74C3C', '#9B59B6', '#3498DB', '#1ABC9C', '#F1C40F'
  ]
  return darkColors[Math.floor(Math.random() * darkColors.length)]
}

function getBrightness(color) {
  const hex = color.replace("#", "")
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

function shuffleArray(arr, specific_num) {
  const random_number = specific_num || Math.floor(Math.random() * arr.length) + 1
  return [...arr.slice(arr.length - random_number), ...arr.slice(0, arr.length - random_number)]
}


function clearImageCache() {
  imageCache.clear()
  canvasCache.clear()
  if (global.gc) {
    global.gc() 
  }
}


function getMemoryUsage() {
  const usage = process.memoryUsage()
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    cacheSize: imageCache.size + canvasCache.size
  }
}

module.exports = {
  createRouletteGifImage,
  createRouletteImage,
  getRandomNumber,
  getRandomGifColor,
  getRandomDarkHexCode,
  getBrightness,
  shuffleArray,
  clearImageCache,
  getMemoryUsage
}