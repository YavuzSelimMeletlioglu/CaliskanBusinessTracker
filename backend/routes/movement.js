import express from "express";
import pool from "../config/db.js";
import { sendResponse } from "../response_type.js";

const total_operation_router = express.Router();

total_operation_router.get("/total-incomings", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        c.name AS company_name,
        p.name AS product_name,
        ti.company_id,
        ti.product_id,
        ti.mass,
        ti.created_at
      FROM total_incoming ti
      JOIN companies c ON ti.company_id = c.id
      JOIN products p ON ti.product_id = p.id
      ORDER BY ti.created_at ASC
    `);
    sendResponse(res, result);
  } catch (error) {
    console.error("Total incomings fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

total_operation_router.post("/total-incomings", async (req, res) => {
  try {
    const { company_id, product_id, mass } = req.body;

    if (!company_id || !product_id || !mass) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik bilgi gönderildi!" });
    }

    const [result] = await pool.query(
      `INSERT INTO total_incoming (company_id, product_id, mass) VALUES (?, ?, ?)`,
      [company_id, product_id, mass]
    );

    res.status(201).json({
      success: true,
      message: "Total Incoming başarıyla eklendi.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Total incoming ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

total_operation_router.get("/total-outgoings", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        c.name AS company_name,
        p.name AS product_name,
        ti.company_id,
        ti.product_id,
        to2.mass,
        to2.created_at
      FROM total_outgoing to2
      JOIN total_incoming ti ON to2.total_incoming_id = ti.id
      JOIN companies c ON ti.company_id = c.id
      JOIN products p ON ti.product_id = p.id
      ORDER BY to2.created_at ASC
    `);
    sendResponse(res, result);
  } catch (error) {
    console.error("Total outgoings fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

total_operation_router.post("/total-outgoings", async (req, res) => {
  try {
    const { company_id, product_id, mass } = req.body;

    if (!company_id || !product_id || !mass) {
      return res.status(400).json({
        success: false,
        message: "company_id, product_id ve mass zorunludur.",
      });
    }

    await pool.query(
      `INSERT INTO total_outgoing ( company_id, product_id, mass)
       VALUES (?, ?, ?)`,
      [company_id, product_id, mass]
    );

    res.status(201).json({
      success: true,
      message: "Çıkış verisi başarıyla eklendi.",
      total_incoming_id,
    });
  } catch (error) {
    console.error("Çıkış ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

total_operation_router.get("/incoming-graph-data", async (req, res) => {
  try {
    const { company_id, type } = req.query;

    if (!company_id || !type) {
      return res.status(400).json({
        success: false,
        message: "company_id ve type (monthly/yearly) gereklidir.",
      });
    }

    let groupFormat;
    let dateCondition;

    if (type === "monthly") {
      groupFormat = "%Y-%m";
      dateCondition =
        "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
    } else if (type === "yearly") {
      groupFormat = "%Y";
      dateCondition = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Geçersiz type parametresi." });
    }

    const [result] = await pool.query(
      `
      SELECT 
        DATE_FORMAT(created_at, ?) AS label,
        SUM(mass) AS incoming_mass
      FROM total_incoming
      WHERE company_id = ?
      ${dateCondition}
      GROUP BY label
      ORDER BY label ASC
      `,
      [groupFormat, company_id]
    );

    const formattedResult = result.map((row) => ({
      label: row.label,
      value: row.incoming_mass,
    }));

    sendResponse(res, formattedResult);
  } catch (error) {
    console.error("Incoming graph data fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

total_operation_router.get("/outgoing-graph-data", async (req, res) => {
  try {
    const { company_id, type } = req.query;

    if (!company_id || !type) {
      return res.status(400).json({
        success: false,
        message: "company_id ve type (monthly/yearly) gereklidir.",
      });
    }

    let groupFormat;
    let dateCondition;

    if (type === "monthly") {
      groupFormat = "%Y-%m";
      dateCondition =
        "AND to2.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
    } else if (type === "yearly") {
      groupFormat = "%Y";
      dateCondition =
        "AND to2.created_at >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Geçersiz type parametresi." });
    }

    const [result] = await pool.query(
      `
      SELECT 
        DATE_FORMAT(to2.created_at, ?) AS label,
        SUM(to2.mass) AS outgoing_mass
      FROM total_outgoing to2
      WHERE to2.company_id = ?
      ${dateCondition}
      GROUP BY label
      ORDER BY label ASC
      `,
      [groupFormat, company_id]
    );

    const formattedResult = result.map((row) => ({
      label: row.label,
      value: row.outgoing_mass,
    }));

    sendResponse(res, formattedResult);
  } catch (error) {
    console.error("Outgoing graph data fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

total_operation_router.get("/net-graph-data", async (req, res) => {
  try {
    const { company_id, type } = req.query;

    if (!company_id || !type) {
      return res.status(400).json({
        success: false,
        message: "company_id ve type (monthly/yearly) gereklidir.",
      });
    }

    let groupFormat;
    let dateCondition;

    if (type === "monthly") {
      groupFormat = "%Y-%m";
      dateCondition =
        "AND ti.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
    } else if (type === "yearly") {
      groupFormat = "%Y";
      dateCondition =
        "AND ti.created_at >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Geçersiz type parametresi." });
    }

    const [result] = await pool.query(
      `
      SELECT 
        label,
        SUM(outgoing_mass) - SUM(incoming_mass) AS net_mass
      FROM (
        SELECT 
          DATE_FORMAT(ti.created_at, ?) AS label,
          ti.mass AS incoming_mass,
          (
            SELECT IFNULL(SUM(to2.mass), 0)
            FROM total_outgoing to2
            WHERE to2.company_id = ?
          ) AS outgoing_mass
        FROM total_incoming ti
        WHERE ti.company_id = ?
          ${dateCondition}
      ) AS subquery
      GROUP BY label
      ORDER BY label ASC
      `,
      [groupFormat, company_id, company_id]
    );

    const formattedResult = result.map((row) => ({
      label: row.label,
      value: row.net_mass,
    }));

    sendResponse(res, formattedResult);
  } catch (error) {
    console.error("Net graph data fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

total_operation_router.get(
  "/incoming-graph-data-by-product",
  async (req, res) => {
    try {
      const { product_id, type } = req.query;

      if (!product_id || !type) {
        return res.status(400).json({
          success: false,
          message: "product_id ve type (monthly/yearly) gereklidir.",
        });
      }

      let groupFormat;
      let dateCondition;

      if (type === "monthly") {
        groupFormat = "%Y-%m";
        dateCondition =
          "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
      } else if (type === "yearly") {
        groupFormat = "%Y";
        dateCondition =
          "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Geçersiz type parametresi." });
      }

      const [result] = await pool.query(
        `
      SELECT 
        DATE_FORMAT(created_at, ?) AS label,
        SUM(mass) AS value
      FROM total_incoming
      WHERE product_id = ?
      ${dateCondition}
      GROUP BY label
      ORDER BY label ASC
      `,
        [groupFormat, product_id]
      );

      sendResponse(res, result);
    } catch (error) {
      console.error("Incoming graph data by product fetch error:", error);
      res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
  }
);

total_operation_router.get(
  "/outgoing-graph-data-by-product",
  async (req, res) => {
    try {
      const { product_id, type } = req.query;

      if (!product_id || !type) {
        return res.status(400).json({
          success: false,
          message: "product_id ve type (monthly/yearly) gereklidir.",
        });
      }

      let groupFormat;
      let dateCondition;

      if (type === "monthly") {
        groupFormat = "%Y-%m";
        dateCondition =
          "AND to2.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
      } else if (type === "yearly") {
        groupFormat = "%Y";
        dateCondition =
          "AND to2.created_at >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Geçersiz type parametresi." });
      }

      const [result] = await pool.query(
        `
      SELECT 
        DATE_FORMAT(to2.created_at, ?) AS label,
        SUM(to2.mass) AS value
      FROM total_outgoing to2
      WHERE to2.product_id = ?
      ${dateCondition}
      GROUP BY label
      ORDER BY label ASC
      `,
        [groupFormat, product_id]
      );

      sendResponse(res, result);
    } catch (error) {
      console.error("Outgoing graph data by product fetch error:", error);
      res.status(500).json({ success: false, message: "Sunucu hatası!" });
    }
  }
);

total_operation_router.get("/net-graph-data-by-product", async (req, res) => {
  try {
    const { product_id, type } = req.query;

    if (!product_id || !type) {
      return res.status(400).json({
        success: false,
        message: "product_id ve type (monthly/yearly) gereklidir.",
      });
    }

    let groupFormat;
    let dateCondition;

    if (type === "monthly") {
      groupFormat = "%Y-%m";
      dateCondition =
        "AND ti.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
    } else if (type === "yearly") {
      groupFormat = "%Y";
      dateCondition =
        "AND ti.created_at >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Geçersiz type parametresi." });
    }

    const [result] = await pool.query(
      `
      SELECT 
        label,
        SUM(outgoing_mass) - SUM(incoming_mass) AS net_mass
      FROM (
        SELECT 
          DATE_FORMAT(ti.created_at, ?) AS label,
          ti.mass AS incoming_mass,
          (
            SELECT IFNULL(SUM(to2.mass), 0)
            FROM total_outgoing to2
            WHERE to2.product_id = ?
          ) AS outgoing_mass
        FROM total_incoming ti
        WHERE ti.product_id = ?
          ${dateCondition}
      ) AS subquery
      GROUP BY label
      ORDER BY label ASC
      `,
      [groupFormat, product_id, product_id]
    );

    const formattedResult = result.map((row) => ({
      label: row.label,
      value: row.net_mass,
    }));

    sendResponse(res, formattedResult);
  } catch (error) {
    console.error("Net graph data by product fetch error:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});

export default total_operation_router;
