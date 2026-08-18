import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "~/hooks/use-auth";
import styles from "./user-dropdown.module.css";

interface UserDropdownProps {
  /**
   * Additional CSS class name
   */
  className?: string;
}

export function UserDropdown({ className }: UserDropdownProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ""}`} ref={dropdownRef}>
      <button
        className={`${styles.trigger} ${isOpen ? styles.open : ""}`}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User className={styles.userIcon} size={16} />
        <span className={styles.username}>{user.username}</span>
        <ChevronDown className={styles.chevron} size={14} />
      </button>

      {isOpen && <div className={styles.overlay} onClick={handleClose} />}

      <div className={`${styles.dropdown} ${isOpen ? styles.open : ""}`}>
        <div className={styles.dropdownHeader}>
          <div className={styles.dropdownUserInfo}>
            <User className={styles.dropdownUserIcon} size={20} />
            <div className={styles.dropdownUserDetails}>
              <div className={styles.dropdownUsername}>{user.username}</div>
              <div className={styles.dropdownUserEmail}>{user.email}</div>
            </div>
          </div>
        </div>

        <div className={styles.dropdownMenu}>
          <Link to="/settings" className={styles.menuItem} onClick={handleClose}>
            <Settings className={styles.menuIcon} size={16} />
            <span className={styles.menuText}>Settings</span>
          </Link>

          <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout}>
            <LogOut className={styles.menuIcon} size={16} />
            <span className={styles.menuText}>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
