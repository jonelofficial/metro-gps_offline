import { Text } from "react-native";

import defaultStyle from "../config/styles";

function AppHeading({ children, style, size = "h1" }) {
  return <Text style={[defaultStyle[size], style]}>{children}</Text>;
}

export default AppHeading;
