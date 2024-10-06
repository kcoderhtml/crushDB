import { App } from "@slack/bolt";
import { Database } from "bun:sqlite";

const slackClient = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
}).client;

const start = confirm("are you sure that you want to reindex the slack users?");

if (!start) {
  console.log("Exiting...");
  process.exit(0);
}

// create / init sqlite db
const db = new Database("users.db");
type User = {
  id: string;
  name: string;
  real_name: string;
  is_admin: boolean;
};

const assumedMemberCount = 39739;

function rePrint(text: string) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(text);
}

// async inline
(async () => {
  try {
    // create table if not exists
    db.exec(
      "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, real_name TEXT, is_admin BOOLEAN)"
    );

    const stmt = db.prepare("INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?)");

    // get users
    let memberCount = (
      db.prepare("SELECT COUNT(*) as count FROM users").get() as {
        count: number;
      }
    ).count;

    console.log(`Found ${memberCount} members in the db\n`);

    // get users from slack
    let nextCursor;

    do {
      const response = await slackClient.users.list({
        cursor: nextCursor,
      });

      const members = response.members as User[];

      let i = 0;
      for (const member of members) {
        rePrint(
          `${i}/${members.length} ${
            memberCount + i
          }/${assumedMemberCount} inserting ${member.name}`
        );
        stmt.run(member.id, member.name, member.real_name, member.is_admin);
        i++;
      }

      memberCount += members.length;
      nextCursor = response.response_metadata?.next_cursor;
    } while (nextCursor);

    console.log(`Inserted ${memberCount} members into the db`);
  } catch (error) {
    console.error(error);
  }
})();
