const { imageUploadUtil } = require("../../helpers/cloudinary");
const Product = require("../../models/Product");

const handleImageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const url = "data:" + req.file.mimetype + ";base64," + b64;
    
    console.log("Uploading image to Cloudinary...");
    const result = await imageUploadUtil(url);
    console.log("Image uploaded successfully:", result.secure_url);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    
    // Handle specific Cloudinary errors
    let errorMessage = "Error occurred while uploading image";
    
    if (error.name === "TimeoutError") {
      errorMessage = "Upload timeout. Please try with a smaller image or check your internet connection.";
    } else if (error.http_code) {
      errorMessage = `Cloudinary error: ${error.message}`;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
};

//add a new product
const addProduct = async (req, res) => {
  try {
    const {
      image,
      images,
      title,
      description,
      category,
      subcategory,
      type,
      sizes,
      style,
      price,
      salePrice,
      totalStock,
      averageReview,
      specialInstructions,
      isNew,
      measurements,
      fabricDetails,
      inStock,
      searchTags,
      blousePieceAvailable,
      sareeLength,
      sareeFabricDetails,
      includedParts,
      kurtiFabric,
      countryOfOrigin,
      burkhaFabric,
      burkhaWorkType,
      hijabPieceCount,
      hijabFabric,
      hijabLength,
    } = req.body;

    console.log(averageReview, "averageReview");

    const newlyCreatedProduct = new Product({
      image,
      images: images || [],
      title,
      description,
      category,
      subcategory: subcategory || "",
      type: type === "none" ? "" : (type || ""),
      sizes: sizes || [],
      style,
      price,
      salePrice,
      totalStock,
      averageReview,
      specialInstructions: specialInstructions || "",
      isNew: isNew || false,
      measurements: measurements || "",
      fabricDetails: fabricDetails || {
        kamizFabric: "",
        salwarFabric: "",
        ornaFabric: "",
        sameFabricForAll: false,
      },
      inStock: inStock !== undefined ? inStock : true,
      searchTags: searchTags || [],
      blousePieceAvailable: blousePieceAvailable || false,
      sareeLength: sareeLength || "",
      sareeFabricDetails: sareeFabricDetails || {
        sareeFabric: "",
        blouseFabric: "",
      },
      includedParts: includedParts || [],
      kurtiFabric: kurtiFabric || "",
      countryOfOrigin: countryOfOrigin || "",
      burkhaFabric: burkhaFabric || "",
      burkhaWorkType: burkhaWorkType || "",
      hijabPieceCount: hijabPieceCount || 0,
      hijabFabric: hijabFabric || "",
      hijabLength: hijabLength || "",
    });

    await newlyCreatedProduct.save();
    res.status(201).json({
      success: true,
      data: newlyCreatedProduct,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//fetch all products with filtering

const fetchAllProducts = async (req, res) => {
  try {
    const { 
      category = [], 
      subcategory = [], 
      style = [], 
      sizes = [], 
      sortBy = "createdAt-desc", 
      inStock,
      search = ""
    } = req.query;

    let filters = {};

    // Apply category filter
    if (category.length) {
      filters.category = { $in: category.split(",") };
    }

    // Apply subcategory filter
    if (subcategory.length) {
      filters.subcategory = { $in: subcategory.split(",") };
    }

    // Apply style filter
    if (style.length) {
      filters.style = { $in: style.split(",") };
    }

    // Apply sizes filter
    if (sizes.length) {
      filters.sizes = { $in: sizes.split(",") };
    }

    // Filter by stock status if provided
    if (inStock !== undefined) {
      filters.inStock = inStock === 'true';
    }

    // Search filter - search in title, description, and search tags
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { searchTags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sorting options
    let sort = {};
    switch (sortBy) {
      case "price-lowtohigh":
        sort.price = 1;
        break;
      case "price-hightolow":
        sort.price = -1;
        break;
      case "title-atoz":
        sort.title = 1;
        break;
      case "title-ztoa":
        sort.title = -1;
        break;
      case "createdAt-desc":
        sort.createdAt = -1;
        break;
      case "createdAt-asc":
        sort.createdAt = 1;
        break;
      default:
        sort.createdAt = -1;
        break;
    }

    const listOfProducts = await Product.find(filters).sort(sort);
    
    res.status(200).json({
      success: true,
      data: listOfProducts,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//edit a product
const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      image,
      images,
      title,
      description,
      category,
      subcategory,
      type,
      sizes,
      style,
      price,
      salePrice,
      totalStock,
      averageReview,
      specialInstructions,
      isNew,
      measurements,
      fabricDetails,
      inStock,
      searchTags,
      blousePieceAvailable,
      sareeLength,
      sareeFabricDetails,
      includedParts,
      kurtiFabric,
      countryOfOrigin,
      burkhaFabric,
      burkhaWorkType,
      hijabPieceCount,
      hijabFabric,
      hijabLength,
    } = req.body;

    let findProduct = await Product.findById(id);
    if (!findProduct)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    findProduct.title = title || findProduct.title;
    findProduct.description = description || findProduct.description;
    findProduct.category = category || findProduct.category;
    findProduct.subcategory = subcategory !== undefined ? subcategory : findProduct.subcategory;
    findProduct.type = type !== undefined ? (type === "none" ? "" : type) : findProduct.type;
    findProduct.sizes = sizes !== undefined ? sizes : findProduct.sizes;
    findProduct.style = style || findProduct.style;
    findProduct.price = price === "" ? 0 : price || findProduct.price;
    findProduct.salePrice =
      salePrice === "" ? 0 : salePrice || findProduct.salePrice;
    findProduct.totalStock = totalStock || findProduct.totalStock;
    findProduct.image = image || findProduct.image;
    findProduct.images = images !== undefined ? images : findProduct.images;
    findProduct.averageReview = averageReview || findProduct.averageReview;
    findProduct.specialInstructions = specialInstructions !== undefined ? specialInstructions : findProduct.specialInstructions;
    
    // Update new fields
    findProduct.isNew = isNew !== undefined ? isNew : findProduct.isNew;
    findProduct.measurements = measurements !== undefined ? measurements : findProduct.measurements;
    findProduct.fabricDetails = fabricDetails !== undefined ? fabricDetails : findProduct.fabricDetails;
    findProduct.inStock = inStock !== undefined ? inStock : findProduct.inStock;
    findProduct.searchTags = searchTags !== undefined ? searchTags : findProduct.searchTags;
    
    // Update saree-specific fields
    findProduct.blousePieceAvailable = blousePieceAvailable !== undefined ? blousePieceAvailable : findProduct.blousePieceAvailable;
    findProduct.sareeLength = sareeLength !== undefined ? sareeLength : findProduct.sareeLength;
    findProduct.sareeFabricDetails = sareeFabricDetails !== undefined ? sareeFabricDetails : findProduct.sareeFabricDetails;
    
    // Update two-piece and kurti specific fields
    findProduct.includedParts = includedParts !== undefined ? includedParts : findProduct.includedParts;
    findProduct.kurtiFabric = kurtiFabric !== undefined ? kurtiFabric : findProduct.kurtiFabric;
    
    // Update burkha specific fields
    findProduct.burkhaFabric = burkhaFabric !== undefined ? burkhaFabric : findProduct.burkhaFabric;
    findProduct.burkhaWorkType = burkhaWorkType !== undefined ? burkhaWorkType : findProduct.burkhaWorkType;
    
    // Update hijab specific fields
    findProduct.hijabPieceCount = hijabPieceCount !== undefined ? hijabPieceCount : findProduct.hijabPieceCount;
    findProduct.hijabFabric = hijabFabric !== undefined ? hijabFabric : findProduct.hijabFabric;
    findProduct.hijabLength = hijabLength !== undefined ? hijabLength : findProduct.hijabLength;
    
    // Update country of origin
    findProduct.countryOfOrigin = countryOfOrigin !== undefined ? countryOfOrigin : findProduct.countryOfOrigin;

    await findProduct.save();
    res.status(200).json({
      success: true,
      data: findProduct,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    res.status(200).json({
      success: true,
      message: "Product delete successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

module.exports = {
  handleImageUpload,
  addProduct,
  fetchAllProducts,
  editProduct,
  deleteProduct,
};
