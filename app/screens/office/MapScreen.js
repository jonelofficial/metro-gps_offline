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
import { updateTrip } from "../../api/office/TripApi";
import { getGasStation } from "../../api/GasStationApi";
import { gasCar } from "../../api/office/DieselApi";
import AppButton from "../../components/AppButton";
import AuthContext from "../../auth/context";
import ActivityIndicator from "../../components/indicator/ActivityIndicator";
import AppText from "../../components/AppText";
import cache from "../../utility/cache";
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
  createTable,
  insertToTable,
  selectTable,
  updateToTable,
} from "../../utility/sqlite";
import { createLocation } from "../../api/office/LocationsApi";
import { getPathLength } from "geolib";

function MapScreen({ route, navigation }) {
  const [trip, setTrip] = useState({ locations: [] });
  const [isModalVisible, setModalVisible] = useState(false);
  const [gasLoading, setGasLoading] = useState(false);
  const [locationId, setLocationId] = useState([]);
  const [showSuccess, setShowSuccess] = useState("none");

  // MAP
  const [points, setPoints] = useState([]);
  const [gas, setGas] = useState([]);
  const [drag, setDrag] = useState(false);

  // APPFORM PICKER
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  // DONE MODAL
  const [doneModal, setDoneModal] = useState(false);
  const [doneLoading, setDoneLoading] = useState(false);
  const [estimatedOdo, setEstimatedOdo] = useState();
  //Context
  const {
    user,
    token,
    offlineTrips,
    offlineGasStations,
    noInternet,
    netInfo,
    currentLocation,
    setCurrentLocation,
    locationPermission,
    setOffScan,
    setUnfinishTrip,
  } = useContext(AuthContext);

  // GPS
  const {
    arrivedLoading,
    leftLoading,
    handleArrived,
    handleLeft,
    setLeftLoading,
    setArrivedLoading,
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
              if (!noInternet && trip?.locations.length % 2 !== 0) {
                // setArrivedModal(true);
                return handleArrivedButton();
              }
              setDoneModal(true);
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
      setOffScan(false);
      await fetchGasStation();

      // SQLITE
      await createTable(
        "trip",
        "id integer primary key not null, _id TEXT, user_id TEXT, vehicle_id TEXT, locations LONGTEXT, diesels LONGTEXT, odometer INTEGER, odometer_done INTEGER, odometer_image_path TEXT, others TEXT, companion LONGTEXT, points LONGTEXT"
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
        "id integer primary key not null, gas_station_id TEXT, trip_id TEXT, gas_station_name TEXT, odometer NUMBER, liter NUMBER, lat NUMBER, long NUMBER"
      );

      const trip = await route.params.trip;
      console.log(trip);
      const tripRes = await selectTable("trip");

      if (tripRes.length <= 0) {
        await insertToTable(
          "INSERT INTO trip (_id , user_id , vehicle_id  , odometer , odometer_image_path , others , companion ) values (?,?,?,?,?,?,?)",
          [
            trip._id,
            trip.user_id,
            trip.vehicle_id,
            trip.odometer,
            trip.odometer_image_path,
            JSON.stringify(trip.others),
            JSON.stringify(trip.companion),
          ]
        );
        console.log("working");
      }

      if (route.params.trip.locations.length <= 0) {
        await sqliteLeft();
      } else {
        console.log("TEST");

        // await insertToTable("INSERT INTO route (points) values (?)", [
        //   JSON.stringify(trip.points),
        // ]);

        // trip.locations.map(async (item) => {
        //   await insertToTable(
        //     "INSERT INTO locations ( trip_id , lat , long , status , address ) values (?,?,?,?,?)",
        //     [
        //       item.trip_id,
        //       item.lat,
        //       item.long,
        //       item.status,
        //       JSON.stringify(item.address),
        //     ]
        //   );

        //   setTrip((prevState) => {
        //     locations: [...prevState, item];
        //   });
        // });
        // trip?.points && setPoints(trip.points);
      }
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
  }, [trip, offlineTrips, currentLocation]);

  useEffect(() => {
    // HANDLE BACK
    BackHandler.addEventListener("hardwareBackPress", backAction);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, [trip, offlineTrips, netInfo]);

  useEffect(() => {
    (async () => {
      const tripRes = await selectTable("trip");
      if (tripRes.length > 0) {
        const meter = getPathLength(points);
        const km = meter / 1000;

        setEstimatedOdo(parseFloat(km.toFixed(1)) + tripRes[0].odometer);
      }
    })();
  }, [trip]);

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
      // setUnfinishTrip(true);
      const newTripObj = {
        dataObj: {
          locations: locationId,
          odometer_done: -1,
          points: points,
        },
        id: trip?._id,
        trip: trip,
      };
      cache.store(user.userId, newTripObj);

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

      if (noInternet) {
        setItems(
          offlineGasStations.map((item) => {
            return { label: item.label, value: item._id };
          })
        );
      } else {
        const gasRes = await getGasStation(token);
        setItems(
          gasRes.data.map((item) => {
            return { label: item.label, value: item._id };
          })
        );
      }
    } catch (error) {
      alert(`ERROR gas: ${error}`);
    }
  };

  // HANDLE GAS BUTTON, ADD GAS DETAILS AND LATLONG ON THE TRIP TRANSACTION
  const handleGasSubmit = async (data) => {
    try {
      Keyboard.dismiss();
      setGasLoading(true);
      const newDieselObj = {
        ...data,
        trip_id: await route.params.trip._id,
        lat: currentLocation.latitude,
        long: currentLocation.longitude,
      };
      await gasCar(newDieselObj, token);
      setGas((currentValue) => [
        ...currentValue,
        {
          lat: currentLocation.latitude,
          long: currentLocation.longitude,
        },
      ]);
      reset();
      setValue(null);
      setModalVisible(false);
      setGasLoading(false);
      handleSuccess();
    } catch (error) {
      setGasLoading(false);
      alert("ERROR: Please try again. ", error);
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

    !drag && animateMap();
  };

  const animateMap = () => {
    mapView.current.animateToRegion(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: currentLocation.latitudeDelta,
        longitudeDelta: currentLocation.longitudeDelta,
      },
      1000
    );
  };

  // SQLITE HERE ////////////////////////////////////////

  useEffect(() => {
    (async () => {
      if (currentLocation && currentLocation.speed >= 1.2) {
        setPoints((currentValue) => [
          ...currentValue,
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
        ]);
        const routeRes = await selectTable("route");
        if (routeRes.length > 0) {
          const stringPoints = JSON.stringify(points);
          await updateToTable("UPDATE route SET points = (?) WHERE id = 1", [
            stringPoints,
          ]);
        } else {
          await insertToTable("INSERT INTO route (points) values (?)", [
            JSON.stringify(points),
          ]);
        }
      }
      if (points.length == 0 || trip == undefined) {
        await reloadRoute();
        await reloadMapState();
      }
    })();
  }, [trip, currentLocation]);

  const sqliteLeft = async () => {
    try {
      setLeftLoading(true);
      start(new Date());

      const trip = await route.params.trip;
      const leftRes = await handleLeft(trip._id);

      const routeRes = await selectTable("route");
      const newPoints = await JSON.parse(routeRes[0].points);
      newObjt = {
        points: newPoints,
      };

      const res = await createLocation(leftRes, token);
      console.log(res);

      await updateTrip(trip._id, newObjt, token);

      await insertToTable(
        "INSERT INTO locations ( trip_id , lat , long , status , address ) values (?,?,?,?,?)",
        [
          leftRes.trip_id,
          leftRes.lat,
          leftRes.long,
          leftRes.status,
          JSON.stringify(leftRes.address),
        ]
      );

      await reloadMapState();
      setTimeout(() => {
        setLeftLoading(false);
      }, 2000);
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

      const trip = await route.params.trip;
      const arrivedRes = await handleArrived(trip._id);

      const routeRes = await selectTable("route");
      const newPoints = await JSON.parse(routeRes[0].points);
      newObjt = {
        points: newPoints,
      };

      const res = await createLocation(arrivedRes, token);
      console.log(res);

      await updateTrip(trip._id, newObjt, token);

      await insertToTable(
        "INSERT INTO locations ( trip_id , lat , long , status , address ) values (?,?,?,?,?)",
        [
          arrivedRes.trip_id,
          arrivedRes.lat,
          arrivedRes.long,
          arrivedRes.status,
          JSON.stringify(arrivedRes.address),
        ]
      );

      await reloadMapState();
      setTimeout(() => {
        setArrivedLoading(false);
      }, 2000);
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

      const tripId = await route.params.trip._id;
      const newDieselObj = {
        ...data,
        trip_id: tripId,
        lat: currentLocation.latitude,
        long: currentLocation.longitude,
      };

      await insertToTable(
        "INSERT INTO gas (gas_station_id , trip_id , gas_station_name , odometer , liter , lat , long ) values (?,?,?,?,?,?,?)",
        []
      );
    } catch (error) {
      setGasLoading(false);
      alert("ERROR GAS PROCESS");
      console.log("ERROR GAS PROCESS: ", error);
    }
  };

  const reloadMapState = async () => {
    const locRes = await selectTable("locations");
    if (locRes.length > 0) {
      setTrip({
        locations: [
          ...locRes.map((item) => {
            const locObj = {
              ...item,
              address: JSON.parse(item.address),
            };
            return locObj;
          }),
        ],
      });
    }
  };

  const reloadRoute = async () => {
    const routeRes = await selectTable("route");
    if (routeRes.length > 0) {
      setPoints(JSON.parse(routeRes[0].points));
    }
  };

  const sqliteDone = async (vehicle_data) => {
    try {
      Keyboard.dismiss();
      setDoneLoading(true);
      const trip_id = await route.params.trip._id;

      const routeRes = await selectTable("route");
      const newPoints = await JSON.parse(routeRes[0].points);

      // const locationRes = await selectTable("locations");

      // await locationRes.map(async (item) => {
      //   const locObj = {
      //     ...item,
      //     address: JSON.parse(item.address),
      //   };
      //   await createLocation(locObj, token);
      // });

      const newObjt = {
        odometer_done: vehicle_data.odometer_done,
        points: newPoints,
      };

      await updateTrip(trip_id, newObjt, token);

      doneReset();
      setDoneLoading(false);
      setUnfinishTrip(false);
      await AsyncStorage.removeItem("cache" + user.userId);
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
        {currentLocation && locationPermission ? (
          // && trip?.locations.length > 0
          <>
            <View style={{ height: "50%" }}>
              {!noInternet ? (
                <MapView
                  style={styles.map}
                  moveOnMarkerPress={false}
                  showsUserLocation
                  showsMyLocationButton={false}
                  initialRegion={currentLocation}
                  onUserLocationChange={(event) => {
                    userLocationChanged(event);
                  }}
                  ref={mapView}
                  onPanDrag={() => setDrag(true)}
                >
                  <Polyline
                    coordinates={points}
                    strokeColor={colors.line}
                    strokeWidth={3}
                  />
                  {trip?.locations.map((item, i) => {
                    const markerTitle = i + 1;
                    return (
                      <Marker
                        key={i}
                        coordinate={{
                          latitude: item.lat,
                          longitude: item.long,
                        }}
                        pinColor={
                          item.status === "left"
                            ? colors.danger
                            : colors.success
                        }
                        title={markerTitle.toString()}
                      ></Marker>
                    );
                  })}
                  {gas &&
                    gas.map((gasItem, i) => {
                      const gasTitle = i + 1;
                      return (
                        <Marker
                          key={i}
                          coordinate={{
                            latitude: gasItem.lat,
                            longitude: gasItem.long,
                          }}
                          pinColor={colors.primary}
                          title={gasTitle.toString()}
                        ></Marker>
                      );
                    })}
                  {/* OFFLINE MARKERS */}
                  {offlineTrips?.locations.map((item, i) => {
                    const markerTitle = i + 1;
                    return (
                      <Marker
                        key={i}
                        coordinate={{
                          latitude: item.lat,
                          longitude: item.long,
                        }}
                        pinColor={
                          item.status === "left"
                            ? colors.danger
                            : colors.success
                        }
                        title={markerTitle.toString()}
                      ></Marker>
                    );
                  })}
                  {offlineTrips?.diesels.map((gasItem, i) => {
                    const gasTitle = i + 1;
                    return (
                      <Marker
                        key={i}
                        coordinate={{
                          latitude: gasItem.lat,
                          longitude: gasItem.long,
                        }}
                        pinColor={colors.primary}
                        title={gasTitle.toString()}
                      ></Marker>
                    );
                  })}
                  {/* CAR IMAGE HERE */}
                </MapView>
              ) : (
                <DrivingIndicator visible={true} />
              )}
              {drag && !noInternet && (
                <View style={styles.dragWrapper}>
                  <Button
                    title="Track Location"
                    onPress={() => setDrag(false)}
                  />
                </View>
              )}
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
                      : offlineTrips?.locations.length % 2 !== 0 &&
                        offlineTrips?.locations.length > 0
                      ? "light"
                      : trip === undefined
                      ? "light"
                      : noInternet
                      ? "light"
                      : "danger"
                  }
                  onPress={
                    noInternet || offlineTrips.trips.length > 0
                      ? () => handleOfflineLeft()
                      : () => sqliteLeft()
                    // handleLeftButton(
                    //   tripId ? tripId : route.params.trip._id
                    // )
                  }
                  isLoading={leftLoading}
                  disabled={
                    leftLoading ||
                    arrivedLoading ||
                    (trip?.locations.length % 2 !== 0 &&
                      trip?.locations.length > 0) ||
                    (offlineTrips?.locations.length % 2 !== 0 &&
                      offlineTrips?.locations.length > 0) ||
                    noInternet ||
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
                      : offlineTrips?.locations.length % 2 === 0 &&
                        offlineTrips?.locations.length > 0
                      ? "light"
                      : trip === undefined
                      ? "light"
                      : noInternet
                      ? "light"
                      : "success"
                  }
                  onPress={
                    noInternet || offlineTrips.trips.length > 0
                      ? () => handleOfflineArrived()
                      : () => {
                          sqliteArrived();
                          // handleArrivedButton();
                          // setArrivedModal(true);
                        }
                  }
                  isLoading={arrivedLoading}
                  disabled={
                    arrivedLoading ||
                    leftLoading ||
                    (trip?.locations.length % 2 === 0 &&
                      trip?.locations.length > 0) ||
                    (offlineTrips?.locations.length % 2 === 0 &&
                      offlineTrips?.locations.length > 0) ||
                    noInternet ||
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
                          : noInternet
                          ? colors.light
                          : trip === undefined
                          ? colors.light
                          : colors.primary,
                    },
                  ]}
                  disabled={
                    arrivedLoading ||
                    leftLoading ||
                    noInternet ||
                    trip === undefined
                  }
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
                    : offlineTrips?.locations.length % 2 !== 0 &&
                      offlineTrips?.locations.length > 0
                    ? "light"
                    : offlineTrips?.locations.length === 0 &&
                      offlineTrips?.locations.length > 0
                    ? "light"
                    : noInternet
                    ? "light"
                    : leftLoading
                    ? "light"
                    : arrivedLoading
                    ? "light"
                    : "black"
                }
                // onPress={() => navigation.replace(routes.DASHBOARD)}
                onPress={() => setDoneModal(true)}
                disabled={
                  (trip?.locations.length % 2 !== 0 &&
                    trip?.locations.length > 0) ||
                  (trip?.locations.length === 0 &&
                    trip?.locations.length > 0) ||
                  (offlineTrips?.locations.length % 2 !== 0 &&
                    offlineTrips?.locations.length > 0) ||
                  (offlineTrips?.locations.length === 0 &&
                    offlineTrips?.locations.length > 0) ||
                  arrivedLoading ||
                  leftLoading ||
                  noInternet
                }
              />
            </View>
          </>
        ) : (
          <ActivityIndicator visible={true} />
          // <>
          //   <AppText>LOADING</AppText>
          // </>
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
        onSubmit={
          noInternet || offlineTrips.trips.length > 0
            ? handleOfflineGas
            : handleGasSubmit
        }
        loading={gasLoading}
      />

      {/* ARRIVED MODAL */}
      {/* <ArrivedModal
        arrivedModal={arrivedModal}
        setArrivedModal={setArrivedModal}
        arrivedMethod={arrivedMethod}
        handleArrivedButton={handleArrivedModalButton}
        arrivedModalLoading={arrivedModalLoading}
      /> */}

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
