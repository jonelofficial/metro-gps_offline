import * as Location from "expo-location";
import { useContext, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { createLocation } from "../api/LocationsApi";

import AuthContext from "../auth/context";

export default useLocation = () => {
  const { width, height } = Dimensions.get("window");
  const ASPECT_RATIO = width / height;
  const LATITUDE_DELTA = 0.0001; // 0.009
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
  const { token } = useContext(AuthContext);

  const [locationPermission, setLocationPermission] = useState(false);
  const [leftLoading, setLeftLoading] = useState(false);
  const [arrivedLoading, setArrivedLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState();

  // const apiKey = "AIzaSyDbCxrt0H-TQpGGDLlloTLfNKK5AAgtVVc";

  const getLocation = async () => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      // Location.setGoogleApiKey(apiKey);

      if (!granted) return;

      setLocationPermission(true);
      const result = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        accuracy: Location.LocationAccuracy.BestForNavigation,
      });
      setCurrentLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    } catch (error) {
      console.log("GET LOCATION ERROR: ", error);
    }
  };

  const handleArrived = async (trip) => {
    try {
      const result = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        accuracy: Location.LocationAccuracy.BestForNavigation,
      });

      const res = await Location.reverseGeocodeAsync({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });

      const api = await createLocation(
        {
          data: {
            trip_id: 1,
            lat: result.coords.latitude,
            long: result.coords.longitude,
            date: `${result.timestamp}`,
            address: res,
            is_pin: true,
            trip: 1,
            status: "arrived",
            trip: trip,
          },
        },
        token
      );

      return api.data;
    } catch (error) {
      console.log("HANDLE ARRIVED ERROR: ", error);
    }
  };

  const handleLeft = async (trip) => {
    try {
      const result = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        accuracy: Location.LocationAccuracy.BestForNavigation,
      });

      const res = await Location.reverseGeocodeAsync({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });

      const api = await createLocation(
        {
          data: {
            trip_id: 1,
            lat: result.coords.latitude,
            long: result.coords.longitude,
            date: `${result.timestamp}`,
            address: res,
            is_pin: false,
            trip: 1,
            status: "left",
            trip: trip,
          },
        },
        token
      );

      return api.data;
    } catch (error) {
      console.log("HANDLE LEFT ERROR: ", error);
    }
  };

  useEffect(() => {
    // const loc = setInterval(() => {
    getLocation();
    // }, 1000);

    // return () => {
    //   clearInterval(loc);
    // };
  }, []);

  return {
    handleArrived,
    handleLeft,
    currentLocation,
    arrivedLoading,
    leftLoading,
    setLeftLoading,
    setArrivedLoading,
    width,
    setCurrentLocation,
    locationPermission,
  };
};
