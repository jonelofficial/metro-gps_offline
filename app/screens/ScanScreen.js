import React, { useContext, useEffect, useState } from "react";
import { Button, StyleSheet, View, Dimensions, Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import ViewFinder from "react-native-view-finder";

import { useLogin } from "../api/LoginApi";
import { vehicleIdSchema } from "../config/schema";
import { getVehicle } from "../api/VehicleApi";
import AppText from "../components/AppText";
import AuthContext from "../auth/context";
import defaultStyle from "../config/styles";
import url from "../api/url";
import Screen from "../components/Screen";
import ScanToastModal from "../components/modals/ScanToastModal";
import Toast from "../components/toast/Toast";

function ScanScreen() {
  const { user, token } = useContext(AuthContext);
  const [isModalVisible, setModalVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState();
  const [qrData, setQrData] = useState({
    title: null,
    description: null,
    targetScreen: null,
    profile: null,
  });

  const { height } = Dimensions.get("screen");

  const method = useForm({
    resolver: yupResolver(vehicleIdSchema),
    mode: "onSubmit",
  });

  // Handle vehicle modal onsubmit
  const onSubmit = async (data) => {
    try {
      setModalVisible(false);
      setIsLoading(true);

      const vehicleRes = await getVehicle(data.vehicle_id.toUpperCase(), token);

      if (vehicleRes?.error) {
        alert(vehicleRes.error);
        setIsLoading(false);
        return setScanned(true);
      }

      setQrData({
        vehicle_id: vehicleRes.data[0].plate_no,
        title: `${vehicleRes.data[0].plate_no} ${vehicleRes.data[0].brand}`,
        description: vehicleRes.data[0].name,
        targetScreen: "for validation only",
        profile: null,
      });
      setScanned(true);
    } catch (error) {
      alert("ERROR: ", error);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const vehicleAlert = () =>
    Alert.alert(
      "QR code not valid",
      "Do you want to manual input vehicle number?",
      [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        { text: "OK", onPress: () => setModalVisible(true) },
      ]
    );

  /*
   * Valid JSON for login
   * {
   *   "identifier": "",
   *   "password": ""
   * }
   *
   * * Valid JSON for vehicle
   * {
   *   "vehicle_id": "AAL4975"
   * }
   *
   */

  const handleBarCodeScanned = async ({ type, data }) => {
    try {
      const json = await JSON.parse(data);
      // USER LOGIN AND VEHICLE QR CODE IS VALID
      if (json.vehicle_id && user) {
        setIsLoading(true);
        const vehicleRes = await getVehicle(
          json.vehicle_id.toUpperCase(),
          token
        );

        if (vehicleRes?.error) {
          alert(vehicleRes.error);
          setIsLoading(false);
          return setScanned(true);
        }

        setQrData({
          vehicle_id: vehicleRes.data[0],
          title: `${vehicleRes.data[0].plate_no} ${vehicleRes.data[0].brand}`,
          description: vehicleRes.data[0].name,
          targetScreen: "for validation only",
          profile: null,
        });
        setScanned(true);

        // NOT LOGIN
      } else if (!user) {
        setIsLoading(true);
        try {
          if (json.vehicle_id) {
            setTimeout(() => {
              setQrData(null);
              setScanned(true);
            }, 1000);
          } else {
            const loginRes = await useLogin(json);
            setUserData(loginRes);
            setQrData({
              vehicle_id: null,
              title: `${loginRes.user.first_name} ${loginRes.user.last_name}`,
              description: loginRes.user.trip_template,
              targetScreen: null,
              profile:
                loginRes.user.profile !== null
                  ? `${url.BASEURL}/${loginRes.user.profile}`
                  : undefined,
            });
            setScanned(true);
          }
        } catch (error) {
          setScanned(true);
          alert("No server response");
        }
        // LOGIN BUT NOT VALID VEHICLE QR CODE
      } else if (!json.vehicle_id && user) {
        vehicleAlert();
        setScanned(true);
        // VALID VEHICLE QR CODE BUT NOT LOGIN
      } else if (json.vehicle_id && !user) {
        alert("Please login first");
        setScanned(true);
        // VALID LOGIN QR CODE BUT ALREADY LOGIN
      } else if (json.identifier && user) {
        alert("Already login");
        setScanned(true);
        // NOT VALID QR CODE
      } else {
        alert("QR code not valid");
        setScanned(true);
      }
    } catch (e) {
      setIsLoading(false);
      setScanned(true);
      alert("Sorry, can't read the QR code or QR code not valid.");
      console.log("SCAN ERROR: ", e);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.cameraPermission}>
        <AppText style={{ textAlign: "center" }}>
          Requesting for camera permission
        </AppText>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.cameraPermission}>
        <AppText
          style={{ textAlign: "center" }}
        >{`Accept Camera Permission\n and try again.`}</AppText>
      </View>
    );
  }

  return (
    <>
      <Screen style={styles.screen}>
        <View style={styles.container}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            ratio="16:9"
            style={[
              StyleSheet.absoluteFillObject,
              { width: "170%", height: height },
            ]}
          />

          <ViewFinder
            height={250}
            width={250}
            borderLength={50}
            borderRadius={15}
            loading={isLoading}
          />
          {scanned && (
            <Button
              title={"Tap to Scan Again"}
              onPress={() => {
                setScanned(false);
                setIsLoading(false);
              }}
            />
          )}
        </View>
        {isLoading && (
          <Toast
            data={qrData}
            scanned={scanned}
            showToast={isLoading}
            setScanned={setScanned}
            userData={userData}
          />
        )}
      </Screen>

      {/* Toast Modal */}
      <ScanToastModal
        isModalVisible={isModalVisible}
        setModalVisible={setModalVisible}
        method={method}
        onSubmit={onSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: defaultStyle.colors.black },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "60%",
    height: "30%",
    borderColor: defaultStyle.colors.white,
    borderWidth: 10,
    borderRadius: 25,
    position: "absolute",
  },

  cameraPermission: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ScanScreen;
