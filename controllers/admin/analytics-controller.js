const Order = require("../../models/Order");
const Product = require("../../models/Product");

// Get sales analytics for a specific date or date range
const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to today if no dates provided
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : new Date(new Date().setHours(23, 59, 59, 999));

    // Get orders in date range
    const orders = await Order.find({
      orderDate: {
        $gte: start,
        $lte: end,
      },
      orderStatus: { $nin: ["cancelled", "rejected"] }, // Exclude cancelled orders
    });

    // Get all orders in date range (including cancelled for status breakdown)
    const allOrders = await Order.find({
      orderDate: {
        $gte: start,
        $lte: end,
      },
    });

    // Calculate total sales amount (excluding cancelled)
    const totalSales = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    // Calculate number of orders
    const totalOrders = orders.length;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get order status breakdown with amounts
    const deliveredOrders = allOrders.filter(order => order.orderStatus === "delivered");
    const processingOrders = allOrders.filter(order => 
      ["pending", "inProcess", "inShipping"].includes(order.orderStatus)
    );
    const returnedOrders = allOrders.filter(order => order.orderStatus === "returned");

    const deliveredAmount = deliveredOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0), 0
    );
    const processingAmount = processingOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0), 0
    );
    const returnedAmount = returnedOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0), 0
    );

    const totalOrdersCount = allOrders.length;

    // Get payment method breakdown
    const ordersByPaymentMethod = orders.reduce((acc, order) => {
      const method = order.paymentMethod || "unknown";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        averageOrderValue,
        orderStatusBreakdown: {
          delivered: {
            count: deliveredOrders.length,
            amount: deliveredAmount,
            percentage: totalOrdersCount > 0 ? ((deliveredOrders.length / totalOrdersCount) * 100).toFixed(2) : 0,
          },
          processing: {
            count: processingOrders.length,
            amount: processingAmount,
            percentage: totalOrdersCount > 0 ? ((processingOrders.length / totalOrdersCount) * 100).toFixed(2) : 0,
          },
          returned: {
            count: returnedOrders.length,
            amount: returnedAmount,
            percentage: totalOrdersCount > 0 ? ((returnedOrders.length / totalOrdersCount) * 100).toFixed(2) : 0,
          },
        },
        ordersByPaymentMethod,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales analytics",
    });
  }
};

// Get top selling products
const getTopSellingProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    // Default to last 30 days if no dates provided
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : new Date(new Date().setHours(23, 59, 59, 999));

    // Get all orders in date range
    const orders = await Order.find({
      orderDate: {
        $gte: start,
        $lte: end,
      },
      orderStatus: { $nin: ["cancelled", "rejected"] },
    });

    // Aggregate product sales
    const productSales = {};
    orders.forEach((order) => {
      order.cartItems.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            title: item.title,
            image: item.image,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
          };
        }
        productSales[item.productId].totalQuantity += item.quantity || 0;
        productSales[item.productId].totalRevenue +=
          (parseFloat(item.price) || 0) * (item.quantity || 0);
        productSales[item.productId].orderCount += 1;
      });
    });

    // Convert to array and sort by total revenue
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching top selling products",
    });
  }
};

// Get sales trend data (daily breakdown)
const getSalesTrend = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : new Date(new Date().setHours(23, 59, 59, 999));

    // Get all orders in date range
    const orders = await Order.find({
      orderDate: {
        $gte: start,
        $lte: end,
      },
      orderStatus: { $nin: ["cancelled", "rejected"] },
    });

    // Group by date
    const salesByDate = {};
    orders.forEach((order) => {
      const dateKey = new Date(order.orderDate).toISOString().split("T")[0];
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = {
          date: dateKey,
          totalSales: 0,
          orderCount: 0,
        };
      }
      salesByDate[dateKey].totalSales += order.totalAmount || 0;
      salesByDate[dateKey].orderCount += 1;
    });

    // Convert to array and sort by date
    const trendData = Object.values(salesByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.status(200).json({
      success: true,
      data: trendData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales trend",
    });
  }
};

