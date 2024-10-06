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

// ask user for the hash they want to crack
const hash = prompt("Enter the hash you want to crack:");

// find the hash and then the userid associated
const user = RainbowTableDB.prepare(
  "SELECT * FROM RainbowTable WHERE hashName = ? OR hashRealName = ?"
).get(hash, hash) as RainbowTable;

if (!user) {
  console.log("Hash not found in the rainbow table");
  process.exit(0);
}

// get the user from the user db
const userFromDB = userDB
  .prepare("SELECT * FROM users WHERE id = ?")
  .get(user.id) as User;

if (!userFromDB) {
  console.log("User not found in the user db");
  process.exit(0);
}

console.log(
  `The user with the hash ${hash} is @${userFromDB.name} / ${userFromDB.real_name} with the id ${userFromDB.id}`
);
