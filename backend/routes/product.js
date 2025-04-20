import express from "express";
import pool from "../config/db.js";

const product_router = express.Router();
const productsTableName = "products";
const companyTableName = "companies";

product_router.post("/add-product", async (req, res) => {
  const { name, project_code } = req.body;

  try {
    const [result] = await pool.query(
      "INSERT INTO products (name, project_code) VALUES (?, ?)",
      [name, project_code || null]
    );
    res.status(201).json({ success: true, product_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to add product" });
  }
});

product_router.get("/", async (req, res) => {
  const [products] = await pool.query(`SELECT * FROM products;`);

  if (products.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Ürün bulunamadı!",
    });
  } else {
    res.status(200).json({
      success: true,
      data: products,
    });
  }
});

export default product_router;
