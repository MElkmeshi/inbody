# InBody Telegram Bot

Telegram bot that turns a photo of an InBody 970 printout into a scannable QR code.

Pipeline: user sends photo → Gemini 2.5 Flash extracts the fields → the values are re-packed into the InBody QR payload (`https://qrcode.inbody.com?IBData=...`) → bot replies with the rendered QR PNG and the URL in the caption.

## Setup

1. Install [Bun](https://bun.sh).
2. `bun install`
3. Copy your keys into `.env`:
   ```
   GEMINI_API_KEY=...
   TELEGRAM_BOT_TOKEN=...     # from @BotFather
   ```
4. `bun run dev` (auto-reload) or `bun run start`.

## Usage

DM the bot a photo of an InBody printout. It replies with the QR image and the raw URL as the caption. Works for compressed photos and image documents.

## Notes

- Only the header + summary fields shown on the printout are rewritten. Segmental impedances / segmental lean / BMR are templated from a reference scan so the QR still parses; the InBody app may flag cross-checks if it validates them.
- Height is encoded as integer cm (InBody header is 3 digits).
