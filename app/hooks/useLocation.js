import * as Location from "expo-location";
import { useContext, useEffect, useState } from "react";
import { Dimensions, ToastAndroid } from "react-native";
import { createLocation } from "../api/office/LocationsApi";

import AuthContext from "../auth/context";

export default useLocation = () => {
  const { width, height } = Dimensions.get("window");
  const ASPECT_RATIO = width / height;
  const LATITUDE_DELTA = 0.0001; // 0.009
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
  const { token } = useContext(AuthContext);

  const [leftLoading, setLeftLoading] = useState(false);
  const [arrivedLoading, setArrivedLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState();

  // const apiKey = "AIzaSyDbCxrt0H-TQpGGDLlloTLfNKK5AAgtVVc";

  const getLocation = async (trip) => {
    try {
      ToastAndroid.show(`Syncing`, ToastAndroid.LONG);
      const { granted } = await Location.requestForegroundPermissionsAsync();
      // Location.setGoogleApiKey(apiKey);

      if (!granted) return;

      const result = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        accuracy: Location.LocationAccuracy.BestForNavigation,
      });

      const res = await Location.reverseGeocodeAsync({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });

      const api = {
        trip_id: trip,
        lat: result.coords.latitude,
        long: result.coords.longitude,
        address: res,
        status: "interval",
      };

      return api;
    } catch (error) {
      console.log("GET LOCATION ERROR: ", error);
    }
  };

  const handleInterval = async (trip) => {
    try {
      const result = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        accuracy: Location.LocationAccuracy.BestForNavigation,
      });

      const res = await Location.reverseGeocodeAsync({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });

      const api = {
        trip_id: trip,
        lat: result.coords.latitude,
        long: result.coords.longitude,
        address: res,
        status: "interval",
      };

      return api;
    } catch (error) {
      console.log("HANDLE ARRIVED ERROR: ", error);
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

      // const api = await createLocation(
      //   {
      //     trip_id: trip,
      //     lat: result.coords.latitude,
      //     long: result.coords.longitude,
      //     address: res,
      //     status: "arrived",
      //   },
      //   token
      // );

      // return api.data;

      const api = {
        trip_id: trip,
        lat: result.coords.latitude,
        long: result.coords.longitude,
        address: res,
        status: "arrived",
      };

      return api;
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

      // const api = await createLocation(
      //   {
      //     trip_id: trip,
      //     lat: result.coords.latitude,
      //     long: result.coords.longitude,
      //     address: res,
      //     status: "left",
      //   },
      //   token
      // );

      const api = {
        trip_id: trip,
        lat: result.coords.latitude,
        long: result.coords.longitude,
        address: res,
        status: "left",
      };

      // return api.data;
      return api;
    } catch (error) {
      console.log("HANDLE LEFT ERROR: ", error);
    }
  };

  const offlineHandleArrived = async () => {
    try {
      const result = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        accuracy: Location.LocationAccuracy.BestForNavigation,
      });

      const res = await Location.reverseGeocodeAsync({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });

      const data = {
        lat: result.coords.latitude,
        long: result.coords.longitude,
        address: res,
        status: "arrived",
      };

      return data;
    } catch (error) {
      console.log("OFFLINE HANDLE LEFT ERROR: ", error);
    }
  };

  const offlineHandleLeft = async () => {
    try {
      const result = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        accuracy: Location.LocationAccuracy.BestForNavigation,
      });

      const res = await Location.reverseGeocodeAsync({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });

      const data = {
        lat: result.coords.latitude,
        long: result.coords.longitude,
        address: res,
        status: "left",
      };

      return data;
    } catch (error) {
      console.log("OFFLINE HANDLE LEFT ERROR: ", error);
    }
  };

  useEffect(() => {
    // const loc = setInterval(() => {
    //   getLocation();
    // }, 500);
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
    offlineHandleArrived,
    offlineHandleLeft,
    getLocation,
    handleInterval,
  };
};
