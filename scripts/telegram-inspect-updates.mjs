const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN.');
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=0`);
const data = await response.json();

if (!response.ok || !data.ok) {
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

if (!data.result.length) {
  console.log('No updates found. Send /start or a test message to the bot, then run this command again before setting a webhook.');
  process.exit(0);
}

for (const update of data.result) {
  const message = update.message || update.edited_message || update.channel_post || update.edited_channel_post;
  if (!message) continue;
  console.log(JSON.stringify({
    update_id: update.update_id,
    chat_id: message.chat?.id,
    chat_type: message.chat?.type,
    chat_title: message.chat?.title,
    username: message.chat?.username,
    from_id: message.from?.id,
    text: message.text,
    document: message.document?.file_name,
  }, null, 2));
}
