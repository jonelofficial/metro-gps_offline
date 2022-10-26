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

function TranspoDetailsScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [odometer, setOdometer] = useState();
  const { user, token, setOfflineTrips, offlineTrips, noInternet } =
    useContext(AuthContext);

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
      })();

      setVehicleInfo(route.params.params.vehicle_id);
    }
  }, [route.params]);

  useEffect(() => {
    if (odometer?.data) {
      clearErrors("odometer");
      setValue("odometer", odometer.data.odometer);
    }
  }, [odometer]);

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
      let tripData;

      const form = new FormData();
      // form.append("image", {
      //   name: new Date() + "_odometer",
      //   uri: data.odometer_image_path?.uri,
      //   type: "image/jpg",
      // });
      form.append("vehicle_id", vehicleInfo.id);
      form.append("odometer", data.odometer);
      form.append("companion", data.companion);

      if (noInternet) {
        const newObj = {
          id: offlineTrips.trips.length,
          image_path: data.odometer_image_path.uri,
          vehicle_id: vehicleInfo.id,
          odometer: data.odometer,
          companion: data.companion,
        };
        setOfflineTrips((prevState) => ({
          ...prevState,
          trips: [...prevState.trips, newObj],
        }));
      } else {
        const res = await createTrip(form, token);
        tripData = res.data;
        if (!res) {
          setLoading(false);
          return alert("No server response. Please try Again");
        }
      }

      setImageUri(null);
      setLoading(false);

      reset();
      noInternet
        ? navigation.navigate(routes.MAP)
        : navigation.navigate(routes.MAP, {
            trip: tripData,
          });
    } catch (error) {
      setLoading(false);
      alert(`ERROR: ${error}`);
    }
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
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <AppText style={styles.formLabel}>Odometer: </AppText>
              <AppText
                style={{
                  color: colors.lightMedium,
                  fontSize: 13,
                  width: "60%",
                }}
              >
                {odometer?.data
                  ? `Auto fill if not match on actual odometer report to immediate supervisor`
                  : null}
              </AppText>
            </View>
            <AppFormField
              containerStyle={{ backgroundColor: colors.primary }}
              style={{ color: colors.white }}
              name="odometer"
              placeholder="Input current odometer"
              keyboardType="numeric"
              defaultValue={odometer?.data ? `${odometer.data.odometer}` : null}
              disabled={odometer?.data ? false : true}
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
            <AppFormField
              containerStyle={{ backgroundColor: colors.primary }}
              style={{ textAlignVertical: "top", color: colors.white }}
              name="companion"
              placeholder="Input companion"
              maxLength={255}
              numberOfLines={4}
              multiline
            />
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
});

export default TranspoDetailsScreen;
