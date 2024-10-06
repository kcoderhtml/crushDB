import { Database } from "bun:sqlite";
import sha256 from "crypto-js/sha256";

const start = confirm("are you sure that you want to rehash the db?");

if (!start) {
  console.log("Exiting...");
  process.exit(0);
}

// create / init sqlite db
const db = new Database("hashes.db");
const userDB = new Database("users.db");
type User = {
  id: string;
  name: string | null;
  real_name: string | null;
  is_admin: boolean;
};
type RainbowTable = {
  id: string;
  hashName: string;
  hashRealName: string;
};

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
      "CREATE TABLE IF NOT EXISTS RainbowTable (id TEXT PRIMARY KEY, hashName TEXT, hashRealName TEXT)"
    );

    const stmt = db.prepare(
      "INSERT OR REPLACE INTO RainbowTable VALUES (?, ?, ?)"
    );

    // get users
    let memberCount = (
      userDB.prepare("SELECT COUNT(*) as count FROM users").get() as {
        count: number;
      }
    ).count;

    let existingCount = (
      db.prepare("SELECT COUNT(*) as count FROM RainbowTable").get() as {
        count: number;
      }
    ).count;

    console.log(`Found ${existingCount} members in the users db\n`);

    // select users in batches of 10 from the users db hash them into sha265 and then insert them into the db
    for (let i = 0; i < memberCount; i += 500) {
      const users = userDB
        .prepare("SELECT * FROM users LIMIT 500 OFFSET ?")
        .all(i) as User[];

      let n = 0;
      for (const user of users) {
        rePrint(
          `${n}/${users.length} ${i + n}/${memberCount} hashing ${user.name}`
        );
        const hashName = user.name
          ? sha256(user.name.toLowerCase()).toString()
          : null;
        const hashRealName = user.real_name
          ? sha256(user.real_name.toLowerCase()).toString()
          : null;

        stmt.run(user.id, hashName, hashRealName);
        n++;
      }
    }

    console.log(`\n\nInserted ${memberCount} members into the db`);
  } catch (error) {
    console.error(error);
  }
})();
