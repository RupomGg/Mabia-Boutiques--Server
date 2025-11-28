const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    image: String, // Keeping for backward compatibility
    images: [String], // Array of image URLs (max 6)
    title: String,
    description: String,
    category: String,
    subcategory: String, // For custom or predefined subcategories
    type: {
      type: String,
      enum: ["stitched", "unstitched", "none", ""],
      default: "none",
    }, // Type of product
    sizes: [String], // Available sizes for stitched products
    style: String,
    price: Number,
    salePrice: Number,
    totalStock: Number,
    averageReview: Number,
    specialInstructions: String, // Optional special instructions
    
    // New fields
    isNew: {
      type: Boolean,
      default: false,
    }, // Mark product as "New"
    measurements: String, // Optional product measurements
    fabricDetails: {
      kamizFabric: {
        type: String,
        default: "",
      },
      salwarFabric: {
        type: String,
        default: "",
      },
      ornaFabric: {
        type: String,
        default: "",
      },
      sameFabricForAll: {
        type: Boolean,
        default: false,
      },
    }, // Fabric information
    inStock: {
      type: Boolean,
      default: true,
    }, // Stock availability status
    searchTags: [String], // Tags for search and filtering
    
    // Saree-specific fields
    blousePieceAvailable: {
      type: Boolean,
      default: false,
    }, // For saree category - blouse piece availability
    sareeLength: String, // For saree category - length of saree (mandatory for saree)
    sareeFabricDetails: {
      sareeFabric: {
        type: String,
        default: "",
      },
      blouseFabric: {
        type: String,
        default: "",
      },
    }, // Fabric information for saree and blouse
    
    // Two-piece specific - which parts are included
    includedParts: [String], // For two-piece: ["kameez", "shalwar", "dupatta"]
    
    // Kurti specific - single fabric
    kurtiFabric: String, // For kurti category - single fabric detail
    
    // Burkha specific fields
    burkhaFabric: String, // For burkha category - single fabric detail
    burkhaWorkType: {
      type: String,
      enum: ["stone-work", "embroidery", "plain", ""],
      default: "",
    }, // For burkha - type of work (mandatory)
    
    // Hijab specific fields
    hijabPieceCount: {
      type: Number,
      enum: [1, 2, 4, 6, 0],
      default: 0,
    }, // For hijab - number of pieces (mandatory)
    hijabFabric: String, // For hijab category - single fabric detail (mandatory)
    hijabLength: String, // For hijab category - length measurement (mandatory)
    
    // Country of origin - for all categories
    countryOfOrigin: String, // Made in country (e.g., "India", "Bangladesh", "Pakistan")
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
