const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");
const adminAnalyticsRouter = require("./routes/admin/analytics-routes");

const shopProductsRouter = require("./routes/shop/products-routes");
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const shopSearchRouter = require("./routes/shop/search-routes");
const shopReviewRouter = require("./routes/shop/review-routes");

const commonFeatureRouter = require("./routes/common/feature-routes");

//create a database connection -> u can also
//create a separate file for this and then import/use that file here

async function fixIndexes() {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    console.log("Checking and fixing indexes...");

    // Force drop and recreate phoneNumber index
    try {
      await usersCollection.dropIndex("phoneNumber_1");
      console.log("Dropped old phoneNumber index");
    } catch (e) {
      console.log("phoneNumber index didn't exist or already dropped");
    }

    await usersCollection.createIndex(
      { phoneNumber: 1 },
      { unique: true, sparse: true }
    );
    console.log("✅ Created sparse unique phoneNumber index");

    // Force drop and recreate email index
    try {
      await usersCollection.dropIndex("email_1");
      console.log("Dropped old email index");
    } catch (e) {
      console.log("email index didn't exist or already dropped");
    }

    await usersCollection.createIndex(
      { email: 1 },
      { unique: true, sparse: true }
    );
    console.log("✅ Created sparse unique email index");

    console.log("All indexes fixed successfully!");
  } catch (error) {
    console.error("Error fixing indexes:", error.message);
  }
}

mongoose
  .connect("mongodb+srv://radwanrupom2001:JDy4dwld0Rdh7u2h@cluster0.rbsyl0p.mongodb.net/")
  .then(async () => {
    console.log("MongoDB connected");
    await fixIndexes();
  })
  .catch((error) => console.log(error));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://mabia-boutiques-shop.vercel.app"],
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);

app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/cart", shopCartRouter);
app.use("/api/shop/address", shopAddressRouter);
app.use("/api/shop/order", shopOrderRouter);
app.use("/api/shop/search", shopSearchRouter);
app.use("/api/shop/review", shopReviewRouter);

app.use("/api/common/feature", commonFeatureRouter);

app.listen(PORT, () => console.log(`Server is now running on port ${PORT}`));
