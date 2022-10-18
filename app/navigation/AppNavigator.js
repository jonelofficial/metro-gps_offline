import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AppCamera from "../components/AppCamera";
import DashboardStackNavigator from "./DashboardStackNavigator";

import MapScreen from "../screens/office/MapScreen";
import MapDetailsScreen from "../screens/MapDetailsScreen";
import TranspoDetailsScreen from "../screens/office/TranspoDetailsScreen";

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
        // headerShown: true,
        title: "Details",
        animation: "slide_from_bottom",
      }}
    />

    <Stack.Screen name="TranspoDetails" component={TranspoDetailsScreen} />
    <Stack.Screen name="AppCamera" component={AppCamera} />
    <Stack.Screen name="Map" component={MapScreen} />
  </Stack.Navigator>
);

export default AppNavigator;
