import express from "express";
import pool from "../config/db.js";
import axios from "axios";

const pool_router = express.Router();

pool_router.post("/assign-to-pool", async (req, res) => {
  try {
    const { company_id, product_id, bath_time } = req.body;

    if (!company_id || !product_id || !bath_time) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [empty] = await pool.query(
      `SELECT pool_number FROM acid_bath WHERE is_active = FALSE LIMIT 1`
    );

    if (empty.length === 0) {
      await pool.query(
        `INSERT INTO pool_queue (company_id, product_id, bath_time) VALUES (?, ?, ?)`,
        [company_id, product_id, bath_time]
      );

      return res.status(200).json({
        success: true,
        message: `Ürün sıraya alındı.`,
      });
    }

    const pool_number = empty[0].pool_number;

    await pool.query(
      `UPDATE acid_bath 
       SET company_id = ?, product_id = ?, bath_time = ?, remaining_time = ?, is_active = TRUE, updated_at = NOW()
       WHERE pool_number = ?`,
      [company_id, product_id, bath_time, bath_time * 60, pool_number]
    );

    // Motoru çağır
    try {
      await axios.get("http://ml:5000/motor/move", {
        params: { from: 0, to: pool_number },
      });
    } catch (motorError) {
      console.error(`Motor hatası (assign-to-pool):`, motorError.message);
    }

    res.status(200).json({
      success: true,
      message: `Havuz ${pool_number} atandı ve motor tetiklendi.`,
    });
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

    // Boşaltılan ürün kurutma alanına taşınmalı
    try {
      await axios.get("http://ml:5000/motor/move", {
        params: { from: pool_number, to: 5 }, // 5 = kurutma bölgesi
      });
    } catch (motorError) {
      console.error(`Motor hatası (release-pool):`, motorError.message);
    }

    res.status(200).json({ success: true, message: "Havuz boşaltıldı." });
  } catch (error) {
    console.error("Havuz boşaltma hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

pool_router.get("/list-pools", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ab.pool_number, ab.remaining_time, ab.is_active,
             c.name as company_name, p.name as product_name
      FROM acid_bath ab
      LEFT JOIN companies c ON c.id = ab.company_id
      LEFT JOIN products p ON p.id = ab.product_id
      ORDER BY pool_number ASC
    `);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Havuz listeleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

pool_router.get("/empty-pool", async (req, res) => {
  try {
    const [emptyPool] = await pool.query(
      `SELECT * FROM acid_bath WHERE is_active = 0 ORDER BY pool_number ASC LIMIT 1`
    );
    res.status(200).json({ success: true, data: emptyPool[0] });
  } catch (error) {
    console.error("Boş havuz arama hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

// === ZAMANLAYICI ===
setInterval(async () => {
  const connection = await pool.getConnection();
  try {
    // 1. Süresi dolan havuzları boşalt
    const [expired] = await connection.query(`
      SELECT pool_number FROM acid_bath
      WHERE is_active = TRUE AND remaining_time <= 0
    `);

    for (const pool of expired) {
      const { pool_number } = pool;

      await connection.query(
        `
        UPDATE acid_bath
        SET company_id = NULL, product_id = NULL,
            bath_time = NULL, remaining_time = NULL,
            is_active = FALSE, updated_at = NOW()
        WHERE pool_number = ?
      `,
        [pool_number]
      );

      try {
        await axios.get("http://ml:5000/motor/move", {
          params: { from: pool_number, to: 5 }, // kurutma alanı
        });
        console.log(`Motor boşaltma tetiklendi (pool ${pool_number} → 5)`);
      } catch (motorError) {
        console.error(
          `Motor boşaltma hatası (pool ${pool_number}):`,
          motorError.message
        );
      }

      console.log(`Pool ${pool_number} otomatik boşaltıldı.`);
    }

    // 2. Aktif havuz süresini azalt
    await connection.query(`
      UPDATE acid_bath
      SET remaining_time = remaining_time - 10,
          updated_at = NOW()
      WHERE is_active = TRUE
        AND remaining_time IS NOT NULL
        AND remaining_time > 0
    `);

    // 3. Kuyruktan ilk ürünü boş havuza ata
    const [nextQueue] = await connection.query(`
      SELECT * FROM pool_queue ORDER BY created_at ASC LIMIT 1
    `);

    if (nextQueue.length > 0) {
      const queueItem = nextQueue[0];
      const [emptyNow] = await connection.query(`
        SELECT pool_number FROM acid_bath WHERE is_active = FALSE LIMIT 1
      `);

      if (emptyNow.length > 0) {
        const pool_number = emptyNow[0].pool_number;

        await connection.query(
          `
          UPDATE acid_bath
          SET company_id = ?, product_id = ?, bath_time = ?, remaining_time = ?, is_active = TRUE, updated_at = NOW()
          WHERE pool_number = ?
        `,
          [
            queueItem.company_id,
            queueItem.product_id,
            queueItem.bath_time,
            queueItem.bath_time * 60,
            pool_number,
          ]
        );

        await connection.query(`DELETE FROM pool_queue WHERE id = ?`, [
          queueItem.id,
        ]);

        try {
          await axios.get("http://ml:5000/motor/move", {
            params: { from: 0, to: pool_number },
          });
          console.log(`Motor sıradaki ürün için çalıştı: 0 → ${pool_number}`);
        } catch (motorError) {
          console.error(
            `Motor kuyruk hatası (pool ${pool_number}):`,
            motorError.message
          );
        }

        console.log(`Kuyruktaki ürün havuz ${pool_number}’e atandı.`);
      }
    }
  } catch (error) {
    console.error("Zamanlayıcı hatası:", error);
  } finally {
    connection.release();
  }
}, 10000);

export default pool_router;
