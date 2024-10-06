import { Database } from "bun:sqlite";

const userDB = new Database("users.db");
type User = {
  id: string;
  name: string | null;
  real_name: string | null;
  is_admin: boolean;
};

// ask user for the hash they want to crack
const id = prompt("Enter the user to lookup:");

// get the user from the user db
const userFromDB = userDB
  .prepare("SELECT * FROM users WHERE id = ?")
  .get(id) as User;

if (!userFromDB) {
  console.log("User not found in the user db");
  process.exit(0);
}

console.log(userFromDB);
