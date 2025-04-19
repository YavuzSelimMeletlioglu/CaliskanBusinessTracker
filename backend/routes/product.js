import express from "express";
import pool from "../config/db.js";

const product_router = express.Router();
const productsTableName = "products";
const companyTableName = "companies";

product_router.get("/", async (req, res) => {
  const [products] = await pool.query(
    `SELECT
    C.name AS company_name,
    C.id AS company_id,
    P.name AS product_type,
    M.product_id as product_id,
    SUM(CASE WHEN M.movement_type = 'incoming' THEN M.mass ELSE 0 END) AS total_incoming,
    SUM(CASE WHEN M.movement_type = 'outgoing' THEN M.mass ELSE 0 END) AS total_outgoing,
    SUM(CASE WHEN M.movement_type = 'incoming' THEN M.mass ELSE 0 END) -
    SUM(CASE WHEN M.movement_type = 'outgoing' THEN M.mass ELSE 0 END) AS remaining_mass,
    MAX(M.movement_date) AS last_movement_date
    FROM product_movements AS M
    JOIN products AS P ON M.product_id = P.id
    JOIN companies AS C ON M.company_id = C.id
    GROUP BY C.id, C.name, P.name, M.product_id;`
  );

  if (products.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No products found",
    });
  } else {
    res.status(200).json({
      success: true,
      data: products,
    });
  }
});

product_router.post("/ekle", async (req, res) => {
  const { product_type, mass, isEntering } = req.body;
  const [isSuccessfull] = await pool.query(`INSERT INTO products`);
});

product_router.get("/iceridekiler", async (req, res) => {
  const [products] = await pool.query(
    `SELECT
    C.name AS company_name,
    P.type AS product_type,
    SUM(P.incoming_mass) - SUM(P.outgoing_mass) AS remaining_mass,
    MAX(P.outgoing_date) AS outgoing_date
    FROM ${productsTableName} AS P
    JOIN ${companyTableName} AS C ON P.company_id = C.id
    GROUP BY C.name, P.type
    HAVING SUM(P.outgoing_mass) <= SUM(P.incoming_mass);`
  );

  if (products.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No products found",
    });
  } else {
    res.status(200).json({
      success: true,
      data: products,
    });
  }
});

export default product_router;
