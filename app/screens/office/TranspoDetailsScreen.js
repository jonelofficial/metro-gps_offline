import React, { useContext, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  Image,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import getPathLength from "geolib/es/getPathLength";

import { transpoDetailsSchema } from "../../config/schema";
import { createTrip, getVehicleTrip } from "../../api/office/TripApi";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import AppFormField from "../../components/forms/AppFormField";
import ActivityIndicator from "../../components/indicator/ActivityIndicator";
import AuthContext from "../../auth/context";
import colors from "../../config/colors";
import fonts from "../../config/fonts";
import SubmitButton from "../../components/forms/SubmitButton";
import Screen from "../../components/Screen";
import Spacer from "../../components/Spacer";
import routes from "../../navigation/routes";
import Scanner from "../../components/Scanner";
import {
  deleteFromTable,
  insertToTable,
  selectTable,
} from "../../utility/sqlite";
import useLocation from "../../hooks/useLocation";

function TranspoDetailsScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [odometer, setOdometer] = useState();
  const [estimatedOdo, setEstimatedOdo] = useState();

  // SCANNER
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companion, setCompanion] = useState([]);
  const [others, setOthers] = useState([]);
  const [isCompanion, setIsCompanion] = useState(false);
  const [isOthers, setIsOthers] = useState(false);

  //
  const {
    user,
    token,
    setOfflineTrips,
    offlineTrips,
    noInternet,
    currentLocation,
  } = useContext(AuthContext);

  useEffect(() => {
    if (route.params?.image) {
      clearErrors("odometer_image_path");
      setValue("odometer_image_path", route.params.image);
      setImageUri(route.params.image.uri);
    } else if (route.params?.params.vehicle_id) {
      (async () => {
        const vehicleTrip = await getVehicleTrip(
          route.params.params.vehicle_id.id,
          token
        );
        setOdometer(vehicleTrip);
        if (vehicleTrip.data?.points) {
          const meter = getPathLength(vehicleTrip.data?.points);
          const km = meter / 1000;

          setEstimatedOdo(
            parseFloat(km.toFixed(1)) + vehicleTrip.data?.odometer
          );
        }
        setLoading(false);
      })();

      setVehicleInfo(route.params.params.vehicle_id);
    }
  }, [route.params]);

  useEffect(() => {
    if (odometer?.data) {
      clearErrors("odometer");
      setValue("odometer", estimatedOdo);
    }
  }, [estimatedOdo]);

  const methods = useForm({
    resolver: yupResolver(transpoDetailsSchema),
    mode: "onTouched",
  });

  const {
    formState: { errors },
    control,
    clearErrors,
    setValue,
    reset,
  } = methods;

  const onSubmit = async (data) => {
    try {
      Keyboard.dismiss();
      setLoading(true);
      const pointObj = [
        {
          latitude: await currentLocation.latitude,
          longitude: await currentLocation.longitude,
        },
      ];

      // const form = new FormData();
      // form.append("image", {
      //   name: new Date() + "_odometer",
      //   uri: data.odometer_image_path?.uri,
      //   type: "image/jpg",
      // });
      // form.append("vehicle_id", vehicleInfo.id);
      // form.append("odometer", data.odometer);
      // form.append("companion", JSON.stringify(companion));
      // form.append("points", JSON.stringify(pointObj));
      // form.append("others", data.others);

      await insertToTable(
        "INSERT INTO offline_trip (vehicle_id, odometer, image, companion, points, others, locations, gas) values (?,?,?,?,?,?,?,?)",
        [
          vehicleInfo.id,
          data.odometer,
          JSON.stringify({
            name: new Date() + "_odometer",
            uri: data.odometer_image_path?.uri,
            type: "image/jpg",
          }),
          JSON.stringify(companion),
          JSON.stringify(pointObj),
          data.others,
          JSON.stringify([]),
          JSON.stringify([]),
        ]
      );

      setImageUri(null);
      setLoading(false);

      reset();

      navigation.navigate(routes.MAP);
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert(`ERROR: ${error}`);
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    try {
      if (isCompanion) {
        setIsCompanion(true);
        setIsLoading(true);
        const json = await JSON.parse(data);

        if (json.first_name) {
          const firstName = json.first_name;
          setCompanion((prevState) => [...prevState, { firstName: firstName }]);
        } else {
          alert("QR code not valid. Use ID QR code");
        }
        setIsCompanion(false);
        setIsLoading(false);
      } else {
        setIsOthers(true);
        setIsLoading(true);
        const json = await JSON.parse(data);
        if (json.first_name) {
          const firstName = json.first_name;
          setOthers((prevState) => [...prevState, { firstName: firstName }]);
        } else {
          alert("QR code not valid. Use ID QR code");
        }
        setIsOthers(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.log("ERROR SCANNER: ", error);
      setIsLoading(false);
      setScanned(true);
      alert("Invalid QR code. Please use ID qr code");
    }
  };
  const handleCompanionDelete = (i) => {
    companion.splice(i, 1);
  };
  const handleOthersDelete = (i) => {
    others.splice(i, 1);
  };
  return (
    <>
      <KeyboardAwareScrollView>
        <Screen style={styles.screen}>
          <FormProvider {...methods} onSubmit={onSubmit}>
            <View style={styles.carDetails}>
              <AppText>
                Vehicle Plate : {vehicleInfo && vehicleInfo.title.split(" ")[0]}
              </AppText>
            </View>
            <View
              style={{
                justifyContent: "flex-start",
              }}
            >
              {odometer?.data && (
                <AppText
                  style={{
                    color: colors.lightMedium,
                    fontSize: 13,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  If the autofill does not match the actual odometer, please
                  edit based on the actual odometer.
                </AppText>
              )}

              <AppText style={styles.formLabel}>Odometer: </AppText>
            </View>
            <AppFormField
              containerStyle={{ backgroundColor: colors.primary }}
              style={{ color: colors.white }}
              name="odometer"
              placeholder="Input current odometer"
              keyboardType="numeric"
              defaultValue={estimatedOdo ? `${estimatedOdo}` : null}
              // defaultValue={odometer?.data ? `${odometer.data.odometer}` : null}
              // disabled={odometer?.data ? false : true}
            />
            <Spacer />
            <AppText style={styles.formLabel}>Odometer Picture:</AppText>
            <View style={{ display: "none" }}>
              <Controller
                name="odometer_image_path"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <>
                    <AppTextInput
                    // onChangeText={onChange}
                    // value={value}
                    />
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.image}
                      value={value}
                    />
                  </>
                )}
              />
            </View>

            <View style={styles.imageWrapper}>
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.image} />
              )}

              <TouchableOpacity
                style={styles.iconWrapper}
                onPress={() => navigation.navigate("AppCamera")}
              >
                <Ionicons
                  name={
                    route.params?.image ? "ios-camera-reverse" : "ios-camera"
                  }
                  size={40}
                />
              </TouchableOpacity>
            </View>
            {errors.odometer_image_path && (
              <AppText style={styles.error}>
                {errors.odometer_image_path.message}
              </AppText>
            )}

            <Spacer />

            <AppText style={styles.formLabel}>Companion:</AppText>
            {companion.map((item, i) => {
              return (
                <View key={i} style={{ marginBottom: 5, flexDirection: "row" }}>
                  <AppText
                    style={{
                      fontSize: 16,
                      textTransform: "capitalize",
                      marginRight: 10,
                    }}
                  >
                    {item.firstName}
                  </AppText>
                  <TouchableOpacity onPress={() => handleCompanionDelete(i)}>
                    <Ionicons
                      name={"close-circle"}
                      size={20}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity onPress={() => setIsCompanion(true)}>
              <AppText style={styles.link}>Add Companion</AppText>
            </TouchableOpacity>

            <Spacer />

            <AppText style={styles.formLabel}>Others:</AppText>
            <AppFormField
              containerStyle={{
                backgroundColor: colors.primary,
              }}
              style={{ textAlignVertical: "top", color: colors.white }}
              name="others"
              placeholder="Input others companion"
              maxLength={255}
              numberOfLines={2}
              multiline
            />
            {/* {others.map((item, i) => {
              return (
                <View key={i} style={{ marginBottom: 5, flexDirection: "row" }}>
                  <AppText
                    style={{
                      fontSize: 16,
                      textTransform: "capitalize",
                      marginRight: 10,
                    }}
                  >
                    {item.firstName}
                  </AppText>
                  <TouchableOpacity onPress={() => handleOthersDelete(i)}>
                    <Ionicons
                      name={"close-circle"}
                      size={20}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity onPress={() => setIsOthers(true)}>
              <AppText style={styles.link}>Add Others Companion</AppText>
            </TouchableOpacity> */}

            <Spacer />
            <SubmitButton
              title={user.trip_template === "office" ? "Drive" : "Next"}
              color={noInternet ? "light" : "success"}
              disabled={noInternet}
            />
          </FormProvider>
        </Screen>
      </KeyboardAwareScrollView>
      {loading === true && (
        <View style={styles.container}>
          <ActivityIndicator visible={true} />
        </View>
      )}
      {(isCompanion || isOthers) && (
        <View style={styles.container}>
          <Scanner
            handleBarCodeScanned={handleBarCodeScanned}
            scanned={scanned}
            setScanned={setScanned}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            navigation={setIsCompanion}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  formLabel: {
    marginBottom: 6,
  },
  screen: {
    margin: 15,
  },
  iconWrapper: {
    backgroundColor: colors.light,
    padding: 10,
    height: 60,
    width: 60,
    borderRadius: 10,
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 10,
  },
  imageWrapper: {
    flexDirection: "row",
  },
  carDetails: {
    padding: 30,
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: 15,
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.primaryName,
    fontSize: 15,
    paddingTop: 10,
  },
  container: {
    position: "absolute",
    backgroundColor: "white",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  link: {
    fontWeight: "normal",
    fontSize: 14,
    color: colors.primary,
  },
});

export default TranspoDetailsScreen;
