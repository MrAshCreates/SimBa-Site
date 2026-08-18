import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { LogIn, Loader2 } from "lucide-react";
import type { Route } from "./+types/login";
import { Navigation } from "~/components/navigation/navigation";
import { useAuth } from "~/hooks/use-auth";
import type { User } from "~/data/auth";
import styles from "./login.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - SimBa Playground" },
    {
      name: "description",
      content: "Login to your SimBa account to access the interactive playground.",
    },
  ];
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { user?: User; error?: string };
      if (!response.ok || !data.user) {
        setError(data.error || "Invalid email or password. Please try again.");
        return;
      }

      login(data.user);
      navigate("/playground");
    } catch {
      setError("An error occurred during login. Please try again.");
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
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Login to access your SimBa playground</p>
          </div>

          <div className={styles.demoInfo}>
            <div>Try the demo account:</div>
            <div className={styles.demoCredentials}>
              Email: demo@simba.dev
              <br />
              Password: demo123
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Enter your email"
                required
                autoComplete="email"
                disabled={isLoading}
              />
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
                className={styles.input}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={`${styles.buttonIcon} animate-spin`} />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className={styles.buttonIcon} />
                  Login
                </>
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Don't have an account?{" "}
              <Link to="/signup" className={styles.footerLink}>
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
