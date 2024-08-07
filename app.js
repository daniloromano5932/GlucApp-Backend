import express from "express";
const app = express();
const port = 8000;
import pg from "pg"
import bodyParser from "body-parser";
import cors from "cors";
import userRouter from './routes/user.js';
import measurementsRouter from './routes/measurements.js';
import dotenv from 'dotenv'

dotenv.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE
});

db.connect();
app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use('/user', userRouter);
app.use('/measurements', measurementsRouter);

app.listen(port, () => {
  console.log(`Successfully started server on port ${port}.`);
})
