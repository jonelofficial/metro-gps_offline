import React, { useContext } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Constants from "expo-constants";

import AppText from "../components/AppText";
import colors from "../config/colors";
import AuthContext from "../auth/context";

function OfflineNotice(props) {
  const { noInternet } = useContext(AuthContext);
  if (noInternet)
    return (
      <View style={styles.container}>
        {/* <ActivityIndicator color={colors.white} size="small" /> */}
        <AppText style={styles.text}>No Internet Connection</AppText>
      </View>
    );
  return null;
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.danger,
    padding: 5,
    width: "100%",
    height: 35,
    position: "absolute",
    zIndex: 1,
    elevation: 1,
    top: Constants.statusBarHeight,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  text: {
    textAlign: "center",
    color: colors.white,
    paddingLeft: 5,
    fontSize: 16,
  },
});

export default OfflineNotice;
