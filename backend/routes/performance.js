import express from "express";
import pool from "../config/db.js";

const performance_router = express.Router();

performance_router.get("/worst-5", async (req, res) => {
  const [result] = await pool.query(`
    SELECT 
    p.name AS product_name,
    c.name AS company_name,
    pl.quantity,
    pl.total_time_minutes,
    (pl.total_time_minutes / pl.quantity) AS avg_minutes_per_unit
    FROM performance_logs pl
    JOIN products p ON pl.product_id = p.id
    JOIN companies c ON pl.company_id = c.id
    WHERE 
    pl.quantity > 0
    AND pl.total_time_minutes IS NOT NULL
    ORDER BY avg_minutes_per_unit DESC
    LIMIT 5;
`);

  sendResponse(res, result);
});

performance_router.get("/best-5", async (req, res) => {
  const [result] = await pool.query(`
      SELECT 
      p.name AS product_name,
      c.name AS company_name,
      pl.quantity,
      pl.total_time_minutes,
      (pl.total_time_minutes / pl.quantity) AS avg_minutes_per_unit
      FROM performance_logs pl
      JOIN products p ON pl.product_id = p.id
      JOIN companies c ON pl.company_id = c.id
      WHERE 
      pl.quantity > 0
      AND pl.total_time_minutes IS NOT NULL
      ORDER BY avg_minutes_per_unit ASC
      LIMIT 5;
  `);

  sendResponse(res, result);
});

export default performance_router;
