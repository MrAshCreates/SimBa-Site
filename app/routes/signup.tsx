import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { UserPlus, Loader2 } from "lucide-react";
import type { Route } from "./+types/signup";
import { Navigation } from "~/components/navigation/navigation";
import { useAuth } from "~/hooks/use-auth";
import type { User } from "~/data/auth";
import styles from "./signup.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - SimBa Playground" },
    {
      name: "description",
      content: "Create your SimBa account to access the interactive playground and save your projects.",
    },
  ];
}

interface FormErrors {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (phone.trim() && !/^[\+]?[\d\s\-\(\)]+$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
        }),
      });

      const data = (await response.json()) as { user?: User; error?: string };
      if (!response.ok || !data.user) {
        setGeneralError(data.error || "Username or email already exists. Please try different values.");
        return;
      }

      login(data.user);
      navigate("/playground");
    } catch {
      setGeneralError("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Navigation />

      <main className={styles.main}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Create Account</h1>
            <p className={styles.subtitle}>Join SimBa and start building hybrid applications</p>
          </div>

          {generalError && <div className={styles.error}>{generalError}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
                placeholder="Choose a username"
                required
                autoComplete="username"
                disabled={isLoading}
              />
              {errors.username && <div className={styles.fieldError}>{errors.username}</div>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                placeholder="Enter your email"
                required
                autoComplete="email"
                disabled={isLoading}
              />
              {errors.email && <div className={styles.fieldError}>{errors.email}</div>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="phone" className={styles.label}>
                Phone Number <span className={styles.optional}>(Optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                placeholder="Enter your phone number"
                autoComplete="tel"
                disabled={isLoading}
              />
              {errors.phone ? (
                <div className={styles.fieldError}>{errors.phone}</div>
              ) : (
                <div className={styles.fieldHint}>
                  For account recovery and important updates. We respect your privacy.
                </div>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                placeholder="Create a password"
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              {errors.password ? (
                <div className={styles.fieldError}>{errors.password}</div>
              ) : (
                <div className={styles.passwordRequirements}>Password must be at least 6 characters long</div>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              {errors.confirmPassword && <div className={styles.fieldError}>{errors.confirmPassword}</div>}
            </div>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={`${styles.buttonIcon} animate-spin`} />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className={styles.buttonIcon} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Already have an account?{" "}
              <Link to="/login" className={styles.footerLink}>
                Login here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
