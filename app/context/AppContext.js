import React, { useEffect, useState } from "react";
import { Camera } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import * as SplashScreen from "expo-splash-screen";
import * as MediaLibrary from "expo-media-library";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import jwtDecode from "jwt-decode";

import { Alert, Dimensions, Linking, LogBox, ToastAndroid } from "react-native";
import AuthContext from "../auth/context";
import authStorage from "../auth/storage";
import {
  createTable,
  deleteFromTable,
  dropTable,
  showTable,
} from "../utility/sqlite";
import { useNetInfo } from "@react-native-community/netinfo";

LogBox.ignoreLogs(["exported from 'deprecated-react-native-prop-types'."]);

SplashScreen.preventAutoHideAsync();

function AppContext({ children }) {
  useKeepAwake();
  const netInfo = useNetInfo();
  const [noInternet, setInternet] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState();
  const [token, setToken] = useState();
  const [currentLocation, setCurrentLocation] = useState();
  const [locationPermission, setLocationPermission] = useState(false);
  const [offScan, setOffScan] = useState(false);
  const [odometer, setOdometer] = useState();
  const [unfinishTrip, setUnfinishTrip] = useState(false);

  const [offlineVehicles, setOfflineVehicles] = useState();
  const [offlineGasStations, setOfflineGasStations] = useState();
  const [offlineTrips, setOfflineTrips] = useState({
    trips: [],
    locations: [],
    diesels: [],
  });

  const { width, height } = Dimensions.get("window");
  const ASPECT_RATIO = width / height;
  const LATITUDE_DELTA = 0.0001; // 0.009
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

  useEffect(() => {
    if (netInfo.type !== "unknown" && netInfo.isInternetReachable === false) {
      return setInternet(true);
    }
    setInternet(false);
  }, [netInfo]);

  useEffect(() => {
    (async () => {
      // await dropTable("offline_trip");

      // const res = await showTable();
      // console.log("T A B L E: ", res);

      await createTable(
        "trip",
        "id integer primary key not null, _id TEXT, user_id TEXT, vehicle_id TEXT, locations LONGTEXT, diesels LONGTEXT, odometer INTEGER, odometer_done INTEGER, odometer_image_path TEXT, others LONGTEXT, companion LONGTEXT"
      );

      await createTable(
        "offline_trip",
        "id integer primary key not null, vehicle_id TEXT , odometer TEXT, odometer_done TEXT, image LONGTEXT, companion LONGTEXT, points LONGTEXT, others TEXT, locations LONGTEXT , gas LONGTEXT"
      );

      await createTable(
        "locations",
        "id integer primary key not null, trip_id TEXT, lat NUMBER, long NUMBER, status TEXT, address LONGTEXT"
      );

      await createTable(
        "route",
        "id integer primary key not null, points LONGTEXT"
      );

      await createTable(
        "gas",
        "id integer primary key not null, gas_station_id TEXT, trip_id TEXT, gas_station_name TEXT, odometer NUMBER, liter NUMBER, lat NUMBER, long NUMBER , amount NUMBER"
      );
    })();
  }, []);

  useEffect(() => {
    (async () => {
      ToastAndroid.show(`Welcome to Metro GPS`, ToastAndroid.SHORT);
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        const res = await MediaLibrary.requestPermissionsAsync();
        const { granted } = await Location.requestForegroundPermissionsAsync();
        const notif = await Notifications.requestPermissionsAsync();
        if (
          status === "granted" &&
          res.status === "granted" &&
          granted &&
          notif.granted
        ) {
          setLocationPermission(true);
          restoreUser();
          watch_location();
        } else {
          Alert.alert(
            "Request Permission",
            `Please accept permission for ${
              status === "denied" ? "CAMERA " : ""
            }${res.status === "denied" ? "MEDIA LIBRARY " : ""}${
              !granted ? "LOCATION" : ""
            }${
              !!notif.granted ? "NOTIFICATION" : ""
            } to run the app.\n \nGo to phone setting > Application > Metro GPS > Permission or click OPEN PERMISSION then restart app. Thank you`,
            [
              { text: "OK", onPress: () => null, style: "cancel" },
              {
                text: "OPEN PERMISSION",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
      } catch (error) {
        console.log("APP-CONTEXT ERROR: ", error);
      }
    })();
  }, []);

  const watch_location = async () => {
    await Location.watchPositionAsync(
      {
        enableHighAccuracy: true,
        accuracy: Location.LocationAccuracy.BestForNavigation,
      },
      (result) => {
        setCurrentLocation(
          // result
          {
            speed: result.coords.speed,
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }
        );
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
    <AuthContext.Provider
      value={{
        user,
        token,
        offlineVehicles,
        offlineGasStations,
        offlineTrips,
        setUser,
        setToken,
        setOfflineTrips,
        setOfflineVehicles,
        setOfflineGasStations,
        noInternet,
        currentLocation,
        locationPermission,
        setCurrentLocation,
        setOffScan,
        offScan,
        unfinishTrip,
        setUnfinishTrip,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AppContext;
