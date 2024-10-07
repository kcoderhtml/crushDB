import { App } from "@slack/bolt";
import { Database } from "bun:sqlite";

const RainbowTableDB = new Database("hashes.db");
type RainbowTable = {
  id: string;
  hashName: string;
  hashRealName: string;
};
const userDB = new Database("users.db");
type User = {
  id: string;
  name: string | null;
  real_name: string | null;
  is_admin: boolean;
};

const slackBot = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

async function getHashedCrush(ts: string, channel: string, hash: string) {
  const user = RainbowTableDB.prepare(
    "SELECT * FROM RainbowTable WHERE hashName = ? OR hashRealName = ?"
  ).get(hash, hash) as RainbowTable;

  if (!user) {
    slackBot.client.chat.update({
      channel,
      ts,
      text: "Hash not found in the rainbow table for hash: `" + hash + "`",
    });
  }

  // get the user from the user db
  const userFromDB = userDB
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(user.id) as User;

  if (!userFromDB) {
    slackBot.client.chat.update({
      channel,
      ts,
      text: "User not found in the user db for hash: `" + hash + "`",
    });
  }

  slackBot.client.chat.update({
    channel,
    ts,
    text: `The user with the hash \`${hash}\` is  <@${userFromDB.id}> / ${userFromDB.real_name}`,
  });
}

const regex = /https:\/\/zkcrush.xyz\/crush\?hash=([a-f0-9]+)/;

slackBot.message(regex, async ({ context, say, payload }) => {
  // capture the hash and name
  const hash = context.matches[1];

  const message = await say({
    thread_ts: payload.ts,
    text: `Looking up hash \`${hash}\``,
  });

  await getHashedCrush(message.ts!, payload.channel, hash);
});

(async () => {
  await slackBot.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();
