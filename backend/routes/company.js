import express from "express";
import pool from "../config/db.js";

const company_router = express.Router();

company_router.get("/", async (req, res) => {
  const [companies] = await pool.query(`SELECT * FROM companies;`);

  if (companies.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Firma bulunamadı!",
    });
  } else {
    res.status(200).json({
      success: true,
      data: companies,
    });
  }
});

company_router.post("/add-company", async (req, res) => {
  const { name } = req.body;
  console.log("İstek geldi");
  try {
    const [result] = await pool.query(
      "INSERT INTO companies (name) VALUES (?)",
      [name]
    );
    res.status(201).json({ success: true, company_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to add product" });
  }
});

export default company_router;
