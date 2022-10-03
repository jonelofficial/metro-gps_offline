import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";

import AppNavigator from "../../app/navigation/AppNavigator";
import AuthNavigator from "../../app/navigation/AuthNavigator";
import navigationTheme from "../../app/navigation/navigationTheme";
import OfflineNotice from "../../app/components/OfflineNotice";
import AuthContext from "../auth/context";

export default function AppScreen() {
  const { user } = useContext(AuthContext);

  return (
    <>
      <OfflineNotice />
      <NavigationContainer theme={navigationTheme}>
        {user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </>
  );
}
