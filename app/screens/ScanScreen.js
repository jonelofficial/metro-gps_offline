import React, { useContext, useEffect, useState } from "react";
import { Button, StyleSheet, View, Dimensions } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import ViewFinder from "react-native-view-finder";

import { useLogin } from "../api/LoginApi";
import { vehicleIdSchema } from "../config/schema";
import { getVehicle } from "../api/VehicleApi";
import { BASEURL } from "@env";
import AppText from "../components/AppText";
import AuthContext from "../auth/context";
import defaultStyle from "../config/styles";
import Screen from "../components/Screen";
import Toast from "../components/toast/Toast";

function ScanScreen() {
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
  const { user, token, offlineVehicles, noInternet, offScan } =
    useContext(AuthContext);
  const { height, width } = Dimensions.get("screen");

  const method = useForm({
    resolver: yupResolver(vehicleIdSchema),
    mode: "onSubmit",
  });

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

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

        if (noInternet) {
          let isVehicle;
          let index;
          offlineVehicles.map((item, i) => {
            if (item.plate_no === json.vehicle_id.toUpperCase()) {
              isVehicle = true;
              index = i;
            }
            return null;
          });

          if (isVehicle) {
            setQrData({
              vehicle_id: offlineVehicles[index].plate_no,
              title: `${offlineVehicles[index].plate_no} ${offlineVehicles[index].brand}`,
              description: offlineVehicles[index].vehicle_type,
              targetScreen: "for validation only",
              profile: offlineVehicles[index].profile || null,
              id: offlineVehicles[index]._id,
            });
            setScanned(true);
          } else {
            setIsLoading(false);
            alert("No vehicle found");
          }
        } else {
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
            description: vehicleRes.data[0].vehicle_type,
            targetScreen: "for validation only",
            profile: vehicleRes.data[0].profile || null,
            id: vehicleRes.data[0]._id,
          });
          setScanned(true);
        }

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
                  ? `${BASEURL}/${loginRes.user.profile}`
                  : undefined,
            });
            setScanned(true);
          }
        } catch (error) {
          setScanned(true);
          alert("No server response");
        }
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
      alert("Sorry, can't read the QR code.\nPlease use manual instead.");
      alert(`SCAN ERROR: ${e}`);
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
          style={{
            textAlign: "center",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >{`Accept Camera permission and try again.`}</AppText>
      </View>
    );
  }
  if (offScan) {
    return (
      <View style={[styles.cameraPermission, { backgroundColor: "black" }]}>
        <ViewFinder
          height={250}
          width={250}
          borderLength={50}
          borderRadius={15}
          loading={isLoading}
        />
        <AppText
          style={{
            textAlign: "center",
            color: "red",
            flexWrap: "wrap",
            alignItems: "flex-start",
            padding: 20,
          }}
        >{`You have an unfinished trip. Please report to your immediate supervisor or resume the transaction.`}</AppText>
      </View>
    );
  }

  return (
    <>
      <Screen style={styles.screen}>
        <View style={[styles.container]}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            ratio="16:9"
            style={[
              StyleSheet.absoluteFillObject,
              {
                width: width * 1.8,
                height: height * 1.1,
              },
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
  },
});

export default ScanScreen;
