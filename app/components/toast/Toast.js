import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import AppButton from "../AppButton";
import AppText from "../AppText";
import authStorage from "../../auth/storage";
import colors from "../../config/colors";
import useAuth from "../../auth/useAuth";
import UserDetails from "../skeleton/UserDetails";
import UserDetailsSkeleton from "../skeleton/UserDetailsSkeleton";
import routes from "../../navigation/routes";

function Toast({ scanned, showToast, data, setScanned, userData, noInternet }) {
  const navigation = useNavigation();
  const { logIn } = useAuth();

  const handleOnPress = async () => {
    if (data.targetScreen === null) {
      setScanned(true);
      logIn(userData);
      authStorage.storeToken(userData);
    } else {
      setScanned(true);
      navigation.navigate(routes.TRANSPO_DETAILS, {
        params: { vehicle_id: data },
      });
    }
  };

  const fadeAnim = useRef(new Animated.Value(300)).current;

  const slideIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const slideOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 300,
      useNativeDriver: true,
      duration: 300,
    }).start();
  };

  useEffect(() => {
    if (scanned) {
      slideIn();
    } else {
      slideOut();
    }

    if (showToast) {
      slideIn();
    } else {
      slideOut();
    }
  }, [scanned, showToast]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: fadeAnim }],
      }}
    >
      {data === null ? (
        <View style={[styles.container, { alignItems: "center" }]}>
          <AppText>Login First</AppText>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.detailsContainer}>
            {scanned ? (
              <UserDetails
                title={data.title}
                description={data.description}
                profile={data.profile}
              />
            ) : (
              <UserDetailsSkeleton />
            )}
          </View>
          <AppButton
            isLoading={!scanned}
            title={
              data.targetScreen === null && data.description === null
                ? "NO VEHICLE FOUND"
                : // : noInternet
                // ? "NO INTERNET"
                scanned && data.targetScreen === null
                ? "SIGN IN"
                : scanned
                ? "DRIVE"
                : "LOADING..."
            }
            textStyle={styles.button}
            disabled={
              !scanned ||
              (data.targetScreen === null && data.description === null) ||
              noInternet
            }
            color={
              data.targetScreen === null && data.description === null
                ? "disablePrimary"
                : // : noInternet
                // ? "disablePrimary"
                scanned
                ? "primary"
                : "disablePrimary"
            }
            onPress={scanned ? handleOnPress : null}
          />
        </View>
      )}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 25,
    borderTopRightRadius: 25,
    borderTopLeftRadius: 25,
    position: "absolute",
    width: "100%",
    bottom: 0,
  },
  detailsContainer: {
    padding: 15,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: "row",
    overflow: "hidden",
  },
  button: {
    fontSize: 18,
  },
});
export default Toast;
