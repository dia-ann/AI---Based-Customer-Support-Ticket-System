import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import UserCard from "./UserCard";

export default function UserMenu({ position = "top-right" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initial = (user?.name || user?.email || "U")[0].toUpperCase();

  return (
    <div className="relative inline-block" ref={menuContainerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-surface-hover transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/20 text-xs font-bold text-brand-100 border border-brand-500/30">
          {initial}
        </div>
        <span className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          {user?.name || user?.email?.split("@")[0]}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <UserCard
          position={position}
          onClose={() => setIsOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
