import { StyleSheet } from "react-native";

import Spacer from "../Spacer";
import SkeletonWrapper from "../skeleton/main/SkeletonWrapper";
import Skeleton from "./main/Skeleton";

function UserDetailsSkeleton(props) {
  return (
    <SkeletonWrapper style={{ flexDirection: "row" }}>
      <Skeleton style={styles.profilePlaceholder} />
      <SkeletonWrapper style={styles.detailsPlaceholder}>
        <Skeleton />
        <Spacer style={{ height: 8 }} />
        <SkeletonWrapper style={styles.threePlaceholder}>
          <Skeleton style={{ width: "20%" }} />
          <Skeleton style={{ width: "40%", marginHorizontal: 10 }} />
          <Skeleton style={{ width: "28%" }} />
        </SkeletonWrapper>
        <Spacer style={{ height: 8 }} />
        <SkeletonWrapper style={styles.twoPlaceholder}>
          <Skeleton style={{ width: "65%" }} />
          <Skeleton style={{ width: "30%", marginHorizontal: 10 }} />
        </SkeletonWrapper>
      </SkeletonWrapper>
    </SkeletonWrapper>
  );
}
const styles = StyleSheet.create({
  profilePlaceholder: {
    width: 57,
    height: 55,
    borderRadius: 12,
    overflow: "hidden",
  },
  detailsPlaceholder: {
    width: "60%",
    marginHorizontal: 15,
  },
  threePlaceholder: {
    flexDirection: "row",
    width: "100%",
  },
  twoPlaceholder: {
    flexDirection: "row",
    width: "100%",
  },
});

export default UserDetailsSkeleton;
