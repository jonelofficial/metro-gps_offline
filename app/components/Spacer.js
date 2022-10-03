import { StyleSheet, View } from "react-native";

function Spacer({ style }) {
  return <View style={[styles.container, style]}></View>;
}
const styles = StyleSheet.create({
  container: {
    height: 15,
  },
});

export default Spacer;
