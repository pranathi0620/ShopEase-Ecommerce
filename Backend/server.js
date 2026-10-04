const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const stripe = require("stripe");

const User = require("./models/User");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// ========================================
// STRIPE - TEST MODE ONLY
// ========================================

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_test_")) {
  throw new Error(
    "ShopEase safety check failed: A Stripe TEST mode key is required."
  );
}

const stripeClient = stripe(stripeSecretKey);

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());

// ========================================
// DNS SETTINGS
// ========================================

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// ========================================
// MONGODB CONNECTION
// ========================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error.message);
  });

// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {
  res.send("ShopEase Backend Server is Running!");
});

// ========================================
// REGISTER USER
// ========================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Please provide name, email and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must contain at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Account created successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:");
    console.error(error.message);

    res.status(500).json({
      message:
        "Server error while creating account.",
    });
  }
});

// ========================================
// LOGIN USER
// ========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Please provide email and password.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET ||
        "shopease-development-secret",
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:");
    console.error(error.message);

    res.status(500).json({
      message: "Server error while logging in.",
    });
  }
});

// ========================================
// STRIPE CHECKOUT
// ========================================

app.post(
  "/api/payment/create-checkout-session",
  async (req, res) => {
    try {
      const { cartItems } = req.body;

      if (
        !cartItems ||
        !Array.isArray(cartItems) ||
        cartItems.length === 0
      ) {
        return res.status(400).json({
          message: "Your cart is empty.",
        });
      }

      const lineItems = cartItems.map((item) => {
        const price = Number(item.price);
        const quantity = Number(item.quantity);

        if (
          !Number.isFinite(price) ||
          price <= 0
        ) {
          throw new Error(
            "Invalid product price."
          );
        }

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          throw new Error(
            "Invalid product quantity."
          );
        }

        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(
              price * 100
            ),
          },
          quantity,
        };
      });

      const session =
        await stripeClient.checkout.sessions.create(
          {

            line_items: lineItems,

            mode: "payment",

            success_url:
              "http://localhost:5173/payment-success",

            cancel_url:
              "http://localhost:5173/payment-cancelled",

          }
        );

      res.json({
        url: session.url,
      });
    } catch (error) {
      console.error(
        "Stripe checkout error:"
      );
      console.error(error.message);

      res.status(500).json({
        message:
          "Unable to create Stripe checkout session.",
      });
    }
  }
);

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(
    `ShopEase Backend Server running on http://localhost:${PORT}`
  );
});