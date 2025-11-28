const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: "dcvj9kz1o",
  api_key: "162839956952957",
  api_secret: "lx2NfDBVWunLI6SdYiE46IlC7F8",
  timeout: 60000, // 60 seconds timeout
});

const storage = new multer.memoryStorage();

async function imageUploadUtil(file) {
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
      timeout: 60000, // 60 seconds
      chunk_size: 6000000, // 6MB chunks for large files
    });

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

module.exports = { upload, imageUploadUtil };
