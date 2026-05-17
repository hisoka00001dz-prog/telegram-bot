from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
import subprocess, os, glob

TOKEN = "8256414817:AAGSkdkJddY6XzinjoxjMQc0v4bzSXGkyKg"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    name = update.effective_user.first_name
    keyboard = [[InlineKeyboardButton("📥 فيديو", callback_data="video"), InlineKeyboardButton("🎵 صوت", callback_data="audio")]]
    await update.message.reply_text(f"👋 مرحباً {name}! ارسل رابط من يوتيوب او تيك توك او انستغرام", reply_markup=InlineKeyboardMarkup(keyboard))

async def button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    context.user_data["mode"] = query.data

async def download(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text
    mode = context.user_data.get("mode", "video")
    if not any(x in url for x in ["youtube","youtu.be","tiktok","instagram"]):
        return
    msg = await update.message.reply_text("⏳ جاري التحميل...")
    try:
        if mode == "audio":
            cmd = ["yt-dlp","-x","--audio-format","mp3","-o","/tmp/%(title)s.%(ext)s",url]
        else:
            cmd = ["yt-dlp","-f","best[ext=mp4]/best","-o","/tmp/%(title)s.%(ext)s",url]
        subprocess.run(cmd, check=True, capture_output=True)
        files = glob.glob("/tmp/*.mp3") if mode == "audio" else glob.glob("/tmp/*.mp4")
        if files:
            await msg.edit_text("📤 جاري الارسال...")
            if mode == "audio":
                await update.message.reply_audio(audio=open(files[0],"rb"))
            else:
                await update.message.reply_video(video=open(files[0],"rb"))
            os.remove(files[0])
            await msg.delete()
            keyboard = [[InlineKeyboardButton("📥 فيديو", callback_data="video"), InlineKeyboardButton("🎵 صوت", callback_data="audio")]]
            await update.message.reply_text("✅ تم! تبغي تحمل اخر؟", reply_markup=InlineKeyboardMarkup(keyboard))
        else:
            await msg.edit_text("❌ فشل التحميل")
    except Exception as e:
        await msg.edit_text(f"❌ خطا: {str(e)[:100]}")

app = ApplicationBuilder().token(TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.add_handler(CallbackQueryHandler(button))
app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, download))
app.run_polling()
