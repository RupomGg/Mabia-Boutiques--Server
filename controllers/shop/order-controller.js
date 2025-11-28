const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const Address = require("../../models/Address");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const { getPaypalClient } = require("../../helpers/paypal");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentId,
      payerId,
      cartId,
      guestInfo,
      isGuest,
    } = req.body;

    console.log("Creating order with payment method:", paymentMethod);
    console.log("Is guest order:", isGuest);

    let finalUserId = userId;
    let finalAddressInfo = addressInfo;
    let isGuestOrder = false;

    // Handle guest checkout
    if (isGuest && guestInfo) {
      console.log("Processing guest order...");
      isGuestOrder = true;
      
      // Check if user with this phone number already exists
      let existingUser = await User.findOne({ phoneNumber: guestInfo.phone });
      
      if (existingUser) {
        console.log("Found existing user with phone:", guestInfo.phone);
        finalUserId = existingUser._id.toString();
      } else {
        // Create new user account with phone number
        console.log("Creating new user account for guest...");
        const hashPassword = await bcrypt.hash(guestInfo.phone, 12);
        
        const newUser = new User({
          userName: guestInfo.name,
          phoneNumber: guestInfo.phone,
          email: guestInfo.email || null,
          password: hashPassword,
          isGuestAccount: true,
        });
        
        await newUser.save();
        finalUserId = newUser._id.toString();
        console.log("New user created with ID:", finalUserId);
      }

      // Create address for the user
      const newAddress = new Address({
        userId: finalUserId,
        address: guestInfo.streetAddress,
        town: guestInfo.town,
        district: guestInfo.district,
        city: guestInfo.city || guestInfo.district,
        pincode: guestInfo.pincode || "",
        phone: guestInfo.phone,
        notes: guestInfo.notes || "",
      });

      await newAddress.save();
      console.log("Address created for user");

      // Update address info for order
      finalAddressInfo = {
        addressId: newAddress._id.toString(),
        address: guestInfo.streetAddress,
        town: guestInfo.town,
        district: guestInfo.district,
        city: guestInfo.city || guestInfo.district,
        pincode: guestInfo.pincode || "",
        phone: guestInfo.phone,
        notes: guestInfo.notes || "",
      };
    }

    // Handle Cash on Delivery orders
    if (paymentMethod === "cod") {
      console.log("Processing COD order...");
      const newlyCreatedOrder = new Order({
        userId: finalUserId,
        cartId,
        cartItems,
        addressInfo: finalAddressInfo,
        guestInfo: isGuestOrder ? {
          name: guestInfo.name,
          phone: guestInfo.phone,
          email: guestInfo.email || "",
        } : undefined,
        isGuestOrder,
        orderStatus: "pending",
        paymentMethod: "cod",
        paymentStatus: "pending",
        totalAmount,
        orderDate,
        orderUpdateDate,
        paymentId: "N/A",
        payerId: "N/A",
      });

      await newlyCreatedOrder.save();

      // Update product stock for COD orders
      for (let item of cartItems) {
        let product = await Product.findById(item.productId);
        if (product) {
          product.totalStock -= item.quantity;
          await product.save();
        }
      }

      // Clear cart after order (only if cart exists)
      if (cartId) {
        await Cart.findByIdAndDelete(cartId);
      }

      console.log("COD order created successfully:", newlyCreatedOrder._id);

      return res.status(201).json({
        success: true,
        message: isGuestOrder 
          ? "Order placed successfully! An account has been created with your phone number. Use your phone number as both username and password to login."
          : "Order placed successfully! Pay when you receive your order.",
        orderId: newlyCreatedOrder._id,
        orderData: newlyCreatedOrder,
      });
    }

    console.log("Processing PayPal payment...");

    // Handle PayPal payment - load PayPal client only when needed
    try {
      const paypal = getPaypalClient();
      
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:5173/shop/paypal-return",
          cancel_url: "http://localhost:5173/shop/paypal-cancel",
        },
        transactions: [
          {
            item_list: {
              items: cartItems.map((item) => ({
                name: item.title,
                sku: item.productId,
                price: item.price.toFixed(2),
                currency: "USD",
                quantity: item.quantity,
              })),
            },
            amount: {
              currency: "USD",
              total: totalAmount.toFixed(2),
            },
            description: "description",
          },
        ],
      };

      paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
        if (error) {
          console.log(error);

          return res.status(500).json({
            success: false,
            message: "Error while creating paypal payment",
          });
        } else {
          const newlyCreatedOrder = new Order({
            userId: finalUserId,
            cartId,
            cartItems,
            addressInfo: finalAddressInfo,
            guestInfo: isGuestOrder ? {
              name: guestInfo.name,
              phone: guestInfo.phone,
              email: guestInfo.email || "",
            } : undefined,
            isGuestOrder,
            orderStatus,
            paymentMethod,
            paymentStatus,
            totalAmount,
            orderDate,
            orderUpdateDate,
            paymentId,
            payerId,
          });

          await newlyCreatedOrder.save();

          const approvalURL = paymentInfo.links.find(
            (link) => link.rel === "approval_url"
          ).href;

          res.status(201).json({
            success: true,
            approvalURL,
            orderId: newlyCreatedOrder._id,
          });
        }
      });
    } catch (paypalError) {
      // PayPal not configured
      console.log(paypalError.message);
      return res.status(400).json({
        success: false,
        message: "PayPal is not configured. Please use Cash on Delivery or contact support.",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Not enough stock for this product ${product.title}`,
        });
      }

      product.totalStock -= item.quantity;

      await product.save();
    }

    const getCartId = order.cartId;
    await Cart.findByIdAndDelete(getCartId);

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
};
