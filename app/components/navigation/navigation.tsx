import React, { useState } from "react";
import { Link, useLocation } from "react-router";
import { Code2, User, Settings, LogOut, BookOpen, Home, Info, Menu, X } from "lucide-react";
import { ColorSchemeToggle } from "~/components/ui/color-scheme-toggle/color-scheme-toggle";
import { UserDropdown } from "~/components/user-dropdown/user-dropdown";
import { useAuth } from "~/hooks/use-auth";
import styles from "./navigation.module.css";

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link to="/" className={styles.brandLink} onClick={closeMobileMenu}>
            <Code2 className={styles.brandIcon} />
            <span className={styles.brandText}>
              SimBa
              <span className="beta-badge">Beta</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className={styles.links}>
          <Link to="/" className={`${styles.link} ${isActive("/") ? styles.linkActive : ""}`}>
            <Home size={16} />
            Home
          </Link>
          <Link to="/about" className={`${styles.link} ${isActive("/about") ? styles.linkActive : ""}`}>
            <Info size={16} />
            About
          </Link>
          <Link to="/guide" className={`${styles.link} ${isActive("/guide") ? styles.linkActive : ""}`}>
            <BookOpen size={16} />
            Guide
          </Link>
          {isAuthenticated && (
            <Link to="/playground" className={`${styles.link} ${isActive("/playground") ? styles.linkActive : ""}`}>
              <Code2 size={16} />
              Playground
            </Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className={styles.actions}>
          <ColorSchemeToggle />
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.loginButton}>
                Login
              </Link>
              <Link to="/signup" className={styles.signupButton}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button className={styles.mobileMenuButton} onClick={toggleMobileMenu} aria-label="Toggle mobile menu">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.open : ""}`}>
        <Link to="/" className={styles.mobileNavLink} onClick={closeMobileMenu}>
          <Home size={16} />
          Home
        </Link>
        <Link to="/about" className={styles.mobileNavLink} onClick={closeMobileMenu}>
          <Info size={16} />
          About
        </Link>
        <Link to="/guide" className={styles.mobileNavLink} onClick={closeMobileMenu}>
          <BookOpen size={16} />
          Guide
        </Link>
        {isAuthenticated && (
          <Link to="/playground" className={styles.mobileNavLink} onClick={closeMobileMenu}>
            <Code2 size={16} />
            Playground
          </Link>
        )}

        <div className={styles.mobileAuthSection}>
          {isAuthenticated ? (
            <>
              <div className={styles.mobileUserInfo}>
                <User size={16} />
                {user?.email}
              </div>
              <button
                className={styles.mobileLogoutButton}
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                Login
              </Link>
              <Link to="/signup" className={styles.mobilePrimaryButton} onClick={closeMobileMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
