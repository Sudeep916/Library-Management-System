export const getHomePathForRole = (role) => {
  switch (role) {
    case "admin":
      return "/admin/home";
    case "user":
      return "/user/home";
    default:
      return "/";
  }
};

export const getLoginPathForRole = (role) => {
  switch (role) {
    case "admin":
      return "/admin/login";
    case "user":
      return "/user/login";
    default:
      return "/";
  }
};

export const getRoleLabel = (role) => {
  switch (role) {
    case "admin":
      return "Admin";
    case "user":
      return "User";
    default:
      return "User";
  }
};