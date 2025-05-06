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
        aj.company_id,
        aj.product_id,
        aj.quantity,
        aj.created_at
      FROM assignment aj
      JOIN companies c ON aj.company_id = c.id
      JOIN products p ON aj.product_id = p.id
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
    const { company_id, product_id, quantity } = req.body;

    if (!company_id || !product_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO assignment (company_id, product_id, quantity) VALUES (?, ?, ?)`,
      [company_id, product_id, quantity]
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

assignment_router.delete("/", async (req, res) => {
  try {
    const { company_id, product_id, quantity } = req.body;

    if (!company_id || !product_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [rows] = await pool.query(
      "SELECT quantity FROM assignment WHERE company_id = ? AND product_id = ? ORDER BY created_at ASC LIMIT 1",
      [company_id, product_id]
    );

    if (rows.length === 0) {
      console.error("Bulunamadı");
    }

    const currentQuantity = rows[0].quantity;
    const newQuantity = currentQuantity - quantity;

    if (newQuantity <= 0) {
      // Quantity sıfır veya altına düşerse kaydı sil
      await pool.query(
        "DELETE FROM assignment WHERE company_id = ? AND product_id = ? ORDER BY created_at ASC LIMIT 1",
        [company_id, product_id]
      );

      return res.status(200).json({
        success: true,
        message: "Store silindi, çünkü miktar 0'ın altına düştü.",
      });
    } else {
      // Aksi halde quantity azaltılır
      await pool.query(
        "UPDATE assignment SET quantity = ? WHERE company_id = ? AND product_id = ? ORDER BY created_at ASC LIMIT 1",
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

export default assignment_router;
