import React from "react";

import AppContext from "./app/context/AppContext";
import AppScreen from "./app/screens/AppScreen";

export default function App() {
  return (
    <AppContext>
      <AppScreen />
    </AppContext>
  );
}
