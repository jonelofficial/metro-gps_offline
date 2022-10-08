import React, { useEffect, useState } from "react";
import { Camera } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import * as SplashScreen from "expo-splash-screen";
import * as MediaLibrary from "expo-media-library";
import * as Location from "expo-location";
import jwtDecode from "jwt-decode";
import * as SQLite from "expo-sqlite";

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

  const [offlineVehicles, setOfflineVehicles] = useState();
  const [offlineGasStations, setOfflineGasStations] = useState();
  const [offlineTrips, setOfflineTrips] = useState({
    trips: [],
    locations: [],
    diesels: [],
  });

  const [selectData, setSelectData] = useState();

  const db = SQLite.openDatabase("db.db");

  const createTable = async (tableName, fields) => {
    db.transaction((tx) => {
      tx.executeSql(`create table if not exists ${tableName} (${fields})`);
    });
  };

  const selectTable = async (tableName) => {
    await db.transaction((tx) => {
      tx.executeSql(`select * from ${tableName}`, [], (_, { rows }) => {
        setSelectData(rows);
      });
    });
    return selectData;
  };

  const insertToTable = async (query, values) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        values,
        (transact, resultset) => console.log("INSERT Success: ", resultset),
        (transact, err) => console.log("INSERT Error: ", err)
      );
    });
  };

  const deleteFromTable = async (tableName) => {
    db.transaction((tx) => {
      tx.executeSql(
        `delete from ${tableName}`,
        (transact, resultset) => console.log("DELETE Success: ", resultset),
        (transact, err) => console.log("DELETE Error: ", err)
      );
    });
  };

  useEffect(() => {
    (async () => {
      ToastAndroid.show(`Welcome to Metro GPS`, ToastAndroid.SHORT);
      try {
        console.log("test git merge");
        const { status } = await Camera.requestCameraPermissionsAsync();
        const res = await MediaLibrary.requestPermissionsAsync();
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted" && res.status === "granted" && granted) {
          restoreUser();
          // watch_location();
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
        createTable,
        selectTable,
        insertToTable,
        deleteFromTable,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AppContext;
