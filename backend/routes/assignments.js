// src/routes/assignment_router.ts (veya .js)

import express from "express";
import pool from "../config/db.js";
import { sendResponse } from "../response_type.js";

const assignment_router = express.Router();

assignment_router.get("/", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        c.name AS company_name,
        p.name AS product_name,
        inc.company_id AS comp_id,
        inc.product_id,
        aj.quantity,
        aj.created_at
      FROM assigned_job aj
      JOIN incoming inc ON aj.incoming_id = inc.id
      JOIN companies c ON inc.company_id = c.id
      JOIN products p ON inc.product_id = p.id
      ORDER BY aj.created_at ASC
    `);
    sendResponse(res, result);
  } catch (error) {
    console.error("Assignments fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

assignment_router.post("/", async (req, res) => {
  try {
    const { incoming_id, quantity } = req.body;

    if (!incoming_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO assigned_job (incoming_id, quantity) VALUES (?, ?)`,
      [incoming_id, quantity]
    );

    res.status(201).json({
      success: true,
      message: "Atama başarıyla eklendi.",
      data: [{ id: result.insertId }],
    });
  } catch (error) {
    console.error("Assignment ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

export default assignment_router;
