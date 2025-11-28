const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: String,
  cartId: String,
  cartItems: [
    {
      productId: String,
      title: String,
      image: String,
      price: String,
      quantity: Number,
      size: String,
      color: String,
    },
  ],
  addressInfo: {
    addressId: String,
    address: String,
    city: String,
    town: String,
    district: String,
    pincode: String,
    phone: String,
    notes: String,
  },
  guestInfo: {
    name: String,
    phone: String,
    email: String,
  },
  isGuestOrder: {
    type: Boolean,
    default: false,
  },
  orderStatus: String,
  paymentMethod: String,
  paymentStatus: String,
  totalAmount: Number,
  orderDate: Date,
  orderUpdateDate: Date,
  paymentId: String,
  payerId: String,
  trackingNumber: String,
  estimatedDeliveryDate: Date,
});

module.exports = mongoose.model("Order", OrderSchema);
