import { db } from "../server/db";
import { users } from "../shared/schema";

async function checkUsers() {
    try {
        const allUsers = await db.query.users.findMany();
        console.log("Total Users in DB:", allUsers.length);
        console.log("Users:");
        console.log(JSON.stringify(allUsers, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
