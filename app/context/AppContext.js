import React, { useEffect, useState } from "react";
import { Camera } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import * as SplashScreen from "expo-splash-screen";
import * as MediaLibrary from "expo-media-library";
import * as Location from "expo-location";
import jwtDecode from "jwt-decode";

import { Alert, Linking, LogBox, ToastAndroid } from "react-native";
import AuthContext from "../auth/context";
import authStorage from "../auth/storage";

LogBox.ignoreLogs(["exported from 'deprecated-react-native-prop-types'."]);

SplashScreen.preventAutoHideAsync();

function AppContext({ children }) {
  useKeepAwake();

  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState();
  const [token, setToken] = useState();

  useEffect(() => {
    ToastAndroid.show(`Welcome to Metro GPS`, ToastAndroid.SHORT);
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const res = await MediaLibrary.requestPermissionsAsync();
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted" && res.status === "granted" && granted) {
        restoreUser();
        watch_location();
      } else {
        Alert.alert(
          "Request Permission",
          `Please accept permission for ${
            status === "denied" ? "CAMERA " : ""
          }${res.status === "denied" ? "MEDIA LIBRARY " : ""}${
            !granted ? "LOCATION" : ""
          } to run the app.\n \nGo to phone setting > Application > Metro GPS > Permission or click OPEN PERMISSION then restart app. Thank you`,
          [
            { text: "OK", onPress: () => null, style: "cancel" },
            { text: "OPEN PERMISSION", onPress: () => Linking.openSettings() },
          ]
        );
      }
    })();
  }, []);

  const watch_location = async () => {
    let location = await Location.watchPositionAsync(
      {
        enableHighAccuracy: true,
        accuracy: Location.LocationAccuracy.BestForNavigation,
      },
      (location_update) => {
        // console.log("update location!", location_update.coords);
      }
    );
  };

  const restoreUser = async () => {
    try {
      const user = await authStorage.getUser();
      const json = await JSON.parse(user);
      if (!json) return null;
      const newUser = jwtDecode(json.token);
      setToken(json.token);
      setUser(newUser);
    } catch (e) {
      console.log("ERROR ON RESTORING USER", e);
    } finally {
      SplashScreen.hideAsync();
      setIsReady(true);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AppContext;
