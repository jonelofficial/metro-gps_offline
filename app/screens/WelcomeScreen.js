import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import AppText from "../components/AppText";
import Spacer from "../components/Spacer";
import colors from "../config/colors";
import routes from "../navigation/routes";

function WelcomeScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.navigate(routes.LOGIN);
    }, 2000);
  }, []);
  return (
    <>
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
        style={styles.background}
      >
        <View style={styles.container}>
          <Image source={require("../assets/logo.png")} style={styles.image} />
          <Spacer />
          <AppText style={styles.version}>Version 2.0</AppText>
          <Spacer />

          <ActivityIndicator size="large" color={colors.main} />
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  image: {
    width: 210,
    height: 190,
  },
  version: {
    color: colors.white,
    textAlign: "center",
    fontSize: 14,
  },
});

export default WelcomeScreen;
