const mongoose = require("mongoose");

async function fixPhoneIndex() {
  try {
    await mongoose.connect("mongodb+srv://radwanrupom2001:JDy4dwld0Rdh7u2h@cluster0.rbsyl0p.mongodb.net/");
    console.log("MongoDB connected");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Drop the existing phoneNumber index
    try {
      await usersCollection.dropIndex("phoneNumber_1");
      console.log("✅ Dropped old phoneNumber index");
    } catch (error) {
      console.log("Index may not exist:", error.message);
    }

    // Create new sparse unique index
    await usersCollection.createIndex(
      { phoneNumber: 1 },
      { unique: true, sparse: true }
    );
    console.log("✅ Created new sparse unique index for phoneNumber");

    // Also fix email index if needed
    try {
      await usersCollection.dropIndex("email_1");
      console.log("✅ Dropped old email index");
    } catch (error) {
      console.log("Email index may not exist:", error.message);
    }

    await usersCollection.createIndex(
      { email: 1 },
      { unique: true, sparse: true }
    );
    console.log("✅ Created new sparse unique index for email");

    console.log("\n🎉 All indexes fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing indexes:", error);
    process.exit(1);
  }
}

fixPhoneIndex();
