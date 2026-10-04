import { useState } from "react";

function AuthModal({
  isOpen,
  onClose,
  onLogin,
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate the form
    if (isRegister && name.trim() === "") {
      alert("Please enter your name.");
      return;
    }

    if (email.trim() === "") {
      alert("Please enter your email.");
      return;
    }

    if (password.trim() === "") {
      alert("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      alert(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Backend URL
      const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000";

      // Select registration or login endpoint
      const endpoint = isRegister
        ? `${API_URL}/api/auth/register`
        : `${API_URL}/api/auth/login`;

      // Prepare request data
      const requestBody = isRegister
        ? {
            name: name.trim(),
            email: email.trim(),
            password,
          }
        : {
            email: email.trim(),
            password,
          };

      // Send request to backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Read server response safely
      const data = await response.json();

      // Handle server errors
      if (!response.ok) {
        alert(
          data.message || "Something went wrong."
        );
        return;
      }

      // Save authentication token if provided
      if (data.token) {
        localStorage.setItem(
          "shopeaseToken",
          data.token
        );
      }

      // Save user information
      localStorage.setItem(
        "shopeaseUser",
        JSON.stringify(data.user)
      );

      alert(
        data.message ||
          (isRegister
            ? "Account created successfully!"
            : "Login successful!")
      );

      // Update the application login state
      onLogin(data.user.name);

      // Reset form fields
      setName("");
      setEmail("");
      setPassword("");
      setIsRegister(false);
      setShowPassword(false);

      onClose();
    } catch (error) {
      console.error("Authentication error:", error);

      alert(
        "Unable to connect to the server. Please try again. The server may be starting up or temporarily unavailable."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);

    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Close authentication window"
          type="button"
        >
          ×
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            ShopEase
          </div>

          <h2>
            {isRegister
              ? "Create an Account"
              : "Welcome Back"}
          </h2>

          <p>
            {isRegister
              ? "Create your ShopEase account"
              : "Login to continue shopping"}
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {isRegister && (
            <div className="auth-field">
              <label htmlFor="name">
                Full Name
              </label>

              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Password
            </label>

            <div className="password-wrapper">
              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete={
                  isRegister
                    ? "new-password"
                    : "current-password"
                }
                minLength={6}
                required
              />

              <button
                type="button"
                className="show-password-btn"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading
              ? "Please wait..."
              : isRegister
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}
          </p>

          <button
            type="button"
            onClick={switchMode}
            disabled={isLoading}
          >
            {isRegister
              ? "Login"
              : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;