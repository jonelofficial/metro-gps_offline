import { useFonts } from "expo-font";
import { View } from "react-native";

import fonts from "../config/fonts";

function Fonts({ children, style }) {
  const [loaded] = useFonts({
    Khyay: fonts.primary,
  });
  if (!loaded) {
    return null;
  }

  return <View style={style}>{children}</View>;
}

export default Fonts;
