import { useFonts } from "expo-font";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import fonts from "../config/fonts";

function Screen({ children, style }) {
  const [loaded] = useFonts({
    Khyay: fonts.primary,
  });
  if (!loaded) {
    return null;
  }

  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
export default Screen;
