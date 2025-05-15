import express from "express";
import pool from "../config/db.js";

const auth_router = express.Router();
const tableName = "users";

auth_router.post("/", async (req, res) => {
  const { username, password } = req.body;
  const [isValid] = await pool.query(
    `SELECT * FROM ${tableName} WHERE name = ? and password = ?;`,
    [username, password]
  );
  if (isValid.length > 0) {
    res.status(200).json({
      success: true,
      data: {
        user_id: isValid[0].id,
        user_role: isValid[0].role,
        email: isValid[0].email,
      },
    });
  }
});

auth_router.get("/", async (req, res) => {
  const [isValid] = await pool.query(`SELECT * FROM ${tableName};`);
  if (isValid.length > 0) {
    res.status(200).json({
      success: true,
      data: {
        user_id: isValid[0].id,
        user_role: isValid[0].role,
      },
    });
  }
});

export default auth_router;
