import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import ScanScreen from "../screens/ScanScreen";

const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: "none",
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen
      name="Scan"
      component={ScanScreen}
      options={{ animation: "slide_from_bottom" }}
    />
  </Stack.Navigator>
);

export default AuthNavigator;
