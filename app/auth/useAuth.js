import { useContext, useState } from "react";
import AuthContext from "./context";
import jwtDecode from "jwt-decode";

export default useAuth = () => {
  const { setUser, setToken } = useContext(AuthContext);

  const logIn = (authToken) => {
    const user = jwtDecode(authToken.token);

    setToken(authToken.token);
    setUser(user);
  };

  const logOut = (authToken) => {
    setUser(null);
    setToken(null);
  };

  return { logIn, logOut };
};
