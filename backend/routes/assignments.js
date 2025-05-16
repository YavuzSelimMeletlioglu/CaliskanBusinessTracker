// src/routes/assignment_router.ts (veya .js)

import express from "express";
import pool from "../config/db.js";
import { sendResponse } from "../response_type.js";

const assignment_router = express.Router();

assignment_router.get("/", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT
        aj.id AS assignment_id,
        aj.company_id,
        c.name AS company_name,
        aj.product_id,
        p.name AS product_name,
        aj.user_id,
        u.name AS user_name,
        aj.quantity,
        aj.last_date_completion,
        aj.completed_quantity
      FROM assignment aj
      JOIN companies c ON aj.company_id = c.id
      JOIN products p ON aj.product_id = p.id
      JOIN users u ON aj.user_id = u.id
      ORDER BY aj.created_at ASC, user_name
    `);

    sendResponse(res, result);
  } catch (error) {
    console.error("Assignments fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

assignment_router.post("/filter-strict", async (req, res) => {
  try {
    const { company_id, product_id } = req.body;

    if (!company_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: "company_id, product_id, quantity ve created_at zorunludur.",
      });
    }
    console.log(req.body);
    const [result] = await pool.query(
      `
      SELECT 
        u.name AS user_name,
        a.quantity
      FROM assignment a
      JOIN users u ON a.user_id = u.id
      WHERE a.company_id = ?
        AND a.product_id = ?
      `,
      [company_id, product_id]
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Strict filtered assignment fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

assignment_router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const [result] = await pool.query(
      `
      SELECT
      aj.id AS assignment_id,
        aj.company_id,
        c.name AS company_name,
        aj.product_id,
        p.name AS product_name,
        aj.user_id,
        u.name AS user_name,
        aj.quantity,
        aj.last_date_completion,
        aj.completed_quantity
      FROM assignment aj
      JOIN companies c ON aj.company_id = c.id
      JOIN products p ON aj.product_id = p.id
      JOIN users u ON aj.user_id = u.id
      WHERE aj.user_id = ?
      ORDER BY aj.created_at ASC, user_name
      `,
      [user_id]
    );

    sendResponse(res, result);
  } catch (error) {
    console.error("Assignments fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

assignment_router.post("/add-assignment", async (req, res) => {
  try {
    const { company_id, product_id, quantity, user_id, last_date_completion } =
      req.body;
    console.log(req.body);
    if (!company_id || !product_id || !quantity || !user_id) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO assignment (company_id, product_id, quantity, user_id, last_date_completion) VALUES (?, ?, ?, ?, ?)`,
      [company_id, product_id, quantity, user_id, last_date_completion]
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

assignment_router.post("/update-quantity", async (req, res) => {
  try {
    const { quantity, assignment_id } = req.body;

    if (!assignment_id || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [oldQuantityResult] = await pool.query(
      "SELECT completed_quantity FROM assignment WHERE id = ?",
      [assignment_id]
    );

    const currentQuantity =
      parseInt(oldQuantityResult[0].completed_quantity) || 0;
    const increment = parseInt(quantity) || 0;
    const newQuantity = currentQuantity + increment;

    await pool.query(
      "UPDATE assignment SET completed_quantity = ? WHERE id = ?",
      [newQuantity, assignment_id]
    );

    res.status(201).json({
      success: true,
      message: "Yapılan ürün güncellemesi başarıyla eklendi.",
    });
  } catch (error) {
    console.error("Assignment ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

assignment_router.delete("/", async (req, res) => {
  try {
    const { assignment_id } = req.body;

    if (!assignment_id) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }
    await pool.query("DELETE FROM assignment WHERE id = ?", [assignment_id]);

    return res.status(200).json({
      success: true,
      message: "Store silindi, çünkü miktar 0'ın altına düştü.",
    });
  } catch (error) {
    console.error("Store silme/güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

export default assignment_router;
