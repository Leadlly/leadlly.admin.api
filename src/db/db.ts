import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let db: mongoose.Connection;
const ConnectToDB = async () => {
  const DatabaseUrl = process.env.LEADLLY_DB_URL as string;

try {
await mongoose.connect(DatabaseUrl);
db = mongoose.connection;
console.log("LEADLLY_DB_URL Connected.");
} catch (error) {
console.error("Database connection error:", error);
process.exit(1); // Exit the application on database connection failure
}
};

export  {db};

export default ConnectToDB;
