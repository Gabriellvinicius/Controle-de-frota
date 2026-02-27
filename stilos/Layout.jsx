import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import styles from "../styles/Layout.module.css";

import logo from "../assets/logo.png";

export default function Layout() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Vistorias", href: "/vistorias", icon: ClipboardList },
  ];

  if (profile?.role === "gestor") {
    navigation.push({ name: "Usuários", href: "/users", icon: Users });
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          mobileMenuOpen ? styles.mobileOpen : ""
        }`}
      >
        <div className={styles.logoContainer}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        <nav className={styles.nav}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.userProfile}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{profile?.full_name || "Usuário"}</p>
            <p className={styles.userRole}>{profile?.role}</p>
            <Link to="/update-password" className={styles.passwordLink}>
              Alterar Senha
            </Link>
          </div>
          <button onClick={signOut} className={styles.logoutBtn} title="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Mobile Header */}
        <header className={styles.mobileHeader}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={styles.menuBtn}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
          <span className={styles.mobileTitle}>Gestor Visitas</span>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
