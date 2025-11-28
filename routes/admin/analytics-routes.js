const express = require("express");

const {
  getSalesAnalytics,
  getTopSellingProducts,
  getSalesTrend,
  getCategorySales,
  getDashboardSummary,
} = require("../../controllers/admin/analytics-controller");

const router = express.Router();

router.get("/sales", getSalesAnalytics);
router.get("/top-products", getTopSellingProducts);
router.get("/sales-trend", getSalesTrend);
router.get("/category-sales", getCategorySales);
router.get("/dashboard-summary", getDashboardSummary);

module.exports = router;
