import {
  Alert,
  BackHandler,
  Button,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Screen from "./Screen";
import defaultStyle from "../config/styles";
import { BarCodeScanner } from "expo-barcode-scanner";
import ViewFinder from "react-native-view-finder";
import AppText from "./AppText";

const Scanner = ({
  handleBarCodeScanned,
  scanned,
  setScanned,
  isLoading,
  setIsLoading,
  navigation,
}) => {
  const { height, width } = Dimensions.get("screen");
  const [hasPermission, setHasPermission] = useState(null);

  const backAction = () => {
    Alert.alert("Hold on!", "Are you sure you want to go back?", [
      {
        text: "Cancel",
        onPress: () => null,
        style: "cancel",
      },
      {
        text: "YES",
        onPress: () => navigation(false),
      },
    ]);
    return true;
  };

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    // HANDLE BACK
    BackHandler.addEventListener("hardwareBackPress", backAction);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, []);

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
        >
          Accept Camera permission and try again
        </AppText>
      </View>
    );
  }

  return (
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
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: defaultStyle.colors.black },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPermission: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
});

export default Scanner;
