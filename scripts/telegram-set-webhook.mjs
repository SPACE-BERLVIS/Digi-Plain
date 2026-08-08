const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !webhookUrl || !secret) {
  console.error('Missing TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_URL or TELEGRAM_WEBHOOK_SECRET.');
  process.exit(1);
}

if (!/^https:\/\//.test(webhookUrl)) {
  console.error('TELEGRAM_WEBHOOK_URL must use HTTPS.');
  process.exit(1);
}

if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  console.error('TELEGRAM_WEBHOOK_SECRET may only contain A-Z, a-z, 0-9, _ and -.');
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ['message', 'edited_message', 'channel_post', 'edited_channel_post'],
    drop_pending_updates: true,
  }),
});

const result = await response.json();
console.log(JSON.stringify(result, null, 2));
if (!response.ok || !result.ok) process.exit(1);
