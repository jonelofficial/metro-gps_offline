import { yupResolver } from "@hookform/resolvers/yup";
import React, { useContext, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, View, LogBox } from "react-native";

import { bagsSchema } from "../config/schema";
import { createFeedsDelivery } from "../api/FeedsDeliveryApi";
import { createTrip, updateTrip } from "../api/TripApi";
import { uploadImage } from "../api/UploadImage";
import AuthContext from "../auth/context";
import ActivityIndicator from "../components/ActivityIndicator";
import AppText from "../components/AppText";
import AppFormField from "../components/forms/AppFormField";
import SubmitButton from "../components/forms/SubmitButton";
import Screen from "../components/Screen";
import Spacer from "../components/Spacer";
import routes from "../navigation/routes";

LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
]);

function FeedsDeliveryScreen({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState();
  const [vehicleInfo, setVehicleInfo] = useState();

  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    setFormData(route.params.trip);
    setVehicleInfo(route.params.vehicle);
    setLoading(false);
  }, []);

  const method = useForm({
    resolver: yupResolver(bagsSchema),
    mode: "onTouched",
  });

  const { reset } = method;

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      Keyboard.dismiss();
      const tripObj = await handleUploadImage();
      const delObjt = await handlePostFeedsDelivery(data, tripObj.data.id);
      await handleUpdateTrip(delObjt.data.id, tripObj.data.id);
    } catch (error) {
      alert("ERROR SERVER: Please try again. ", error);
    }
  };

  // 1
  const handleUploadImage = async () => {
    const form = new FormData();
    form.append("files", {
      uri: formData.odometer_image_path.uri,
      name: formData.odometer_image_path.filename,
      type: `image/${formData.odometer_image_path.mediaType}`,
    });

    const res = await uploadImage(form, token);
    if (res) {
      const trip = {
        data: {
          trip_date: Date.now(),
          trip_type: user.user.trip_template,
          user_id: user.user.id,
          vehicle_id: vehicleInfo.id,
          odometer: formData.odometer,
          odometer_image_path: `${res[0].url}`,
          companion: formData.companion,
        },
      };
      return await handlePostTrip(trip);
    } else {
      setLoading(false);
      return alert("ERROR UPLOAD IMAGE: Server unreachable. Please try again");
    }
  };

  const handlePostTrip = async (trip) => {
    const createRes = await createTrip(trip, token);
    if (createRes) {
      return createRes;
    } else {
      setLoading(false);
      return alert("ERROR POST TRIP: Server unreachable. Please try again");
    }
  };

  // 2
  const handlePostFeedsDelivery = async ({ bags }, trip_id) => {
    const dataObj = { data: { bags: bags, trip_id: trip_id } };
    const feedsRes = await createFeedsDelivery(dataObj, token);
    if (feedsRes) {
      return feedsRes;
    }
    alert("Error: HANDLE POST FEEDS DELIVERY");
  };

  // 3
  const handleUpdateTrip = async (id, tripId) => {
    const updateTripObjt = { data: { feeds_delivery: id } };

    const updateRes = await updateTrip(tripId, updateTripObjt, token);
    if (updateRes) {
      reset();
      route.params.reset();
      route.params.setImageUri(null);
      navigation.navigate(routes.MAP, {
        trip: updateRes.data,
        setLoading: setLoading(false),
      });
    } else {
      setLoading(false);
      return alert("ERROR UPDATE TRIP: Server unreachable. Please try again");
    }
  };

  return (
    <>
      <Screen style={styles.screen}>
        <FormProvider {...method} onSubmit={handleSubmit}>
          <AppText>Total Bags:</AppText>

          <AppFormField
            name="bags"
            placeholder="Input total bags"
            keyboardType="numeric"
          />
          <Spacer />

          <View style={styles.button}>
            <SubmitButton title="Drive" />
          </View>
        </FormProvider>
      </Screen>
      {loading && (
        <View style={styles.container}>
          <ActivityIndicator visible={true} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    margin: 10,
  },
  button: {
    position: "absolute",
    bottom: 0,
    width: "100%",
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

export default FeedsDeliveryScreen;
