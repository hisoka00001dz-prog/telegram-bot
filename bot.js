const TelegramBot = require('node-telegram-bot-api');
const { execSync } = require('child_process');
const token = '8847862913:AAE38Iy8HN9ln1xp-Xk9Uay2H48KPZKpXu8';
const bot = new TelegramBot(token, { polling: true });
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const url = msg.text;
  if (url && url.includes('http')) {
    bot.sendMessage(chatId, '⏳ جاري التحميل...');
    const filename = `vid${Date.now()}.mp4`;
    try {
      execSync(`yt-dlp -o "${filename}" "${url}"`, {timeout: 120000});
      bot.sendVideo(chatId, filename).then(() => {
        execSync(`rm "${filename}"`);
      });
    } catch(e) {
      bot.sendMessage(chatId, '❌ فشل التحميل');
    }
  } else {
    bot.sendMessage(chatId, '📎 أرسل رابط فيديو');
  }
});
