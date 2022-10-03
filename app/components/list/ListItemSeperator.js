import React from "react";
import { StyleSheet, View } from "react-native";

import colors from "../../config/colors";

function ListItemSeperator(props) {
  return <View style={styles.container} />;
}
const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 2,
    backgroundColor: colors.white,
  },
});
export default ListItemSeperator;
