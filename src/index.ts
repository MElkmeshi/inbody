import { Telegraf, Input } from "telegraf";
import { message } from "telegraf/filters";
import type { Context } from "telegraf";
import { extractScan } from "./gemini";
import { buildPayload, renderQrPng } from "./qr";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN not set");
  process.exit(1);
}

const bot = new Telegraf(token);

const HELP =
  "Send me a photo of an InBody 970 printout and I'll reply with the scannable QR code + URL.";

bot.start((ctx) => ctx.reply(HELP));
bot.help((ctx) => ctx.reply(HELP));

async function fetchTelegramFile(ctx: Context, fileId: string): Promise<Buffer> {
  const link = await ctx.telegram.getFileLink(fileId);
  const resp = await fetch(link.toString());
  if (!resp.ok) throw new Error(`Telegram file download failed: ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

async function handleImage(ctx: Context, image: Buffer, mime = "image/jpeg") {
  await ctx.sendChatAction("upload_photo");
  const scan = await extractScan(image, mime);
  const url = buildPayload(scan);
  const png = await renderQrPng(url);
  await ctx.replyWithPhoto(Input.fromBuffer(png, "inbody-qr.png"), { caption: url });
}

bot.on(message("photo"), async (ctx) => {
  try {
    const largest = ctx.message.photo[ctx.message.photo.length - 1];
    const buf = await fetchTelegramFile(ctx, largest.file_id);
    await handleImage(ctx, buf, "image/jpeg");
  } catch (err) {
    console.error(err);
    await ctx.reply(`Couldn't read this scan: ${(err as Error).message}`);
  }
});

bot.on(message("document"), async (ctx) => {
  const doc = ctx.message.document;
  if (!doc.mime_type?.startsWith("image/")) {
    await ctx.reply("Please send an image (photo or image file).");
    return;
  }
  try {
    const buf = await fetchTelegramFile(ctx, doc.file_id);
    await handleImage(ctx, buf, doc.mime_type);
  } catch (err) {
    console.error(err);
    await ctx.reply(`Couldn't read this scan: ${(err as Error).message}`);
  }
});

bot.on(message("text"), (ctx) => ctx.reply(HELP));

bot.catch((err) => {
  console.error("Bot error:", err);
});

console.log("Starting bot...");
bot.launch(() => console.log("Bot started"));

process.once("SIGINT",  () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
