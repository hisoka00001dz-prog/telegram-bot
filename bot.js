const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");
const fs = require("fs");
const fetch = require("node-fetch");
const token = "8847862913:AAE38Iy8HN9ln1xp-Xk9Uay2H48KPZKpXu8";
const RAPID_KEY = "1b16bccb45msha69de0f87b99831p11f27ejsn63c4aacbb802";
const bot = new TelegramBot(token, { polling: true });
const seenMsgs = new Set();
const seenCallbacks = new Set();

function isYoutube(url) { return url.includes("youtube.com") || url.includes("youtu.be"); }

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🎉 أهلاً! أرسل رابط من TikTok أو Instagram أو YouTube!");
});

bot.on("message", async (msg) => {
  if (seenMsgs.has(msg.message_id)) return;
  seenMsgs.add(msg.message_id);
  setTimeout(() => seenMsgs.delete(msg.message_id), 60000);
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || !text.includes("http")) return;
  await bot.sendMessage(chatId, "🎬 اختر نوع التحميل:", { reply_markup: { inline_keyboard: [
    [{ text: "🎥 فيديو", callback_data: "video|" + text }],
    [{ text: "🎵 MP3", callback_data: "mp3|" + text }]
  ]}});
});

bot.on("callback_query", async (query) => {
  if (seenCallbacks.has(query.id)) return;
  seenCallbacks.add(query.id);
  setTimeout(() => seenCallbacks.delete(query.id), 60000);
  const chatId = query.message.chat.id;
  const [type, url] = query.data.split("|");
  bot.answerCallbackQuery(query.id).catch(()=>{});
  const statusMsg = await bot.sendMessage(chatId, "⏳ جاري التحميل...");
  try {
    if (isYoutube(url)) {
      const filename = "vid_" + Date.now() + (type === "mp3" ? ".mp3" : ".mp4");
      const cmd = type === "mp3"
        ? `yt-dlp -x --audio-format mp3 -o "${filename}" "${url}"`
        : `yt-dlp -f best -o "${filename}" "${url}"`;
      exec(cmd, { timeout: 180000 }, async (err) => {
        if (err || !fs.existsSync(filename)) {
          await bot.editMessageText("❌ فشل!", { chat_id: chatId, message_id: statusMsg.message_id });
          return;
        }
        await bot.editMessageText("📤 جاري الإرسال...", { chat_id: chatId, message_id: statusMsg.message_id });
        if (type === "mp3") await bot.sendAudio(chatId, filename);
        else await bot.sendVideo(chatId, filename);
        await bot.editMessageText("✅ تم!", { chat_id: chatId, message_id: statusMsg.message_id });
        fs.unlinkSync(filename);
      });
    } else {
      const res = await fetch(`https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`, {
        headers: { "x-rapidapi-key": RAPID_KEY, "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com" }
      });
      const data = await res.json();
      if (!data.links || data.links.length === 0) {
        await bot.editMessageText("❌ فشل!", { chat_id: chatId, message_id: statusMsg.message_id });
        return;
      }
      const link = data.links[0].link;
      await bot.editMessageText("📤 جاري الإرسال...", { chat_id: chatId, message_id: statusMsg.message_id });
      await bot.sendVideo(chatId, link);
      await bot.editMessageText("✅ تم!", { chat_id: chatId, message_id: statusMsg.message_id });
    }
  } catch(e) {
    await bot.editMessageText("❌ فشل!", { chat_id: chatId, message_id: statusMsg.message_id });
  }
});
console.log("🤖 البوت شغال");
