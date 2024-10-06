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
let hash = prompt("Enter the hash you want to crack:");

// if the entered hash is in the format *https://zkcrush.xyz/crush?hash=5d7c6c2f2db598424f0f75ae7fa41b7b8b97294afaa41c58f84be6ce5d036dcd&name=*
// then get the hash

if (hash && hash.includes("https://zkcrush.xyz/crush?hash=")) {
  hash = hash.split("https://zkcrush.xyz/crush?hash=")[1].split("&name=")[0];
}

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
