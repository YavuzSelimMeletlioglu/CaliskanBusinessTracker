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
        i.company_id,
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
        pr.company_id,
        pr.product_id,
        c.name AS company_name,
        p.name AS product_name,
        pr.quantity,
        pr.created_at
      FROM process pr
      JOIN companies c ON pr.company_id = c.id
      JOIN products p ON pr.product_id = p.id
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
        s.company_id AS company_id,
        s.product_id,
        s.quantity,
        s.created_at
      FROM store s
      JOIN companies c ON s.company_id = c.id
      JOIN products p ON s.product_id = p.id
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
    const { company_id, product_id, quantity } = req.body;

    if (!product_id || !company_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO process (company_id, product_id, quantity) VALUES (?, ?, ?)`,
      [company_id, product_id, quantity]
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

operation_router.post("/stores", async (req, res) => {
  try {
    const { company_id, product_id, quantity } = req.body;
    if (!company_id || !product_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO store (company_id, product_id, quantity) VALUES (?, ?, ?)`,
      [company_id, product_id, quantity]
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

operation_router.delete("/stores", async (req, res) => {
  try {
    const { company_id, product_id, quantity } = req.body;
    if (!company_id || !product_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [rows] = await pool.query(
      "SELECT quantity FROM store WHERE company_id = ? AND product_id = ? ORDER BY created_at ASC LIMIT 1",
      [company_id, product_id]
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Kayıt bulunamadı!" });
    }

    const currentQuantity = rows[0].quantity;
    const newQuantity = currentQuantity - quantity;

    if (newQuantity <= 0) {
      await pool.query(
        "DELETE FROM store WHERE company_id = ? AND product_id = ? ORDER BY created_at ASC LIMIT 1",
        [company_id, product_id]
      );

      return res.status(200).json({
        success: true,
        message: "Store silindi, çünkü miktar 0'ın altına düştü.",
      });
    } else {
      await pool.query(
        "UPDATE store SET quantity = ? WHERE company_id = ? AND product_id = ? ORDER BY created_at ASC LIMIT 1",
        [newQuantity, company_id, product_id]
      );

      return res.status(200).json({
        success: true,
        message: "Store miktarı güncellendi.",
        newQuantity,
      });
    }
  } catch (error) {
    console.error("Store silme/güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

export default operation_router;
