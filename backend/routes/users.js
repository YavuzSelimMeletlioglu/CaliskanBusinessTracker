import express from "express";
import pool from "../config/db.js";
import { sendResponse } from "../response_type.js";

const user_router = express.Router();

user_router.get("/crane_overlookers", async (req, res) => {
  const [result] = await pool.query(`SELECT * FROM users u
    WHERE u.role = 4;`);
  sendResponse(res, result);
});

export default user_router;
