const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");
const fs = require("fs");
const token = "8847862913:AAE38Iy8HN9ln1xp-Xk9Uay2H48KPZKpXu8";
const bot = new TelegramBot(token, { polling: true });
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || !text.includes("http")) return bot.sendMessage(chatId, "🔗 أرسل رابط فيديو");
  await bot.sendMessage(chatId, "🎬 اختر نوع التحميل:", { reply_markup: { inline_keyboard: [[{ text: "🎥 جودة عالية", callback_data: "hd|" + text }],[{ text: "📱 جودة عادية", callback_data: "sd|" + text }],[{ text: "🎵 MP3", callback_data: "mp3|" + text }]]}});
});
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const [type, url] = query.data.split("|");
  bot.answerCallbackQuery(query.id).catch(()=>{});
  const statusMsg = await bot.sendMessage(chatId, "⏳ 0s");
  const filename = "vid_" + Date.now();
  let s = 0;
  const t = setInterval(async () => { s++; try { await bot.editMessageText("⏳ " + s + "s", { chat_id: chatId, message_id: statusMsg.message_id }); } catch(e) {} }, 1000);
  let cmd, outfile;
  if (type === "mp3") { outfile = filename + ".mp3"; cmd = "yt-dlp -x --audio-format mp3 -o \"" + outfile + "\" \"" + url + "\""; }
  else if (type === "hd") { outfile = filename + ".mp4"; cmd = "yt-dlp -f \"bestvideo[height<=1080]+bestaudio/best\" --merge-output-format mp4 -o \"" + outfile + "\" \"" + url + "\""; }
  else { outfile = filename + ".mp4"; cmd = "yt-dlp -f \"best[filesize<50M]/best\" -o \"" + outfile + "\" \"" + url + "\""; }
  exec(cmd, { timeout: 180000 }, async (err) => {
    clearInterval(t);
    if (err || !fs.existsSync(outfile)) { await bot.editMessageText("❌ فشل!", { chat_id: chatId, message_id: statusMsg.message_id }); return; }
    await bot.editMessageText("📤 إرسال...", { chat_id: chatId, message_id: statusMsg.message_id });
    if (type === "mp3") await bot.sendAudio(chatId, outfile);
    else await bot.sendVideo(chatId, outfile);
    await bot.editMessageText("✅ تم في " + s + "s!", { chat_id: chatId, message_id: statusMsg.message_id });
    fs.unlinkSync(outfile);
  });
});
console.log("🤖 شغال!");