// Get category-wise sales
const getCategorySales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : new Date(new Date().setHours(23, 59, 59, 999));

    const orders = await Order.find({
      orderDate: {
        $gte: start,
        $lte: end,
      },
      orderStatus: { $nin: ["cancelled", "rejected"] },
    });

    // Get product details for categorization
    const productIds = [
      ...new Set(
        orders.flatMap((order) => order.cartItems.map((item) => item.productId))
      ),
    ];
    const products = await Product.find({ _id: { $in: productIds } });

    // Create product category map
    const productCategoryMap = {};
    products.forEach((product) => {
      productCategoryMap[product._id.toString()] = product.category;
    });

    // Aggregate sales by category
    const categorySales = {};
    orders.forEach((order) => {
      order.cartItems.forEach((item) => {
        const category =
          productCategoryMap[item.productId] || "Uncategorized";
        if (!categorySales[category]) {
          categorySales[category] = {
            category,
            totalRevenue: 0,
            totalQuantity: 0,
          };
        }
        categorySales[category].totalRevenue +=
          (parseFloat(item.price) || 0) * (item.quantity || 0);
        categorySales[category].totalQuantity += item.quantity || 0;
      });
    });

    const categoryData = Object.values(categorySales).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    res.status(200).json({
      success: true,
      data: categoryData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching category sales",
    });
  }
};

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    // Today's sales
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

    const todayOrders = await Order.find({
      orderDate: {
        $gte: todayStart,
        $lte: todayEnd,
      },
      orderStatus: { $nin: ["cancelled", "rejected"] },
    });

    const todaySales = todayOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    // This month's sales
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const monthEnd = new Date(new Date().setHours(23, 59, 59, 999));

    const monthOrders = await Order.find({
      orderDate: {
        $gte: monthStart,
        $lte: monthEnd,
      },
      orderStatus: { $nin: ["cancelled", "rejected"] },
    });

    const monthSales = monthOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    // Lifetime sales (all time)
    const lifetimeOrders = await Order.find({
      orderStatus: { $nin: ["cancelled", "rejected"] },
    });

    const lifetimeSales = lifetimeOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    // Order status breakdown for lifetime
    const deliveredOrders = await Order.countDocuments({
      orderStatus: "delivered",
    });

    const processingOrders = await Order.countDocuments({
      orderStatus: { $in: ["pending", "inProcess", "inShipping"] },
    });

    const returnedOrders = await Order.countDocuments({
      orderStatus: "returned",
    });

    const cancelledOrders = await Order.countDocuments({
      orderStatus: { $in: ["cancelled", "rejected"] },
    });

    // Calculate percentages and amounts for each status
    const totalOrdersCount = lifetimeOrders.length;
    
    const deliveredAmount = lifetimeOrders
      .filter(order => order.orderStatus === "delivered")
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const processingAmount = lifetimeOrders
      .filter(order => ["pending", "inProcess", "inShipping"].includes(order.orderStatus))
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const returnedAmount = lifetimeOrders
      .filter(order => order.orderStatus === "returned")
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Total products
    const totalProducts = await Product.countDocuments();

    // Low stock products (less than 10)
    const lowStockProducts = await Product.countDocuments({
      totalStock: { $lt: 10, $gt: 0 },
    });

    // Out of stock products
    const outOfStockProducts = await Product.countDocuments({
      $or: [{ totalStock: 0 }, { inStock: false }],
    });

    // Pending orders
    const pendingOrders = await Order.countDocuments({
      orderStatus: "pending",
    });

    res.status(200).json({
      success: true,
      data: {
        today: {
          sales: todaySales,
          orders: todayOrders.length,
        },
        month: {
          sales: monthSales,
          orders: monthOrders.length,
        },
        lifetime: {
          sales: lifetimeSales,
          orders: totalOrdersCount,
          delivered: {
            count: deliveredOrders,
            amount: deliveredAmount,
            percentage: totalOrdersCount > 0 ? ((deliveredOrders / totalOrdersCount) * 100).toFixed(2) : 0,
          },
          processing: {
            count: processingOrders,
            amount: processingAmount,
            percentage: totalOrdersCount > 0 ? ((processingOrders / totalOrdersCount) * 100).toFixed(2) : 0,
          },
          returned: {
            count: returnedOrders,
            amount: returnedAmount,
            percentage: totalOrdersCount > 0 ? ((returnedOrders / totalOrdersCount) * 100).toFixed(2) : 0,
          },
          cancelled: {
            count: cancelledOrders,
            percentage: totalOrdersCount > 0 ? ((cancelledOrders / totalOrdersCount) * 100).toFixed(2) : 0,
          },
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        pendingOrders,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard summary",
    });
  }
};

module.exports = {
  getSalesAnalytics,
  getTopSellingProducts,
  getSalesTrend,
  getCategorySales,
  getDashboardSummary,
};
