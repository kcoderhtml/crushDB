import { App } from "@slack/bolt";

const slackBot = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

const regex = /https:\/\/zkcrush.xyz\/crush\?hash=([a-f0-9]+)/;

slackBot.message(regex, async ({ context, say, payload }) => {
  console.log("hi", context.matches);
  // capture the hash and name
  const hash = context.matches[1];

  await say({ thread_ts: payload.ts, text: `Looking up hash \`${hash}\`` });
});

(async () => {
  await slackBot.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();
