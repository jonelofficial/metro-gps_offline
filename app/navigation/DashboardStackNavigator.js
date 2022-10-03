import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "../screens/DashboardScreen";
import ScanScreen from "../screens/ScanScreen";

const Stack = createNativeStackNavigator();

const DashboardStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="DashboardStack" component={DashboardScreen} />
    <Stack.Screen
      name="DashboardStackScan"
      component={ScanScreen}
      options={{
        animation: "slide_from_bottom",
      }}
    />
  </Stack.Navigator>
);

export default DashboardStackNavigator;
