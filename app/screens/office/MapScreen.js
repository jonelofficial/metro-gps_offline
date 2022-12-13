import React, { createRef, useContext, useEffect, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import {
  Alert,
  AppState,
  BackHandler,
  Button,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useStopwatch } from "react-timer-hook";
import { useForm } from "react-hook-form";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { mapDoneSchema, mapGasSchema } from "../../config/schema";

import AppButton from "../../components/AppButton";
import AuthContext from "../../auth/context";
import AppText from "../../components/AppText";
import DrivingIndicator from "../../components/indicator/DrivingIndicator";

import Screen from "../../components/Screen";
import useLocation from "../../hooks/useLocation";
import Spacer from "../../components/Spacer";
import SuccessIndicator from "../../components/indicator/SuccessIndicator";
import colors from "../../config/colors";
import routes from "../../navigation/routes";
import GasModal from "../../components/modals/GasModal";
import DoneModal from "../../components/modals/DoneModal";
import {
  deleteFromTable,
  insertToTable,
  selectTable,
  updateToTable,
} from "../../utility/sqlite";
import { getPathLength } from "geolib";
import ActivityIndicator from "../../components/indicator/ActivityIndicator";
import { createTrip, deleteTrip } from "../../api/office/TripApi";
import { createBulkLocation } from "../../api/office/LocationsApi";
import { gasCarBulk } from "../../api/office/DieselApi";

function MapScreen({ navigation }) {
  const [trip, setTrip] = useState({ locations: [] });
  const [isModalVisible, setModalVisible] = useState(false);
  const [gasLoading, setGasLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState("none");
  const [totalKm, setTotalKm] = useState();

  // MAP
  const [points, setPoints] = useState([]);
  const [gas, setGas] = useState([]);
  const [drag, setDrag] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

  // APPFORM PICKER
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  // DONE MODAL
  const [doneModal, setDoneModal] = useState(false);
  const [doneLoading, setDoneLoading] = useState(false);
  const [estimatedOdo, setEstimatedOdo] = useState(0);

  //Context
  const {
    user,
    noInternet,
    netInfo,
    currentLocation,
    setCurrentLocation,
    locationPermission,
    setOffScan,
    setUnfinishTrip,
    offlineGasStations,
    token,
  } = useContext(AuthContext);

  // GPS
  const {
    arrivedLoading,
    leftLoading,
    handleArrived,
    handleLeft,
    setLeftLoading,
    setArrivedLoading,
    handleInterval,
  } = useLocation();

  // TIMER
  const { seconds, minutes, hours, start, pause } = useStopwatch({
    autoStart: true,
  });

  // DONE FORM
  const methodDone = useForm({
    resolver: yupResolver(mapDoneSchema),
    mode: "onSubmit",
  });
  const {
    reset: doneReset,
    clearErrors: clearError,
    setValue: setOdoValue,
  } = methodDone;

  // GAS FORM
  const method = useForm({
    resolver: yupResolver(mapGasSchema),
    mode: "onSubmit",
  });
  const { reset, clearErrors, setValue: setGasValue } = method;

  // HANDLE BACK
  const backAction = () => {
    Alert.alert("Hold on!", "Are you sure you want to go back?", [
      {
        text: "Cancel",
        onPress: () => null,
        style: "cancel",
      },
      {
        text: "YES",
        onPress: noInternet
          ? () => BackHandler.exitApp()
          : async () => {
              if (trip?.locations.length % 2 !== 0 && !mapLoading) {
                return sqliteArrived();
              } else if (trip?.locations.length % 2 === 0 && !mapLoading) {
                setDoneModal(true);
              } else {
                alert("Please finish the map loading");
              }
            },
      },
    ]);
    return true;
  };

  useEffect(() => {
    (async () => {
      Notifications.setNotificationHandler({
        handleNotification: async () => {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        },
      });

      setMapLoading(true);
      setOffScan(false);
      await fetchGasStation();

      // SQLITE

      const tripRes = await selectTable("offline_trip");

      if (tripRes.length >= 0) {
        const pointObj = JSON.parse(tripRes[tripRes.length - 1].points);
        pointObj.map(async (item) => {
          if (
            pointObj[0].latitude.toFixed(4) == item.latitude.toFixed(4) ||
            pointObj[0].longitude.toFixed(4) == item.longitude.toFixed(4)
          ) {
            return null;
          }
          await insertToTable("INSERT INTO route (points) values (?)", [
            JSON.stringify(item),
          ]);
        });

        await reloadRoute();
      }

      const locPoint = JSON.parse(tripRes[tripRes.length - 1].locations);
      if (locPoint.length <= 0) {
        await sqliteLeft();
      } else {
        await reloadMapState();
      }
      setMapLoading(false);
      // END
    })();
  }, []);

  useEffect(() => {
    // FOR APPSTATE
    const subscription = AppState.addEventListener(
      "change",
      _handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, [trip, currentLocation]);

  useEffect(() => {
    // HANDLE BACK
    BackHandler.addEventListener("hardwareBackPress", backAction);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, [trip, netInfo]);

  useEffect(() => {
    (async () => {
      const tripRes = await selectTable("offline_trip");
      if (tripRes.length > 0) {
        const meter = getPathLength(points);
        const km = meter / 1000;
        const odo = JSON.parse(tripRes[tripRes.length - 1].odometer);

        setEstimatedOdo(parseFloat(km.toFixed(1)) + parseFloat(odo));
      }
    })();
  }, [trip]);

  useEffect(() => {
    (async () => {
      if (currentLocation && currentLocation.speed >= 1.4 && !mapLoading) {
        setPoints((currentValue) => [
          ...currentValue,
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
        ]);

        insertToTable("INSERT INTO route (points) values (?)", [
          JSON.stringify({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }),
        ]);
      }
      if (points.length == 0 || trip == undefined) {
        await reloadRoute();
        await reloadMapState();
        await reloadGas();
      }

      const meter = getPathLength(points);
      const km = meter / 1000;
      setTotalKm(km.toFixed(1));
    })();
  }, [currentLocation]);

  // 900000 = 15 minutes
  useEffect(() => {
    const loc = setInterval(() => {
      handleLocInterval();
    }, 900000);
    return () => {
      clearInterval(loc);
    };
  }, []);

  // ACTIVITY INDICATOR FOR SHOWING SUCCESS ANIMATION
  const handleSuccess = () => {
    setShowSuccess("flex");
    setTimeout(() => {
      setShowSuccess("none");
    }, 2166);
  };

  // APPSTATE
  const _handleAppStateChange = async (nextAppState) => {
    let notif;
    if (nextAppState === "background") {
      updateToTable(
        `UPDATE offline_trip SET  points = (?)  WHERE id = (SELECT MAX(id) FROM offline_trip)`,
        [JSON.stringify(points)]
      );

      const content = {
        title: `Fresh Morning ${
          user.first_name[0].toUpperCase() +
          user.first_name.substring(1).toLowerCase()
        } `,
        body: "You have an existing transaction. Please go back to the Metro app and finish it.",
      };

      notif = Notifications.scheduleNotificationAsync({
        content,
        trigger: { seconds: 60 },
      });
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync(notif);
    }
  };

  // FETCH THE LIST OF ALL ACCREDITED GAS STATION FOR FORM PICKER
  const fetchGasStation = async () => {
    try {
      setItems([]);

      setItems(
        offlineGasStations.map((item) => {
          return { label: item.label, value: item._id };
        })
      );
    } catch (error) {
      alert(`ERROR gas: ${error}`);
    }
  };

  // MAP ANIMATION ON USER LOCATION CHANGEDs

  const mapView = createRef();

  const userLocationChanged = (event) => {
    const newRegion = event.nativeEvent.coordinate;

    setCurrentLocation({
      ...currentLocation,
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });

    !drag && animateMap(newRegion);
  };

  const animateMap = (newRegion) => {
    mapView.current.animateToRegion(
      {
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
        latitudeDelta: currentLocation.latitudeDelta,
        longitudeDelta: currentLocation.longitudeDelta,
      },
      500
    );
  };

  // SQLITE HERE ////////////////////////////////////////

  const handleLocInterval = async () => {
    try {
      const intervalRes = await handleInterval(trip._id);
      const newObj = {
        ...intervalRes,
        date: Date.now(),
      };

      const tripRes = await selectTable("offline_trip");
      let locPoint = JSON.parse(tripRes[tripRes.length - 1].locations);
      locPoint.push(newObj);

      await updateToTable(
        // `UPDATE offline_trip SET locations = (?) WHERE id = ${tripRes.length}`,
        "UPDATE offline_trip SET locations = (?) WHERE id = (SELECT MAX(id) FROM offline_trip)",
        [JSON.stringify(locPoint)]
      );
    } catch (error) {
      console.log("LOC INTERVAL: ", error);
    }
  };

  const sqliteLeft = async () => {
    try {
      setLeftLoading(true);
      start(new Date());

      const leftRes = await handleLeft(trip._id);
      const newObj = {
        ...leftRes,
        date: Date.now(),
      };

      const tripRes = await selectTable("offline_trip");
      let locPoint = JSON.parse(tripRes[tripRes.length - 1].locations);
      locPoint.push(newObj);

      await updateToTable(
        // `UPDATE offline_trip SET locations = (?) WHERE id = ${tripRes.length}`,
        "UPDATE offline_trip SET locations = (?) WHERE id = (SELECT MAX(id) FROM offline_trip)",
        [JSON.stringify(locPoint)]
      );

      await reloadMapState();

      setLeftLoading(false);

      handleSuccess();
    } catch (error) {
      setLeftLoading(false);
      alert("ERROR SQLITE LEFT");
      console.log("ERROR SQLITE LEFT PROCESS: ", error);
    }
  };

  const sqliteArrived = async () => {
    try {
      setArrivedLoading(true);
      pause();

      const arrivedRes = await handleArrived(trip._id);
      const newObj = {
        ...arrivedRes,
        date: Date.now(),
      };

      const tripRes = await selectTable("offline_trip");
      let locPoint = JSON.parse(tripRes[tripRes.length - 1].locations);
      locPoint.push(newObj);

      await updateToTable(
        // `UPDATE offline_trip SET locations = (?) WHERE id = ${tripRes.length}`,
        "UPDATE offline_trip SET locations = (?) WHERE id = (SELECT MAX(id) FROM offline_trip)",
        [JSON.stringify(locPoint)]
      );

      await reloadMapState();

      setArrivedLoading(false);

      handleSuccess();
    } catch (error) {
      setArrivedLoading(false);
      alert("ERROR SQLITE ARRIVED");
      console.log("ERROR SQLITE ARRIVED PROCESS: ", error);
    }
  };

  const sqliteGas = async (data) => {
    try {
      Keyboard.dismiss();
      setGasLoading(true);

      const gasObj = {
        gas_station_id: data.gas_station_id,
        trip_id: null,
        gas_station_name: data.gas_station_name,
        odometer: data.odometer,
        liter: data.liter,
        amount: data.amount,
        lat: currentLocation.latitude,
        long: currentLocation.longitude,
      };

      const tripRes = await selectTable("offline_trip");
      let gas = JSON.parse(tripRes[tripRes.length - 1].gas);
      gas.push(gasObj);

      await updateToTable(
        // `UPDATE offline_trip SET gas = (?) WHERE id = ${tripRes.length}`,
        "UPDATE offline_trip SET gas = (?)WHERE id = (SELECT MAX(id) FROM offline_trip)",
        [JSON.stringify(gas)]
      );

      setGas((prevState) => [
        ...prevState,
        { lat: currentLocation.latitude, long: currentLocation.longitude },
      ]);

      reset();
      setValue(null);
      setModalVisible(false);

      setGasLoading(false);

      handleSuccess();
    } catch (error) {
      setGasLoading(false);
      alert("ERROR GAS PROCESS");
      console.log("ERROR GAS PROCESS: ", error);
    }
  };

  const reloadMapState = async () => {
    const tripRes = await selectTable("offline_trip");
    const locPoint = JSON.parse(tripRes[tripRes.length - 1].locations);
    if (locPoint.length > 0) {
      setTrip({
        locations: [
          ...locPoint
            .filter(
              (item) => item.status === "left" || item.status === "arrived"
            )
            .map((filterItem) => {
              return filterItem;
            }),
        ],
      });
    }
  };

  const reloadRoute = async () => {
    const routeRes = await selectTable("route");
    if (routeRes.length > 0) {
      setPoints((prevState) => [
        ...prevState,
        ...routeRes.map((item) => {
          return JSON.parse(item.points);
        }),
      ]);
    }
  };

  const reloadGas = async () => {
    const gasRes = await selectTable("gas");
    if (gasRes.length > 0) {
      setGas(
        gasRes.map((item) => {
          return JSON.parse(item);
        })
      );
    }
  };

  const sqliteDone = async (vehicle_data) => {
    try {
      Keyboard.dismiss();
      setDoneLoading(true);
      let mapPoints = [];
      const routeRes = await selectTable("route");

      await routeRes.map((item) => {
        mapPoints.push(JSON.parse(item.points));
      });

      const tripRes = await selectTable("offline_trip");

      await updateToTable(
        // `UPDATE offline_trip SET odometer_done = (?), points = (?)  WHERE id = ${tripRes.length}`,
        "UPDATE offline_trip SET odometer_done = (?), points = (?)  WHERE id = (SELECT MAX(id) FROM offline_trip)",
        [JSON.stringify(vehicle_data.odometer_done), JSON.stringify(mapPoints)]
      );

      if (!noInternet) {
        const offlineTrip = await selectTable(
          "offline_trip WHERE id = (SELECT MAX(id) FROM offline_trip)"
        );

        const img = JSON.parse(offlineTrip[0].image);
        const form = new FormData();
        form.append("vehicle_id", offlineTrip[0].vehicle_id);
        form.append("odometer", JSON.parse(offlineTrip[0].odometer));
        form.append("odometer_done", JSON.parse(vehicle_data.odometer_done));
        img?.uri !== null && form.append("image", img);
        form.append("companion", offlineTrip[0].companion);
        form.append("points", JSON.stringify(mapPoints));
        form.append("others", offlineTrip[0].others);
        form.append("trip_date", JSON.parse(offlineTrip[0].date));

        const tripRes = await createTrip(form, token);
        if (tripRes?.data._id) {
          const locations = await createBulkLocation(
            JSON.parse(offlineTrip[0].locations),
            tripRes.data._id,
            token
          );
          // console.log(locations);
          const diesels = await gasCarBulk(
            JSON.parse(offlineTrip[0].gas),
            tripRes.data._id,
            token
          );
          // console.log(diesels);

          if ((locations.tally === true) & (diesels.tally === true)) {
            await deleteFromTable(
              `offline_trip WHERE id = (SELECT MAX(id) FROM offline_trip)`
            );
          } else {
            await deleteTrip(tripRes.data._id, token);
            alert(
              `Syncing ${
                !locations.tally ? "locations" : "diesels"
              } not match. Please try again`
            );
          }
        }
      }

      doneReset();
      setDoneLoading(false);
      setUnfinishTrip(false);

      navigation.reset({
        routes: [{ index: 0, name: routes.DASHBOARD }],
      });
    } catch (error) {
      setDoneLoading(false);
      alert("ERROR DONE PROCESS");
      console.log("ERROR DONE PROCESS: ", error);
    }
  };
  return (
    <>
      <Screen>
        {!locationPermission && (
          <View style={styles.locationPermission}>
            <AppText
              style={{ textAlign: "center" }}
            >{`Accept Location Permission\n and try again.`}</AppText>
          </View>
        )}
        {currentLocation && locationPermission && !mapLoading ? (
          <>
            <View style={{ height: "50%" }}>
              {/* <DrivingIndicator visible={true} /> */}
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <AppText style={{ color: colors.danger }}>
                  M E T R O {"  "} G P S
                </AppText>
              </View>
            </View>
            <View
              style={{
                padding: 15,
              }}
            >
              <View style={styles.timeWrapper}>
                <AppText>{`Trip Time: ${hours > 0 ? `${hours}:` : ""}${
                  minutes < 10 ? `0${minutes}` : minutes >= 10 ? minutes : "00"
                }:${
                  seconds < 10 ? `0${seconds}` : seconds >= 10 && seconds
                }`}</AppText>
                <AppText>{`  Total KM: ${totalKm}`}</AppText>
              </View>

              <View style={styles.buttonWrapper}>
                <AppButton
                  title="Left"
                  style={styles.btnLeft}
                  color={
                    leftLoading
                      ? "light"
                      : trip?.locations.length % 2 !== 0 &&
                        trip?.locations.length > 0
                      ? "light"
                      : trip === undefined
                      ? "light"
                      : "danger"
                  }
                  onPress={sqliteLeft}
                  isLoading={leftLoading}
                  disabled={
                    leftLoading ||
                    arrivedLoading ||
                    (trip?.locations.length % 2 !== 0 &&
                      trip?.locations.length > 0) ||
                    trip === undefined
                  }
                />
                <View style={{ width: "4%" }}></View>
                <AppButton
                  title="Arrived"
                  style={styles.btnArrived}
                  color={
                    arrivedLoading
                      ? "light"
                      : trip?.locations.length % 2 === 0 &&
                        trip?.locations.length > 0
                      ? "light"
                      : trip === undefined
                      ? "light"
                      : "success"
                  }
                  onPress={sqliteArrived}
                  isLoading={arrivedLoading}
                  disabled={
                    arrivedLoading ||
                    leftLoading ||
                    (trip?.locations.length % 2 === 0 &&
                      trip?.locations.length > 0) ||
                    trip === undefined
                  }
                />
              </View>
              <Spacer style={{ height: 30 }} />
              <View style={styles.otherBtnWrapper}>
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  style={[
                    styles.gas,
                    {
                      backgroundColor:
                        arrivedLoading || leftLoading
                          ? colors.light
                          : trip === undefined
                          ? colors.light
                          : colors.primary,
                    },
                  ]}
                  disabled={arrivedLoading || leftLoading || trip === undefined}
                >
                  <MaterialCommunityIcons
                    name="gas-station"
                    size={40}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.doneWrapper}>
              <AppButton
                title="Done"
                style={styles.btnDone}
                color={
                  trip?.locations.length % 2 !== 0 && trip?.locations.length > 0
                    ? "light"
                    : trip?.locations.length === 0 && trip?.locations.length > 0
                    ? "light"
                    : leftLoading
                    ? "light"
                    : arrivedLoading
                    ? "light"
                    : "black"
                }
                onPress={() => setDoneModal(true)}
                disabled={
                  (trip?.locations.length % 2 !== 0 &&
                    trip?.locations.length > 0) ||
                  (trip?.locations.length === 0 &&
                    trip?.locations.length > 0) ||
                  arrivedLoading ||
                  leftLoading
                }
              />
            </View>
          </>
        ) : (
          <ActivityIndicator visible={true} />
          // <AppText>Loading</AppText>
        )}
        <View style={[styles.success, { display: showSuccess }]}>
          <SuccessIndicator visible={showSuccess === "flex" ? true : false} />
        </View>
      </Screen>

      {/* GAS MODAL */}
      <GasModal
        isModalVisible={isModalVisible}
        setModalVisible={setModalVisible}
        reset={reset}
        setValue={setValue}
        setOpen={setOpen}
        items={items}
        value={value}
        open={open}
        method={method}
        clearErrors={clearErrors}
        setGasValue={setGasValue}
        onSubmit={sqliteGas}
        loading={gasLoading}
      />

      {/* DONE MODAL */}
      <DoneModal
        defaultValue={estimatedOdo}
        doneModal={doneModal}
        setDoneModal={setDoneModal}
        methodDone={methodDone}
        handleDoneButton={sqliteDone}
        doneLoading={doneLoading}
        clearErrors={clearError}
        setValue={setOdoValue}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  buttonWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  btnLeft: {
    width: "48%",
    borderRadius: 10,
  },
  btnArrived: {
    width: "48%",
    borderRadius: 10,
  },
  car: {
    width: 10,
    height: 10,
  },
  success: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  otherBtnWrapper: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  btnDriveAgain: {
    width: "80%",
    borderRadius: 10,
    display: "none",
  },
  gas: {
    width: 60,
    padding: 10,
    borderRadius: 10,
    elevation: 1,
  },
  btnDone: {},
  doneWrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 15,
  },
  dragWrapper: {
    width: "100%",
    position: "absolute",
    alignItems: "center",
    bottom: 0,
  },
  timeWrapper: {
    padding: 15,
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  locationPermission: {
    flex: 1,
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

export default MapScreen;
