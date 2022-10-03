import { View } from "react-native";

function SkeletonWrapper({ style, children }) {
  return <View style={style}>{children}</View>;
}

export default SkeletonWrapper;
