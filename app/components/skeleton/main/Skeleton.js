import { View } from "react-native";

import defaultStyle from "../../../config/styles";
import SkeletonPlaceholder from "./SkeletonPlaceholder";

function Skeleton({ style }) {
  return (
    <View style={[defaultStyle.skeleton, style]}>
      <SkeletonPlaceholder />
    </View>
  );
}

export default Skeleton;
