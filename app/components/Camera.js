import React from "react";
import { StyleSheet, TouchableWithoutFeedback } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";

import colors from "../config/colors";
import routes from "../navigation/routes";

function Camera({}) {
  const navigation = useNavigation();

  const handleScan = () => {
    navigation.navigate(routes.DASHBOARD_STACK_SCAN);
  };
  return (
    <BlurView intensity={90} tint="light" style={styles.container}>
      <TouchableWithoutFeedback onPress={handleScan}>
        <LinearGradient
          // Background Linear Gradient
          start={[0, 1]}
          end={[1, 0]}
          colors={[
            colors.accent,
            colors.accent,
            colors.secondary,
            colors.primary,
            colors.main,
            colors.main,
          ]}
          style={styles.iconBackground}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={30}
            color={colors.white}
          />
        </LinearGradient>
      </TouchableWithoutFeedback>
    </BlurView>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: 50,
    width: "100%",
    position: "absolute",
    bottom: 0,
  },
  iconBackground: {
    alignItems: "center",
    justifyContent: "center",
    width: 65,
    height: 65,
    borderRadius: 50,
    marginTop: -30,
  },
});
export default Camera;
