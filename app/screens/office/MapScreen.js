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

import DoneModal from "../../components/modals/DoneModal";
import useInternetStatus from "../../hooks/useInternetStatus";
import Screen from "../../components/Screen";
import useLocation from "../../hooks/useLocation";
import Spacer from "../../components/Spacer";
import SuccessIndicator from "../../components/indicator/SuccessIndicator";
import colors from "../../config/colors";
import routes from "../../navigation/routes";
import GasModal from "../../components/modals/GasModal";

function MapScreen({ route, navigation }) {
  const [trip, setTrip] = useState();
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

  //Context
  const { user, token, offlineTrips, setOfflineTrips, offlineGasStations } =
    useContext(AuthContext);

  // Checking if have internet
  const { noInternet, netInfo } = useInternetStatus();

  // TIMER
  const { seconds, minutes, hours } = useStopwatch({ autoStart: true });

  // DONE FORM
  const methodDone = useForm({
    resolver: yupResolver(mapDoneSchema),
    mode: "onSubmit",
  });
  const { reset: doneReset } = methodDone;

  // GAS FORM
  const method = useForm({
    resolver: yupResolver(mapGasSchema),
    mode: "onSubmit",
  });
  const { reset } = method;

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
              if (trip?.locations.length % 2 !== 0) {
                await handleArrivedButton();
              }
              setDoneModal(true);
            },
      },
    ]);
    return true;
  };

  useEffect(() => {
    !noInternet
      ? (async () => {
          await fetchGasStation();
          const trip_id = await route.params.trip._id;
          setTrip(route.params.trip);
          await handleLeftButton(trip_id);
        })()
      : (async () => {
          try {
            await fetchGasStation();
            const leftData = await offlineHandleLeft();
            const newObj = {
              ...leftData,
              id: offlineTrips.trips.length - 1,
            };
            setOfflineTrips((prevState) => ({
              ...prevState,
              locations: [...prevState.locations, newObj],
            }));
          } catch (error) {
            alert(`USEEFFECT OFFLINE ERROR: ${error}`);
          }
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
  }, [trip, offlineTrips]);

  useEffect(() => {
    // HANDLE BACK
    BackHandler.addEventListener("hardwareBackPress", backAction);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, [trip, offlineTrips, netInfo]);

  // ACTIVITY INDICATOR FOR SHOWING SUCCESS ANIMATION
  const handleSuccess = () => {
    setShowSuccess("flex");
    setTimeout(() => {
      setShowSuccess("none");
    }, 2166);
  };

  // APPSTATE
  const _handleAppStateChange = (nextAppState) => {
    if (nextAppState === "background") {
      const newTripObj = {
        dataObj: {
          locations: locationId,
          odometer_done: "-1",
          points: points,
        },
        id: trip?._id,
      };
      cache.store(user.userId, newTripObj);
    }
  };

  // FETCH THE LIST OF ALL ACCREDITED GAS STATION FOR FORM PICKER
  const fetchGasStation = async () => {
    try {
      setItems([]);

      if (noInternet) {
        alert("GAS NO INTERNET");
        setItems(
          offlineGasStations.data.map((item) => {
            return { label: item.label, value: item._id };
          })
        );
      } else {
        alert("GAS ONLINE");
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

  // ADD LEFT LOCATION AND UPDATE POINTS ROUTE ON THE TRIP TRANSACTION
  const handleLeftButton = async (trip_id) => {
    try {
      setLeftLoading(true);
      const leftRes = await handleLeft(trip_id);
      setLocationId((currentValue) => [...currentValue, leftRes._id]);
      const newObjt = {
        points: points,
      };

      const updateTripRes = await updateTrip(trip_id, newObjt, token);
      setTrip(updateTripRes.data);
      setLeftLoading(false);
      handleSuccess();
    } catch (error) {
      setLeftLoading(false);
      alert("ERROR LEFT BUTTON");
      console.log("ERROR LEFT BUTTON: Please try again. ", error);
    }
  };

  // ADD ARRIVED LOCATION AND UPDATE POINTS ROUTE ON THE TRIP TRANSACTION
  const handleArrivedButton = async () => {
    try {
      setArrivedLoading(true);
      const rightRes = await handleArrived(trip._id);
      setLocationId((currentValue) => [...currentValue, rightRes._id]);
      const newObjt = {
        points: points,
      };

      const updateTripRes = await updateTrip(trip._id, newObjt, token);
      setTrip(updateTripRes.data);
      setArrivedLoading(false);
      handleSuccess();
    } catch (error) {
      setArrivedLoading(false);
      alert("ERROR ARRIVED BUTTON");
      console.log("ERROR ARRIVED BUTTON: Please try again. ", error);
    }
  };

  // HANDLE GAS BUTTON, ADD GAS DETAILS AND LATLONG ON THE TRIP TRANSACTION
  const handleGasSubmit = async (data) => {
    try {
      Keyboard.dismiss();
      setGasLoading(true);
      const newDieselObj = {
        ...data,
        trip_id: trip._id,
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

  // END THE TRIP TRANSACTION WITH DONE ODOMETER AND LAST POINTS ROUTE
  const handleDoneButton = async (vehicle_data) => {
    try {
      Keyboard.dismiss();
      setDoneLoading(true);
      const newObjt = {
        odometer_done: vehicle_data.odometer_done,
        points: points,
      };

      await updateTrip(trip._id, newObjt, token);
      doneReset();
      setDoneLoading(false);
      await AsyncStorage.removeItem("cache" + user.userId);
      navigation.replace(routes.DASHBOARD);
    } catch (error) {
      alert("ERROR DONE BUTTON");
      console.log("ERROR DONE BUTTON", error);
    }
  };

  // GPS
  const {
    currentLocation,
    arrivedLoading,
    leftLoading,
    locationPermission,
    handleArrived,
    handleLeft,
    setLeftLoading,
    setArrivedLoading,
    setCurrentLocation,
    offlineHandleArrived,
    offlineHandleLeft,
  } = useLocation();

  // MAP ANIMATION ON USER LOCATION CHANGED

  const mapView = createRef();

  const userLocationChanged = (event) => {
    const newRegion = event.nativeEvent.coordinate;

    if (trip?.locations.length % 2 === 0) {
      null;
    } else if (trip?.locations.length !== 0 && newRegion.speed >= 1.4) {
      setPoints((currentValue) => [
        ...currentValue,
        { latitude: newRegion.latitude, longitude: newRegion.longitude },
      ]);
    }

    if (noInternet) {
      const newTripObj = {
        dataObj: {
          data: {
            locations: locationId,
            odometer_done: "-1",
            points: points,
          },
        },
        id: trip?._id,
      };
      cache.store(user.userId, newTripObj);
    }

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
                      : trip?.locations.length % 2 !== 0
                      ? "light"
                      : "danger"
                  }
                  onPress={
                    noInternet || offlineTrips
                      ? () => offlineHandleArrived()
                      : () => handleLeftButton(trip._id)
                  }
                  isLoading={leftLoading}
                  disabled={
                    noInternet ||
                    leftLoading ||
                    trip?.locations.length % 2 !== 0
                  }
                />
                <View style={{ width: "4%" }}></View>
                <AppButton
                  title="Arrived"
                  style={styles.btnArrived}
                  color={
                    arrivedLoading
                      ? "light"
                      : trip?.locations.length % 2 === 0
                      ? "light"
                      : "success"
                  }
                  onPress={
                    noInternet || offlineTrips
                      ? () => offlineHandleArrived()
                      : () => handleLeftButton()
                  }
                  isLoading={arrivedLoading}
                  disabled={
                    noInternet ||
                    arrivedLoading ||
                    trip?.locations.length % 2 === 0
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
                      backgroundColor: arrivedLoading
                        ? colors.light
                        : leftLoading
                        ? colors.light
                        : colors.primary,
                    },
                  ]}
                  disabled={noInternet || arrivedLoading || leftLoading}
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
                  trip?.locations.length % 2 !== 0
                    ? "light"
                    : trip?.locations.length === 0
                    ? "light"
                    : "black"
                }
                onPress={
                  noInternet || offlineTrips
                    ? () => null
                    : () => setDoneModal(true)
                }
                disabled={
                  noInternet ||
                  trip?.locations.length % 2 !== 0 ||
                  trip?.locations.length === 0 ||
                  arrivedLoading ||
                  leftLoading
                }
              />
            </View>
          </>
        ) : (
          <ActivityIndicator visible={true} />
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
        onSubmit={handleGasSubmit}
        loading={gasLoading}
      />

      {/* DONE MODAL */}
      <DoneModal
        doneModal={doneModal}
        setDoneModal={setDoneModal}
        methodDone={methodDone}
        handleDoneButton={handleDoneButton}
        doneLoading={doneLoading}
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
