import React from "react";
import LottieView from "lottie-react-native";
import { StyleSheet, View } from "react-native";

function SuccessIndicator({ visible = false }) {
  if (!visible) return null;
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../animations/success.json")}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  animation: {
    width: 100,
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});

export default SuccessIndicator;
