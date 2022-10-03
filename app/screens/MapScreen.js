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

import {
  arrivedDeliverySchema,
  haulingFirstArrivedSchema,
  haulingLastArrivedSchema,
  haulingLastLeftSchema,
  leftDeliverySchema,
  mapDoneSchema,
  mapGasSchema,
} from "../config/schema";
import { createTrip, getSingleTrip, updateTrip } from "../api/TripApi";
import { getGasStation } from "../api/GasStationApi";
import { gasCar } from "../api/DieselApi";
import { createDelivery, updateDelivery } from "../api/DeliveryApi";
import { createHauling } from "../api/HaulingApi";
import AppButton from "../components/AppButton";
import AuthContext from "../auth/context";
import ActivityIndicator from "../components/ActivityIndicator";
import AppText from "../components/AppText";
import cache from "../utility/cache";
import DeliveryModal from "../components/modals/DeliveryModal";
import DeliveryLeftModal from "../components/modals/DeliveryLeftModal";
import HaulingModal from "../components/modals/HaulingModal";
import DoneModal from "../components/modals/DoneModal";
import useInternetStatus from "../hooks/useInternetStatus";
import Screen from "../components/Screen";
import useLocation from "../hooks/useLocation";
import Spacer from "../components/Spacer";
import SuccessIndicator from "../components/SuccessIndicator";
import colors from "../config/colors";
import routes from "../navigation/routes";
import GasModal from "../components/modals/GasModal";

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
  // HAULING  ARRIVED MODAL
  const [haulingModal, setHaulingModal] = useState(false);
  // HAULING  LEFT MODAL
  const [haulingLeftModal, setHaulingLeftModal] = useState(false);
  // DELIVERY ARRIVED MODAL
  const [arrivedModal, setArrivedModal] = useState(false);
  // DELIVERY LEFT MODAL
  const [leftModal, setLeftModal] = useState(false);
  const [deliveryObj, setDeliveryObjt] = useState();
  // DONE MODAL
  const [doneModal, setDoneModal] = useState(false);
  const [doneLoading, setDoneLoading] = useState(false);

  //Context
  const { user, token } = useContext(AuthContext);

  // Checking if have internet
  const { noInternet, netInfo } = useInternetStatus();

  // TIMER
  const { seconds, minutes, hours } = useStopwatch({ autoStart: true });

  // HAULING  ARRIVED FORM
  const methodHaulingArrived = useForm({
    resolver: yupResolver(
      trip?.attributes.locations.data.length === 1
        ? haulingFirstArrivedSchema
        : trip?.attributes.locations.data.length === 2
        ? haulingLastLeftSchema
        : haulingLastArrivedSchema
    ),
    method: "onTouched",
  });
  const { reset: haulingReset } = methodHaulingArrived;

  // DELIVERY ARRIVED FORM
  const methodDelivery = useForm({
    resolver: yupResolver(arrivedDeliverySchema),
    mode: "onSubmit",
  });
  const { reset: deliveryReset } = methodDelivery;

  // DELIVERY LEFT FORM
  const methodLeftDelivery = useForm({
    resolver: yupResolver(leftDeliverySchema),
    mode: "onSubmit",
  });

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
          : user.user.trip_template === "delivery" && !noInternet
          ? async () => {
              if (trip?.attributes.locations.data.length % 2 !== 0) {
                setArrivedModal(true);
              } else {
                await AsyncStorage.removeItem("cache" + user.user.id);
                navigation.replace(routes.DASHBOARD);
              }
            }
          : user.user.trip_template === "office" && !noInternet
          ? async () => {
              if (trip?.attributes.locations.data.length % 2 !== 0) {
                await handleArrivedButton();
              }
              setDoneModal(true);
            }
          : (user.user.trip_template === "feeds_delivery" ||
              user.user.trip_template === "hauling") &&
            !noInternet
          ? async () => {
              if (trip?.attributes.locations.data.length > 3) {
                setDoneModal(true);
              } else {
                alert(
                  "Looks like your transaction still not done. Please finish trip with 2 left and 2 arrived"
                );
              }
            }
          : () => null,
      },
    ]);
    return true;
  };

  useEffect(() => {
    (async () => {
      await fetchGasStation();
      await handleLeftButton(route.params.trip.id);
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
  }, [trip]);

  useEffect(() => {
    // HANDLE BACK
    BackHandler.addEventListener("hardwareBackPress", backAction);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, [trip, netInfo]);

  // ACTIVITY INDICATOR FOR SHOWING SUCCESS ANIMATION
  const handleSuccess = () => {
    setShowSuccess("flex");
    setTimeout(() => {
      setShowSuccess("none");
    }, 2166);
  };

  // APPSTATE
  const _handleAppStateChange = (nextAppState) => {
    if (
      nextAppState === "background" &&
      (user.user.trip_template === "office" ||
        user.user.trip_template === "feeds_delivery" ||
        user.user.trip_template === "hauling" ||
        (user.user.trip_template === "delivery" &&
          trip.attributes.locations.data.length < 1))
    ) {
      const newTripObj = {
        dataObj: {
          data: {
            locations: locationId,
            odometer_done: "-1",
            points: points,
          },
        },
        id: trip?.id,
      };
      cache.store(user.user.id, newTripObj);
    }
  };

  // FETCH THE LIST OF ALL ACCREDITED GAS STATION FOR FORM PICKER
  const fetchGasStation = async () => {
    try {
      setItems([]);
      const gasRes = await getGasStation(token);
      setItems(
        gasRes.data.map((item) => {
          return { label: item.attributes.label, value: item.id };
        })
      );
    } catch (error) {
      alert("ERROR gas: ", error);
    }
  };

  // FETCHING THE TRIP TRANSACTION TO REUSE THE DETAILS
  const fetchTrip = async (trip_id) => {
    const populate = user.user.trip_template;
    const res = await getSingleTrip(token, populate, trip_id);
    setTrip(res.data);

    // PROCESS THIS IF TRIP TEMPLATE OF THE USER IS DELIVERY
    user.user.trip_template === "delivery" &&
      setDeliveryObjt({
        trip_date: Date.now(),
        trip_type: res.data.attributes.delivery.data.attributes.trip_type,
        route: res.data.attributes.delivery.data.attributes.route,
        booking_number:
          res.data.attributes.delivery.data.attributes.booking_number,
      });
  };

  // ADD LEFT LOCATION AND UPDATE POINTS ROUTE ON THE TRIP TRANSACTION
  const handleLeftButton = async (tripID) => {
    try {
      setLeftLoading(true);
      const leftRes = await handleLeft(tripID);
      setLocationId((currentValue) => [...currentValue, leftRes.id]);
      const newObjt = {
        data: { points: points },
      };

      // Change trip id parameter to pass on function
      await updateTrip(tripID, newObjt, token);
      await fetchTrip(tripID);
      setLeftLoading(false);
      handleSuccess();
    } catch (error) {
      setLeftLoading(false);
      alert("ERROR: Please try again. ", error);
    }
  };

  // ADD ARRIVED LOCATION AND UPDATE POINTS ROUTE ON THE TRIP TRANSACTION
  const handleArrivedButton = async () => {
    try {
      setArrivedLoading(true);
      const rightRes = await handleArrived(trip.id);
      setLocationId((currentValue) => [...currentValue, rightRes.id]);
      const newObjt = {
        data: { points: points },
      };

      // Change trip id parameter to pass on function
      await updateTrip(trip.id, newObjt, token);
      await fetchTrip(trip.id);
      setArrivedLoading(false);
      handleSuccess();
    } catch (error) {
      setArrivedLoading(false);
      alert("ERROR: Please try again. ", error);
    }
  };

  // HANDLE GAS BUTTON, ADD GAS DETAILS AND LATLONG ON THE TRIP TRANSACTION
  const handleGasSubmit = async (data) => {
    try {
      Keyboard.dismiss();
      setGasLoading(true);
      const newDieselObj = {
        data: {
          ...data,
          trip_id: trip.id,
          trip: trip.id,
          lat: currentLocation.latitude,
          long: currentLocation.longitude,
        },
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
        data: { odometer_done: vehicle_data.odometer_done, points: points },
      };

      await updateTrip(trip.id, newObjt, token);
      doneReset();
      setDoneLoading(false);
      await AsyncStorage.removeItem("cache" + user.user.id);
      navigation.replace(routes.DASHBOARD);
    } catch (error) {
      alert("ERROR: ", error);
    }
  };

  /*
  Delivery
  */
  // ARRIVED BUTTON NEW FUNCTION: FOR DELIVERY TRIP TEMPLATE OF USER, UPDATE DELIVERY TRANSACTION WITH CRATES DETAILS AND UPDATE DONE ODOMETER ON THE TRIP TRANSACTION
  const handleDeliveryArrived = async (data) => {
    try {
      Keyboard.dismiss();
      setArrivedLoading(true);
      const deliveryId = trip.attributes.delivery.data.id;
      const deliveryObj = {
        data: {
          temperature_arrived: data.temperature_arrived,
          trip_problem: data.trip_problem,
          crates_dropped: data.crates_dropped,
          crates_collected: data.crates_collected,
          crates_lent: data.crates_lent,
        },
      };
      const tripObj = {
        data: {
          odometer_done: data.odometer,
        },
      };

      await updateDelivery(deliveryId, deliveryObj, token);
      await updateTrip(trip.id, tripObj, token);
      await handleArrivedButton();
      deliveryReset();
      setArrivedModal(false);
    } catch (error) {
      setArrivedLoading(false);
      return alert("ERROR: ", error);
    }
  };

  /*
  Delivery
  */
  // LEFT BUTTON NEW FUNCTION: FOR DELIVERY TRIP TEMPLATE OF USER, CREATE NEW TRIP TRANSACTION WITH SOME PREVIOUS TRIP TRANSACTION DETAILS THEN CREATE NEW DELIVERY TRANSACTION

  const handleDeliveryLeft = async (data) => {
    setLeftLoading(true);
    const newTripObj = {
      data: {
        trip_date: Date.now(),
        trip_type: user.user.trip_template,
        user_id: user.user.id,
        vehicle_id: trip.attributes.vehicle_id,
        companion: data.companion,
        odometer: data.odometer,
      },
    };

    try {
      const newTripRes = await handleDeliveryPostTrip(newTripObj);
      const delObjt = {
        data: {
          ...deliveryObj,
          temperature_left: data.temperature_left,
          trip_id: newTripRes.data.id,
        },
      };
      const newDeliveryRes = await handlePostDelivery(delObjt);
      await handleDeliveryUpdateTrip(
        newDeliveryRes.data.id,
        newTripRes.data.id
      );
      await handleLeftButton(newTripRes.data.id);
      setLeftModal(false);
    } catch (error) {
      alert("ERROR HANDLE DELIVERY LEFT: ", error);
    }
  };

  // 1
  const handleDeliveryPostTrip = async (trip) => {
    const createRes = await createTrip(trip, token);
    if (createRes) {
      return createRes;
    } else {
      setLeftLoading(false);
      return alert("ERROR POST TRIP: Server unreachable. Please try again");
    }
  };

  // 2
  const handlePostDelivery = async (deliveryObj) => {
    const delRes = await createDelivery(deliveryObj, token);
    if (delRes) {
      return delRes;
    }
    setLeftLoading(false);
    return alert("ERROR POST DELIVERY: Server unreachable. Please try again");
  };

  // 3
  const handleDeliveryUpdateTrip = async (id, tripId) => {
    const updateTripObjt = { data: { delivery: id } };

    const updateRes = await updateTrip(tripId, updateTripObjt, token);
    console.log("updateRes: ", updateRes);
    if (updateRes?.error) {
      setLeftLoading(false);
      return alert("ERROR UPDATE TRIP: Server unreachable. Please try again");
    }
  };

  /*
  Hauling
  */
  const handleHaulingSubmit = async (haulingData) => {
    try {
      Keyboard.dismiss();
      haulingReset();
      trip?.attributes.locations.data.length === 2
        ? setLeftLoading(true)
        : setArrivedLoading(true);
      const haulingObj = {
        data: {
          trip_id: trip.id,
          trip_number: trip.attributes.hauling.data.attributes.trip_number,
          trip_type: trip.attributes.hauling.data.attributes.trip_type,
          farm: trip.attributes.hauling.data.attributes.farm,
          ...haulingData,
        },
      };
      await createHauling(haulingObj, token);
      trip?.attributes.locations.data.length === 2
        ? await handleLeftButton(trip.id)
        : await handleArrivedButton();
      setHaulingModal(false);
    } catch (error) {
      alert("HANDLE HAULING SUBMIT ERROR: ", error);
      setHaulingModal(false);
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
  } = useLocation();

  // MAP ANIMATION ON USER LOCATION CHANGED

  const mapView = createRef();

  const userLocationChanged = (event) => {
    const newRegion = event.nativeEvent.coordinate;
    console.log(newRegion);

    if (trip?.attributes.locations.data.length % 2 === 0) {
      null;
    } else if (
      trip?.attributes.locations.data.length !== 0 &&
      newRegion.speed >= 1.4
    ) {
      setPoints((currentValue) => [
        ...currentValue,
        { latitude: newRegion.latitude, longitude: newRegion.longitude },
      ]);
    }

    if (
      noInternet &&
      (user.user.trip_template === "office" ||
        user.user.trip_template === "feeds_delivery" ||
        user.user.trip_template === "hauling" ||
        (user.user.trip_template === "delivery" &&
          trip.attributes.locations.data.length < 1))
    ) {
      const newTripObj = {
        dataObj: {
          data: {
            locations: locationId,
            odometer_done: "-1",
            points: points,
          },
        },
        id: trip?.id,
      };
      cache.store(user.user.id, newTripObj);
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
                {trip?.attributes.locations.data.map((item, i) => {
                  const markerTitle = i + 1;
                  return (
                    <Marker
                      key={i}
                      coordinate={{
                        latitude: item.attributes.lat,
                        longitude: item.attributes.long,
                      }}
                      pinColor={
                        item.attributes.status === "left"
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
              {drag && (
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
                      : trip?.attributes.locations.data.length % 2 !== 0
                      ? "light"
                      : trip?.attributes.locations.data.length >= 3 &&
                        user.user.trip_template === "feeds_delivery"
                      ? "light"
                      : user.user.trip_template === "hauling" &&
                        trip?.attributes.locations.data.length >= 4
                      ? "light"
                      : noInternet
                      ? "light"
                      : "danger"
                  }
                  onPress={
                    user.user.trip_template === "delivery"
                      ? () => setLeftModal(true)
                      : user.user.trip_template === "hauling"
                      ? () => setHaulingModal(true)
                      : () => handleLeftButton(trip.id)
                  }
                  isLoading={leftLoading}
                  disabled={
                    noInternet ||
                    leftLoading ||
                    trip?.attributes.locations.data.length % 2 !== 0 ||
                    (trip?.attributes.locations.data.length >= 3 &&
                      user.user.trip_template === "feeds_delivery") ||
                    (user.user.trip_template === "hauling" &&
                      trip?.attributes.locations.data.length >= 4)
                  }
                />
                <View style={{ width: "4%" }}></View>
                <AppButton
                  title="Arrived"
                  style={styles.btnArrived}
                  color={
                    arrivedLoading
                      ? "light"
                      : trip?.attributes.locations.data.length % 2 === 0
                      ? "light"
                      : user.user.trip_template === "hauling" &&
                        trip?.attributes.locations.data.length >= 4
                      ? "light"
                      : noInternet
                      ? "light"
                      : "success"
                  }
                  onPress={
                    user.user.trip_template === "delivery"
                      ? () => setArrivedModal(true)
                      : user.user.trip_template === "hauling"
                      ? () => setHaulingModal(true)
                      : handleArrivedButton
                  }
                  isLoading={arrivedLoading}
                  disabled={
                    noInternet ||
                    arrivedLoading ||
                    trip?.attributes.locations.data.length % 2 === 0 ||
                    (user.user.trip_template === "hauling" &&
                      trip?.attributes.locations.data.length >= 4)
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
                        : noInternet
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
                  trip?.attributes.locations.data.length % 2 !== 0
                    ? "light"
                    : trip?.attributes.locations.data.length === 0
                    ? "light"
                    : user.user.trip_template === "feeds_delivery" &&
                      trip?.attributes.locations.data.length <= 3
                    ? "light"
                    : user.user.trip_template === "hauling" &&
                      trip?.attributes.locations.data.length <= 3
                    ? "light"
                    : noInternet
                    ? "light"
                    : "black"
                }
                onPress={
                  user.user.trip_template === "delivery"
                    ? async () => {
                        await AsyncStorage.removeItem("cache" + user.user.id);
                        navigation.replace(routes.DASHBOARD);
                      }
                    : () => {
                        setDoneModal(true);
                      }
                }
                disabled={
                  noInternet ||
                  (user.user.trip_template === "feeds_delivery" &&
                    trip?.attributes.locations.data.length <= 3) ||
                  trip?.attributes.locations.data.length % 2 !== 0 ||
                  trip?.attributes.locations.data.length === 0 ||
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

      {/* DELIVERY ARRIVED MODAL */}
      <DeliveryModal
        arrivedModal={arrivedModal}
        setArrivedModal={setArrivedModal}
        methodDelivery={methodDelivery}
        handleDeliveryArrived={handleDeliveryArrived}
        arrivedLoading={arrivedLoading}
      />

      {/* DELIVERY LEFT MODAL */}
      <DeliveryLeftModal
        leftModal={leftModal}
        setLeftModal={setLeftModal}
        methodLeftDelivery={methodLeftDelivery}
        handleDeliveryLeft={handleDeliveryLeft}
        leftLoading={leftLoading}
      />

      {/* HAULING MODAL */}
      <HaulingModal
        trip={trip}
        haulingModal={haulingModal}
        setHaulingModal={setHaulingModal}
        methodHaulingArrived={methodHaulingArrived}
        handleHaulingSubmit={handleHaulingSubmit}
        arrivedLoading={arrivedLoading}
        leftLoading={leftLoading}
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
