//src/App.jsx
/* implementation start here */ 

import { useContext, useState } from "react";
import { UserContext } from "./context/user-context";
import {
  HashRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import CourseForm from "./pages/CourseForm";

import "./App.css";

// Wait for authentication and protect application pages.
function ProtectedRoute() {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return (
      <div className="loading" role="status">
        Checking your login...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!["Teacher", "Student"].includes(user.role)) {
    return (
      <div className="container">
        <div className="alert alert-error" role="alert">
          Your account does not have a supported role.
        </div>
      </div>
    );
  }

  return <Outlet />;
}

// Restrict course creation and editing pages to Teachers.
function TeacherRoute() {
  const { user } = useContext(UserContext);

  if (user?.role !== "Teacher") {
    return <Navigate to="/courses" replace />;
  }

  return <Outlet />;
}

// Redirect logged-in users away from the login page.
function LoginRoute() {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return (
      <div className="loading" role="status">
        Checking your login...
      </div>
    );
  }

  return user ? <Navigate to="/courses" replace /> : <Login />;
}

// Navigation shared by all protected pages.
function AppLayout() {
  const { user, logout } = useContext(UserContext);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    setLoggingOut(true);

    try {
      await logout();
    } catch (err) {
      setError(err.message || "Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-content">
          <NavLink className="brand" to="/courses">
            SkyBlue Courses
          </NavLink>

          <nav className="nav-links" aria-label="Main navigation">
            <NavLink
              to="/courses"
              end
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {user.role === "Teacher" ? "My Courses" : "Courses"}
            </NavLink>

            {user.role === "Teacher" && (
              <NavLink
                to="/courses/new"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Create Course
              </NavLink>
            )}

            <span className="user-info">
              {user.username} · {user.role}
            </span>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/courses" element={<Courses />} />

            <Route
              path="/courses/:courseId"
              element={<CourseDetails />}
            />

            <Route element={<TeacherRoute />}>
              <Route
                path="/courses/new"
                element={<CourseForm key="create" />}
              />

              <Route
                path="/courses/:courseId/edit"
                element={<CourseForm key="edit" />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/courses" replace />} />
        <Route path="*" element={<Navigate to="/courses" replace />} />
      </Routes>
    </HashRouter>
  );
}
