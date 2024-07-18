import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let db: mongoose.Connection;
const ConnectToDB = async () => {
  const DatabaseUrl = process.env.LEADLLY_ADMIN_DB_URL as string;

  try {
    await mongoose.connect(DatabaseUrl);
    db = mongoose.connection;
    console.log("LEADLLY_ADMIN_DB_URL Connected.");
  } catch (error) {
    console.log(error);
  }
};

let mentor_db: mongoose.Connection;
const mentor_db_url = process.env.LEADLLY_MENTOR_DB_URL as string;
mentor_db = mongoose.createConnection(mentor_db_url);

export  {mentor_db, db};

export default ConnectToDB;
