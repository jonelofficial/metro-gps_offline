import { Platform } from "react-native";
import colors from "./colors";

const fonts = {
  ios: "Avenir",
  android: "Khyay",
};

export default {
  colors,
  skeleton: {
    height: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  text: {
    color: colors.dark,
    width: "100%",
    ...Platform.select({
      ios: {
        fontSize: 20,
        fontFamily: fonts.ios,
      },
      android: {
        fontSize: 18,
        fontFamily: fonts.android,
      },
    }),
  },

  //   Heading

  h1: {
    color: colors.dark,
    ...Platform.select({
      ios: {
        fontSize: 34,
        fontFamily: fonts.ios,
      },
      android: {
        fontSize: 32,
        fontFamily: fonts.android,
      },
    }),
  },
  h2: {
    color: colors.dark,
    ...Platform.select({
      ios: {
        fontSize: 26,
        fontFamily: fonts.ios,
      },
      android: {
        fontSize: 24,
        fontFamily: fonts.android,
      },
    }),
  },
  h3: {
    color: colors.dark,
    ...Platform.select({
      ios: {
        fontSize: 20.72,
        fontFamily: fonts.ios,
      },
      android: {
        fontSize: 18.72,
        fontFamily: fonts.android,
      },
    }),
  },
  h4: {
    color: colors.dark,
    ...Platform.select({
      ios: {
        fontSize: 18,
        fontFamily: fonts.ios,
      },
      android: {
        fontSize: 16,
        fontFamily: fonts.android,
      },
    }),
  },
  h5: {
    color: colors.dark,
    ...Platform.select({
      ios: {
        fontSize: 15.25,
        fontFamily: fonts.ios,
      },
      android: {
        fontSize: 13.28,
        fontFamily: fonts.android,
      },
    }),
  },
  h6: {
    color: colors.dark,
    ...Platform.select({
      ios: {
        fontSize: 12.72,
        fontFamily: fonts.ios,
      },
      android: {
        fontSize: 10.72,
        fontFamily: fonts.android,
      },
    }),
  },
};
