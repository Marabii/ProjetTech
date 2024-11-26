import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";

const port: string | number = process.env.PORT || 3001;

import getStudents from "./apis/getStudents";
import changeDB from "./apis/changeDB";
import getSuggestions from "./apis/getSuggestions";

import { connectDB } from "./config/database";

const app: Application = express();

connectDB();

app.use(
  cors({
    origin: process.env.FRONT_END,
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(getStudents);
app.use(changeDB);
app.use(getSuggestions);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
