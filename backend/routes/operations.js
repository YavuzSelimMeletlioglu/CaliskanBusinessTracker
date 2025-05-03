import express from "express";
import pool from "../config/db.js";
import { sendResponse } from "../response_type.js";

const operation_router = express.Router();

operation_router.get("/incomings", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        c.name AS company_name,
        p.name AS product_name,
        i.company_id AS comp_id,
        i.product_id,
        i.quantity,
        i.created_at
      FROM incoming i
      JOIN companies c ON i.company_id = c.id
      JOIN products p ON i.product_id = p.id
      ORDER BY i.created_at ASC
    `);
    sendResponse(res, result);
  } catch (error) {
    console.error("Incomings fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

operation_router.get("/processes", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        c.name AS company_name,
        p.name AS product_name,
        inc.company_id AS comp_id,
        inc.product_id,
        pr.quantity,
        pr.created_at
      FROM process pr
      JOIN incoming inc ON pr.incoming_id = inc.id
      JOIN companies c ON inc.company_id = c.id
      JOIN products p ON inc.product_id = p.id
      ORDER BY pr.created_at ASC
    `);
    sendResponse(res, result);
  } catch (error) {
    console.error("Processes fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

operation_router.get("/stores", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        c.name AS company_name,
        p.name AS product_name,
        inc.company_id AS comp_id,
        inc.product_id,
        s.quantity,
        s.created_at
      FROM store s
      JOIN process pr ON s.process_id = pr.id
      JOIN incoming inc ON pr.incoming_id = inc.id
      JOIN companies c ON inc.company_id = c.id
      JOIN products p ON inc.product_id = p.id
      ORDER BY s.created_at ASC
    `);
    sendResponse(res, result);
  } catch (error) {
    console.error("Stores fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

operation_router.post("/incomings", async (req, res) => {
  try {
    const { company_id, product_id, quantity } = req.body;

    if (!company_id || !product_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO incoming (company_id, product_id, quantity) VALUES (?, ?, ?)`,
      [company_id, product_id, quantity]
    );

    res.status(201).json({
      success: true,
      message: "Incoming başarıyla eklendi.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Incoming ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

operation_router.post("/processes", async (req, res) => {
  try {
    const { incoming_id, quantity } = req.body;

    if (!incoming_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO process (incoming_id, quantity) VALUES (?, ?)`,
      [incoming_id, quantity]
    );

    res.status(201).json({
      success: true,
      message: "Process başarıyla eklendi.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Process ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

// Store ekleme
operation_router.post("/stores", async (req, res) => {
  try {
    const { process_id, quantity } = req.body;

    if (!process_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO store (process_id, quantity) VALUES (?, ?)`,
      [process_id, quantity]
    );

    res.status(201).json({
      success: true,
      message: "Store başarıyla eklendi.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Store ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

export default operation_router;
