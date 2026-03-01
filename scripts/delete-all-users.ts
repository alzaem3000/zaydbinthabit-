import { db } from "../server/db";
import { users, surveys, surveyQuestions, surveyResponses, indicators, witnesses, criteria, strategies, userStrategies, capabilities, changes, signatures } from "../shared/schema";

async function deleteAllUsers() {
    console.log("Starting to delete all users and related data...");
    try {
        // Delete depending tables first to avoid foreign key constraints
        await db.delete(signatures);
        await db.delete(capabilities);
        await db.delete(changes);
        await db.delete(userStrategies);
        await db.delete(strategies);
        await db.delete(witnesses);
        await db.delete(criteria);
        await db.delete(indicators);

        // Finally delete users
        await db.delete(users);

        console.log("Successfully deleted all users and related data.");
        process.exit(0);
    } catch (error) {
        console.error("Error deleting users:", error);
        process.exit(1);
    }
}

deleteAllUsers();
