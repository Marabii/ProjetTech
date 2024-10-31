import dotenv from "dotenv";
import mongoose, { ConnectOptions } from "mongoose";

dotenv.config();

const uri: string | undefined = process.env.DB_STRING;

const connectDB = async () => {
  if (!uri) {
    console.error("Database connection string is missing!");
    process.exit(1);
  }
  mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions)
    .then(() => console.log("Successfully connected to Atlas"))
    .catch((err: any) => console.error("Initial connection error: ", err));
};

export { connectDB };
