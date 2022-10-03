import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AppCamera from "../components/AppCamera";
import DashboardStackNavigator from "./DashboardStackNavigator";
import DeliveryScreen from "../screens/DeliveryScreen";
import FeedsDeliveryScreen from "../screens/FeedsDeliveryScreen";
import HaulingScreen from "../screens/HaulingScreen";
import MapScreen from "../screens/MapScreen";
import MapDetailsScreen from "../screens/MapDetailsScreen";
import TranspoDetailsScreen from "../screens/TranspoDetailsScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: "fade",
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardStackNavigator} />
    <Stack.Screen
      name="MapView"
      component={MapDetailsScreen}
      options={{
        animation: "slide_from_bottom",
      }}
    />

    <Stack.Screen name="TranspoDetails" component={TranspoDetailsScreen} />
    <Stack.Screen name="AppCamera" component={AppCamera} />
    <Stack.Screen name="Delivery" component={DeliveryScreen} />
    <Stack.Screen name="FeedsDelivery" component={FeedsDeliveryScreen} />
    <Stack.Screen name="Hauling" component={HaulingScreen} />
    <Stack.Screen name="Map" component={MapScreen} />
  </Stack.Navigator>
);

export default AppNavigator;
