import express from "express";
import pool from "../config/db.js";

const pool_router = express.Router();

pool_router.post("/assign-to-pool", async (req, res) => {
  try {
    const { pool_number, company_id, product_id, bath_time } = req.body;

    if (!pool_number || !company_id || !product_id || !bath_time) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    await pool.query(
      `UPDATE acid_bath 
       SET company_id = ?, product_id = ?, bath_time = ?, remaining_time = ?, is_active = TRUE, updated_at = NOW()
       WHERE pool_number = ?`,
      [company_id, product_id, bath_time, bath_time, pool_number]
    );

    res.status(200).json({ success: true, message: "Havuz başarıyla atandı." });
  } catch (error) {
    console.error("Havuz atama hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

pool_router.post("/release-pool", async (req, res) => {
  try {
    const { pool_number } = req.body;

    if (!pool_number) {
      return res
        .status(400)
        .json({ success: false, message: "Havuz numarası gerekli!" });
    }

    await pool.query(
      `UPDATE acid_bath 
       SET company_id = NULL, product_id = NULL, bath_time = NULL, remaining_time = NULL, is_active = FALSE, updated_at = NOW()
       WHERE pool_number = ?`,
      [pool_number]
    );

    res
      .status(200)
      .json({ success: true, message: "Havuz başarıyla boşaltıldı." });
  } catch (error) {
    console.error("Havuz boşaltma hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

pool_router.get("/list-pools", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ab.pool_number,
      ab.remaining_time,
       ab.is_active,
       c.name as company_name,
       p.name as product_name
       FROM acid_bath ab
      LEFT JOIN companies c ON c.id = ab.company_id
      LEFT JOIN products p ON p.id = ab.product_id
      ORDER BY pool_number ASC`
    );
    console.log(rows);
    res.status(200).json({
      success: true,
      message: "Havuz başarıyla boşaltıldı.",
      data: rows,
    });
  } catch (error) {
    console.error("Havuz listeleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

const decrement = 0.1;
/*
setInterval(async () => {
  try {
    const [result] = await pool.query(
      `UPDATE acid_bath 
       SET remaining_time = remaining_time - 0.1, 
           updated_at = NOW()
       WHERE is_active = TRUE 
         AND remaining_time IS NOT NULL 
         AND remaining_time > 0`
    );

    console.log(
      `[${new Date().toISOString()}] Havuzlarda kalan süre 10 saniye azaltıldı. Etkilenen satır: ${
        result.affectedRows
      }`
    );
  } catch (error) {
    console.error("Kalan süre azaltma hatası:", error);
  }
}, 10000);
*/
export default pool_router;
