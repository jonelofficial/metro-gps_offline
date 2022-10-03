import { Text } from "react-native";

import defaultStyle from "../config/styles";
import Fonts from "./Fonts";

function AppText({ children, style }) {
  return (
    <Fonts>
      <Text style={[defaultStyle.text, style]}>{children}</Text>
    </Fonts>
  );
}

export default AppText;
