import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import AppHeading from "./AppHeading";
import AppText from "./AppText";
import colors from "../config/colors";
import fonts from "../config/fonts";
import Fonts from "./Fonts";

function Card({ description, name, image, style, onPress }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.detailsContainer}>
        <Fonts>
          <AppText style={styles.welcome}>Welcome</AppText>
          <AppHeading style={styles.name} size="h1">
            {name}
          </AppHeading>
          {/* <AppHeading style={styles.description} size="h6">
            {description.replace(/[^a-zA-Z ]/g, " ")}
          </AppHeading> */}
        </Fonts>
      </View>
      <TouchableOpacity style={styles.imageContainer} onPress={onPress}>
        {image && <Image source={image} style={styles.image} />}
        {image === null && (
          <Image
            source={require("../assets/placeholder/profile_placeholder.png")}
            style={styles.image}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 50,
  },
  welcome: {
    fontFamily: fonts.primaryName,
    fontSize: 16,
    color: colors.transparentPrimary,
  },
  name: {
    fontFamily: fonts.primaryName,
    fontSize: 30,
    textTransform: "capitalize",
  },
  description: { textTransform: "capitalize" },
});

export default Card;
