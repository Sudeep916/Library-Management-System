export const getHomePathForRole = (role) => (role === "admin" ? "/admin/home" : "/user/home");

export const getLoginPathForRole = (role) => (role === "admin" ? "/admin/login" : "/user/login");

export const getRoleLabel = (role) => (role === "admin" ? "Admin" : "User");

