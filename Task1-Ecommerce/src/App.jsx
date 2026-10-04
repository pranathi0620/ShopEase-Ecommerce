import { useState } from "react";
import "./App.css";
import products from "./data/products";
import AuthModal from "./components/AuthModal";

function App() {
  // ==============================
  // CART
  // ==============================

  const [cart, setCart] = useState([]);

  // ==============================
  // AUTHENTICATION
  // ==============================

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userName, setUserName] = useState(() => {
  const savedUser = localStorage.getItem("shopeaseUser");

  if (!savedUser) {
    return "";
  }

  try {
    const user = JSON.parse(savedUser);
    return user.name || "";
  } catch (error) {
    console.error("Unable to read saved user:", error);
    return "";
  }
});

  // ==============================
  // SEARCH & FILTERS
  // ==============================

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [maxPrice, setMaxPrice] = useState(20000);

  // ==============================
  // CHECKOUT LOADING
  // ==============================

  const [isCheckoutLoading, setIsCheckoutLoading] =
    useState(false);

  // ==============================
  // ADD TO CART
  // ==============================

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  // ==============================
  // INCREASE QUANTITY
  // ==============================

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // ==============================
  // DECREASE QUANTITY
  // ==============================

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ==============================
  // REMOVE FROM CART
  // ==============================

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    );
  };

  // ==============================
  // CART COUNT
  // ==============================

  const cartItemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // ==============================
  // CART TOTAL
  // ==============================

  const cartTotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  // ==============================
  // PRODUCT FILTERING
  // ==============================

  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      const matchesPrice =
        product.price <= maxPrice;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice
      );
    }
  );

  // ==============================
  // CLEAR FILTERS
  // ==============================

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setMaxPrice(20000);
  };

  // ==============================
  // LOGIN
  // ==============================

  const handleLogin = (name) => {
    setUserName(name);
    setIsAuthOpen(false);
  };

  // ==============================
  // LOGOUT
  // ==============================

  const handleLogout = () => {
    setUserName("");
    localStorage.removeItem("shopeaseToken");
    localStorage.removeItem("shopeaseUser");
  };

  // ==============================
  // STRIPE CHECKOUT
  // ==============================

  const handleCheckout = async () => {
    if (!userName) {
      setIsAuthOpen(true);
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setIsCheckoutLoading(true);

    try {
  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const response = await fetch(
    `${API_URL}/api/payment/create-checkout-session`,
    {
      method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            cartItems: cart,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Unable to start checkout."
        );
        return;
      }

      if (!data.url) {
        alert(
          "Stripe checkout URL was not received."
        );
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      alert(
        "Unable to connect to the payment server. Please make sure the backend is running."
      );
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // ==============================
  // SCROLL FUNCTION
  // ==============================

  const scrollToSection = (sectionId) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  // ==============================
  // STRIPE RETURN PAGES (DEMO)
  // ==============================

  const paymentPath = window.location.pathname;

  if (paymentPath === "/payment-success") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f5f7fb",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "520px",
            padding: "40px 28px",
            borderRadius: "18px",
            background: "#ffffff",
            boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "58px", marginBottom: "12px" }}>✅</div>
          <h1 style={{ color: "#172554", marginBottom: "12px" }}>
            Payment Successful!
          </h1>
          <p style={{ color: "#475569", lineHeight: 1.7 }}>
            Thank you for shopping with ShopEase. Your Stripe test payment
            was completed successfully.
          </p>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            This is a demonstration order for the CodeSoft project.
          </p>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              marginTop: "18px",
              border: "none",
              borderRadius: "9px",
              padding: "13px 22px",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Continue Shopping
          </button>
        </section>
      </main>
    );
  }

  if (paymentPath === "/payment-cancelled") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f5f7fb",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "520px",
            padding: "40px 28px",
            borderRadius: "18px",
            background: "#ffffff",
            boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "58px", marginBottom: "12px" }}>🛒</div>
          <h1 style={{ color: "#172554", marginBottom: "12px" }}>
            Checkout Cancelled
          </h1>
          <p style={{ color: "#475569", lineHeight: 1.7 }}>
            Your test payment was not completed. You can return to ShopEase
            and try checkout again whenever you're ready.
          </p>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              marginTop: "18px",
              border: "none",
              borderRadius: "9px",
              padding: "13px 22px",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Return to ShopEase
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="app">

      {/* ==============================
          HEADER
      ============================== */}

      <header className="header">

        <div className="logo">
          ShopEase
        </div>

        <nav className="navbar">
          <a href="#home">Home</a>
          <a href="#products">Products</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="header-actions">

          {/* LOGIN / LOGOUT */}

          {userName ? (
            <button
              className="login-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <button
              className="login-btn"
              onClick={() =>
                setIsAuthOpen(true)
              }
            >
              Login
            </button>
          )}

          {/* CART */}

          <button
            className="cart-btn"
            onClick={() =>
              scrollToSection("cart")
            }
          >
            🛒 Cart

            <span className="cart-count">
              {cartItemCount}
            </span>
          </button>

        </div>

      </header>


      {/* ==============================
          WELCOME BAR
      ============================== */}

      {userName && (
        <div className="welcome-bar">
          Welcome,
          <strong> {userName}</strong>!
          Happy shopping 🛍️
        </div>
      )}


      {/* ==============================
          HERO
      ============================== */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-content">

          <p className="hero-small-text">
            WELCOME TO SHOPEASE
          </p>

          <h1>
            Shop Smart.
            <br />
            Live Better.
          </h1>

          <p className="hero-description">
            Discover amazing products at great
            prices. Shop your favorite items from
            the comfort of your home.
          </p>

          <button
            className="shop-now-btn"
            onClick={() =>
              scrollToSection("products")
            }
          >
            Shop Now
          </button>

        </div>

        <div className="hero-image">
          <div className="shopping-bag">
            🛍️
          </div>
        </div>

      </section>


      {/* ==============================
          CATEGORIES
      ============================== */}

      <section className="categories">

        <div className="section-heading">

          <p>EXPLORE</p>

          <h2>
            Shop By Category
          </h2>

        </div>

        <div className="category-container">

          <div
            className="category-card"
            onClick={() =>
              setSelectedCategory("Fashion")
            }
          >

            <div className="category-icon">
              👕
            </div>

            <h3>Fashion</h3>

            <p>
              Trendy clothes and accessories
            </p>

          </div>


          <div
            className="category-card"
            onClick={() =>
              setSelectedCategory(
                "Electronics"
              )
            }
          >

            <div className="category-icon">
              📱
            </div>

            <h3>Electronics</h3>

            <p>
              Latest gadgets and devices
            </p>

          </div>


          <div
            className="category-card"
            onClick={() =>
              setSelectedCategory("Home")
            }
          >

            <div className="category-icon">
              🏠
            </div>

            <h3>Home</h3>

            <p>
              Products for your beautiful home
            </p>

          </div>


          <div
            className="category-card"
            onClick={() =>
              setSelectedCategory("Beauty")
            }
          >

            <div className="category-icon">
              💄
            </div>

            <h3>Beauty</h3>

            <p>
              Beauty and personal care products
            </p>

          </div>

        </div>

      </section>


      {/* ==============================
          PRODUCTS
      ============================== */}

      <section
        className="products"
        id="products"
      >

        <div className="section-heading">

          <p>OUR STORE</p>

          <h2>
            Featured Products
          </h2>

        </div>


        {/* FILTERS */}

        <div className="filter-container">

          <div className="search-box">

            <label>
              Search Products
            </label>

            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>


          <div className="filter-box">

            <label>
              Category
            </label>

            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(
                  event.target.value
                )
              }
            >

              <option value="All">
                All Categories
              </option>

              <option value="Fashion">
                Fashion
              </option>

              <option value="Electronics">
                Electronics
              </option>

              <option value="Home">
                Home
              </option>

              <option value="Beauty">
                Beauty
              </option>

            </select>

          </div>


          <div className="filter-box">

            <label>
              Maximum Price
            </label>

            <select
              value={maxPrice}
              onChange={(event) =>
                setMaxPrice(
                  Number(event.target.value)
                )
              }
            >

              <option value="20000">
                All Prices
              </option>

              <option value="1000">
                Under ₹1,000
              </option>

              <option value="2000">
                Under ₹2,000
              </option>

              <option value="5000">
                Under ₹5,000
              </option>

              <option value="10000">
                Under ₹10,000
              </option>

            </select>

          </div>


          <button
            className="clear-filter-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>


        {/* PRODUCT COUNT */}

        <div className="product-result-info">

          <p>
            Showing{" "}
            <strong>
              {filteredProducts.length}
            </strong>{" "}
            product
            {filteredProducts.length !== 1
              ? "s"
              : ""}
          </p>

        </div>


        {/* PRODUCT LIST */}

        {filteredProducts.length === 0 ? (

          <div className="no-products">

            <div className="no-products-icon">
              🔍
            </div>

            <h3>
              No products found
            </h3>

            <p>
              Try changing your search or
              filters.
            </p>

            <button
              className="shop-now-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>

        ) : (

          <div className="product-container">

            {filteredProducts.map(
              (product) => (

                <div
                  className="product-card"
                  key={product.id}
                >

                  <div className="product-image">
                    {product.emoji}
                  </div>

                  <div className="product-info">

                    <small className="product-category">
                      {product.category}
                    </small>

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      {product.description}
                    </p>

                    <div className="product-bottom">

                      <span className="price">
                        ₹
                        {product.price.toLocaleString(
                          "en-IN"
                        )}
                      </span>

                      <button
                        className="add-btn"
                        onClick={() =>
                          addToCart(product)
                        }
                      >
                        Add to Cart
                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* ==============================
          CART
      ============================== */}

      <section
        className="cart-section"
        id="cart"
      >

        <div className="section-heading">

          <p>
            SHOPPING CART
          </p>

          <h2>
            Your Cart
          </h2>

        </div>


        {cart.length === 0 ? (

          <div className="empty-cart">

            <div className="empty-cart-icon">
              🛒
            </div>

            <h3>
              Your cart is empty
            </h3>

            <p>
              Add some products to your cart
              to see them here.
            </p>

            <button
              className="shop-now-btn"
              onClick={() =>
                scrollToSection("products")
              }
            >
              Browse Products
            </button>

          </div>

        ) : (

          <div className="cart-container">

            <div className="cart-items">

              {cart.map((item) => (

                <div
                  className="cart-item"
                  key={item.id}
                >

                  <div className="cart-item-image">
                    {item.emoji}
                  </div>

                  <div className="cart-item-details">

                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      ₹
                      {item.price.toLocaleString(
                        "en-IN"
                      )}
                    </p>

                  </div>


                  <div className="quantity-controls">

                    <button
                      onClick={() =>
                        decreaseQuantity(
                          item.id
                        )
                      }
                    >
                      −
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        increaseQuantity(
                          item.id
                        )
                      }
                    >
                      +
                    </button>

                  </div>


                  <div className="cart-item-total">

                    ₹
                    {(
                      item.price *
                      item.quantity
                    ).toLocaleString(
                      "en-IN"
                    )}

                  </div>


                  <button
                    className="remove-btn"
                    onClick={() =>
                      removeFromCart(item.id)
                    }
                  >
                    Remove
                  </button>

                </div>

              ))}

            </div>


            {/* CART SUMMARY */}

            <div className="cart-summary">

              <h3>
                Cart Summary
              </h3>

              <div className="summary-row">

                <span>
                  Items
                </span>

                <span>
                  {cartItemCount}
                </span>

              </div>

              <div className="summary-row">

                <span>
                  Subtotal
                </span>

                <span>
                  ₹
                  {cartTotal.toLocaleString(
                    "en-IN"
                  )}
                </span>

              </div>

              <div className="summary-row">

                <span>
                  Delivery
                </span>

                <span>
                  FREE
                </span>

              </div>

              <div className="summary-total">

                <span>
                  Total
                </span>

                <strong>
                  ₹
                  {cartTotal.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading
                  ? "Opening Checkout..."
                  : "Proceed to Checkout"}
              </button>

            </div>

          </div>

        )}

      </section>


      {/* ==============================
          ABOUT
      ============================== */}

      <section
        className="about"
        id="about"
      >

        <div className="about-content">

          <p>
            ABOUT SHOPEASE
          </p>

          <h2>
            Your Online Shopping
            <br />
            Destination
          </h2>

          <p>
            ShopEase is a modern e-commerce
            platform designed to make online
            shopping simple, convenient, and
            enjoyable. Browse products, add
            them to your cart, and securely
            complete your purchase.
          </p>

          <button
            className="learn-btn"
            onClick={() =>
              scrollToSection("products")
            }
          >
            Learn More
          </button>

        </div>

      </section>


      {/* ==============================
          FOOTER
      ============================== */}

      <footer
        className="footer"
        id="contact"
      >

        <div className="footer-column">

          <h2>
            ShopEase
          </h2>

          <p>
            Your trusted destination for
            online shopping.
          </p>

        </div>


        <div className="footer-column">

          <h3>
            Quick Links
          </h3>

          <a href="#home">
            Home
          </a>

          <a href="#products">
            Products
          </a>

          <a href="#about">
            About
          </a>

        </div>


        <div className="footer-column">

          <h3>
            Contact
          </h3>

          <p>
            Email: support@shopease.com
          </p>

          <p>
            Phone: +91 98765 43210
          </p>

        </div>

      </footer>


      {/* ==============================
          COPYRIGHT
      ============================== */}

      <div className="copyright">

        <p>
          © 2026 ShopEase. All rights reserved.
        </p>

      </div>


      {/* ==============================
          AUTHENTICATION MODAL
      ============================== */}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() =>
          setIsAuthOpen(false)
        }
        onLogin={handleLogin}
      />

    </div>
  );
}

export default App;