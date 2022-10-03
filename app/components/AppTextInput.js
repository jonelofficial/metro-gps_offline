import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import defaultStyle from "../config/styles";
import Fonts from "./Fonts";

function AppTextInput({
  secIcon,
  style,
  setShowPassword,
  showPassword,
  onBlur,
  error,
  ...otherProps
}) {
  const [click, setClick] = useState(false);

  return (
    <Fonts>
      <View
        style={[
          styles.container,
          { borderColor: click ? defaultStyle.colors.primary : "transparent" },
          error,
        ]}
      >
        <TextInput
          style={[defaultStyle.text, style]}
          onFocus={() => setClick(true)}
          onBlur={(onBlur && onBlur, () => setClick(false))}
          {...otherProps}
        />
        {secIcon && (
          <TouchableWithoutFeedback
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialCommunityIcons
              style={styles.icon}
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={defaultStyle.colors.medium}
            />
          </TouchableWithoutFeedback>
        )}
      </View>
    </Fonts>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: defaultStyle.colors.light,
    borderRadius: 15,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    // paddingRight: 20,
    position: "absolute",
    right: 0,
    marginRight: 16,
  },
});

export default AppTextInput;
