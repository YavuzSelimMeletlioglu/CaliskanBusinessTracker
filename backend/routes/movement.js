// src/routes/total_operation_router.ts (veya .js)

import express from "express";
import pool from "../config/db.js";
import { sendResponse } from "../response_type.js";

const total_operation_router = express.Router();

total_operation_router.get("/total-incomings", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        c.name AS company_name,
        p.name AS product_name,
        ti.company_id AS comp_id,
        ti.product_id,
        ti.mass,
        ti.created_at
      FROM total_incoming ti
      JOIN companies c ON ti.company_id = c.id
      JOIN products p ON ti.product_id = p.id
      ORDER BY ti.created_at ASC
    `);
    sendResponse(res, result);
  } catch (error) {
    console.error("Total incomings fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

// POST total_incomings
total_operation_router.post("/total-incomings", async (req, res) => {
  try {
    const { company_id, product_id, mass } = req.body;

    if (!company_id || !product_id || !mass) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO total_incoming (company_id, product_id, mass) VALUES (?, ?, ?)`,
      [company_id, product_id, mass]
    );

    res.status(201).json({
      success: true,
      message: "Total Incoming başarıyla eklendi.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Total incoming ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

// GET total_outgoings
total_operation_router.get("/total-outgoings", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        c.name AS company_name,
        p.name AS product_name,
        ti.company_id AS comp_id,
        ti.product_id,
        to2.mass,
        to2.created_at
      FROM total_outgoing to2
      JOIN total_incoming ti ON to2.total_incoming_id = ti.id
      JOIN companies c ON ti.company_id = c.id
      JOIN products p ON ti.product_id = p.id
      ORDER BY to2.created_at ASC
    `);
    sendResponse(res, result);
  } catch (error) {
    console.error("Total outgoings fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

// POST total_outgoings
total_operation_router.post("/total-outgoings", async (req, res) => {
  try {
    const { total_incoming_id, mass } = req.body;

    if (!total_incoming_id || !mass) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO total_outgoing (total_incoming_id, mass) VALUES (?, ?)`,
      [total_incoming_id, mass]
    );

    res.status(201).json({
      success: true,
      message: "Total Outgoing başarıyla eklendi.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Total outgoing ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

export default total_operation_router;
