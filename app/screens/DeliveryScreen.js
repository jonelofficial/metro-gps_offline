import { yupResolver } from "@hookform/resolvers/yup";
import React, { useContext, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, View } from "react-native";

import { createDelivery } from "../api/DeliveryApi";
import { getRoutes } from "../api/RouteApi";
import { deliverySchema } from "../config/schema";
import { createTrip, updateTrip } from "../api/TripApi";
import { uploadImage } from "../api/UploadImage";
import AuthContext from "../auth/context";
import ActivityIndicator from "../components/ActivityIndicator";
import AppText from "../components/AppText";
import AppFormField from "../components/forms/AppFormField";
import AppFormPicker from "../components/forms/AppFormPicker";
import SubmitButton from "../components/forms/SubmitButton";
import Screen from "../components/Screen";
import Spacer from "../components/Spacer";
import routes from "../navigation/routes";

function DeliveryScreen({ route, navigation }) {
  const { token, user } = useContext(AuthContext);
  // Trip Type Picker
  const [tripTypeOpen, setTripTypeOpen] = useState(false);
  const [tripValue, setTripValue] = useState(null);
  const [tripType, setTripType] = useState([
    { label: "Delivery", value: "Delivery" },
    { label: "Service", value: "Service" },
  ]);
  // Route
  const [routeOpen, setRouteOpen] = useState(false);
  const [routeValue, setRouteValue] = useState(null);
  const [routeItems, setRouteItems] = useState([]);
  //
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState();
  const [vehicleInfo, setVehicleInfo] = useState();

  const method = useForm({
    resolver: yupResolver(deliverySchema),
    mode: "onTouched",
  });

  const { reset } = method;

  useEffect(() => {
    (async () => {
      setRouteItems([]);
      const routesRes = await getRoutes(token);
      if (routesRes) {
        setRouteItems(
          routesRes.data.map((item) => {
            return { label: item.attributes.name, value: item.id };
          })
        );
      } else {
        alert("ERROR GET ROUTES: Please try again");
      }
    })();
    setFormData(route.params.trip);
    setVehicleInfo(route.params.vehicle);
    setLoading(false);
  }, []);

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      Keyboard.dismiss();
      const tripObj = await handleUploadImage();
      const delObjt = await handlePostDelivery(data, tripObj.data.id);
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
  const handlePostDelivery = async (objt, tripId) => {
    const delObjt = { data: { ...objt, trip_id: tripId } };
    const delRes = await createDelivery(delObjt, token);
    if (delRes) {
      return delRes;
    }
    setLoading(false);
    return alert("ERROR POST DELIVERY: Server unreachable. Please try again");
  };

  // 3
  const handleUpdateTrip = async (id, tripId) => {
    const updateTripObjt = { data: { delivery: id } };

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
          <AppText>Booking Number:</AppText>
          <AppFormField
            name="booking_number"
            placeholder="Input booking number"
            keyboardType="numeric"
          />

          <Spacer />

          <AppText>Temperature:</AppText>
          <AppFormField
            name="temperature_left"
            placeholder="Input temperature"
            keyboardType="numeric"
          />

          <Spacer />

          <AppText>Routes:</AppText>

          {!loading && (
            <AppFormPicker
              name="route"
              items={routeItems}
              value={routeValue}
              setValue={setRouteValue}
              open={routeOpen}
              setOpen={setRouteOpen}
            />
          )}

          <Spacer />

          <AppText>Trip Type:</AppText>
          <View
            style={{
              position: "relative",
              zIndex: loading ? undefined : 10,
            }}
          >
            <AppFormPicker
              name="trip_type"
              items={tripType}
              value={tripValue}
              setValue={setTripValue}
              open={tripTypeOpen}
              setOpen={setTripTypeOpen}
            />
          </View>

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
    zIndex: 99,
    position: "absolute",
    backgroundColor: "white",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default DeliveryScreen;
