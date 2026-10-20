//src/context/UseContext.jsx

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { UserContext } from "./user-context";


export function UserProvider({ children }) {

  /**
   * Your User Context Provider for Frontend goes here
   */
  /* implementation start here */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function restoreLogin() {
      try {
        const data = await api("/api/user", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setUser(data.user);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setUser(null);

          if (error.status !== 401) {
            setAuthError(error.message);
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    restoreLogin();

    return () => controller.abort();
  }, []);

  async function login(email, password) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setUser(data.user);
    setAuthError("");

    return data.user;
  }

  async function logout() {
    await api("/api/auth/logout", {
      method: "POST",
    });

    setUser(null);
    setAuthError("");
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
