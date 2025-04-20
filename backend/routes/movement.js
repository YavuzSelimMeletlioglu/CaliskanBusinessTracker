import express from "express";
import pool from "../config/db.js";

const movement_router = express.Router();

movement_router.get("/", async (req, res) => {
  const [products] = await pool.query(
    `SELECT
    C.name AS company_name,
    C.id AS company_id,
    P.name AS product_name,
    M.product_id as product_id,
    SUM(CASE WHEN M.movement_type = 'incoming' THEN M.mass ELSE 0 END) AS total_incoming,
    SUM(CASE WHEN M.movement_type = 'outgoing' THEN M.mass ELSE 0 END) AS total_outgoing,
    SUM(CASE WHEN M.movement_type = 'outgoing' THEN M.mass ELSE 0 END) -
    SUM(CASE WHEN M.movement_type = 'incoming' THEN M.mass ELSE 0 END)
    AS remaining_mass,
    MAX(M.movement_date) AS last_movement_date,
        (SELECT pm2.movement_type
     FROM product_movements pm2
     WHERE pm2.product_id = M.product_id
       AND pm2.company_id = M.company_id
     ORDER BY pm2.movement_date DESC, pm2.id DESC
     LIMIT 1
    ) AS last_movement_type
    FROM product_movements AS M
    JOIN products AS P ON M.product_id = P.id
    JOIN companies AS C ON M.company_id = C.id
    GROUP BY C.id, C.name, P.name, M.product_id
    ORDER BY last_movement_date`
  );

  return res.status(200).json({
    success: true,
    data: products,
  });
});

movement_router.post("/add-movement", async (req, res) => {
  const { product_id, company_id, movement_type, mass } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO product_movements
       (product_id, company_id, movement_type, mass, movement_date)
       VALUES (?, ?, ?, ?, ?)`,
      [product_id, company_id, movement_type, parseFloat(mass), new Date()]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add movement" });
  }
});

movement_router.get("/inners", async (req, res) => {
  const [products] = await pool.query(
    `SELECT
    c.name AS company_name,
    p.name AS product_name,
    c.id AS company_id,
    p.id AS product_id,
    p.project_code,
    SUM(CASE WHEN pm.movement_type = 'incoming' THEN pm.mass ELSE 0 END) AS total_incoming,
    SUM(CASE WHEN pm.movement_type = 'outgoing' THEN pm.mass ELSE 0 END) AS total_outgoing,
    (SUM(CASE WHEN pm.movement_type = 'incoming' THEN pm.mass ELSE 0 END)
     - SUM(CASE WHEN pm.movement_type = 'outgoing' THEN pm.mass ELSE 0 END)) AS remaining_mass,
    MAX(CASE WHEN pm.movement_type = 'incoming' THEN pm.movement_date END) AS last_incoming_date,
    
    (SELECT pm2.movement_type
     FROM product_movements pm2
     WHERE pm2.product_id = pm.product_id
       AND pm2.company_id = pm.company_id
     ORDER BY pm2.movement_date DESC, pm2.id DESC
     LIMIT 1
    ) AS last_movement_type

    FROM product_movements pm
    JOIN products p ON pm.product_id = p.id
    JOIN companies c ON pm.company_id = c.id
    GROUP BY c.id, p.id
    HAVING remaining_mass > 0
    ORDER BY last_incoming_date;`
  );

  return res.status(200).json({
    success: true,
    data: products,
  });
});

export default movement_router;
