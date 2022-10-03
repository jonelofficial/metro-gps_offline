import { yupResolver } from "@hookform/resolvers/yup";
import React, { useContext, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, View } from "react-native";

import { createHauling } from "../api/HaulingApi";
import { createTrip, updateTrip } from "../api/TripApi";
import { haulingSchema } from "../config/schema";
import { getFarm } from "../api/FarmApi";
import { uploadImage } from "../api/UploadImage";
import AuthContext from "../auth/context";
import ActivityIndicator from "../components/ActivityIndicator";
import AppText from "../components/AppText";
import AppFormField from "../components/forms/AppFormField";
import AppFormPicker from "../components/forms/AppFormPicker";
import colors from "../config/colors";
import SubmitButton from "../components/forms/SubmitButton";
import Screen from "../components/Screen";
import Spacer from "../components/Spacer";
import routes from "../navigation/routes";

function HaulingScreen({ route, navigation }) {
  const { token, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState();
  const [vehicleInfo, setVehicleInfo] = useState();
  // Trip Type Picker
  const [tripTypeOpen, setTripTypeOpen] = useState(false);
  const [tripValue, setTripValue] = useState(null);
  const [tripType, setTripType] = useState([
    { label: "Poultry", value: "Poultry" },
    { label: "Hogs", value: "Hogs" },
  ]);
  // Hog Farms
  const [hogFarmOpen, setHogFarmOpen] = useState(false);
  const [hogFarmValue, setHogFarmValue] = useState(null);
  const [hogFarmItems, setHogFarmItems] = useState([]);
  // Poultry Farms
  const [poultryFarmOpen, setPoultryFarmOpen] = useState(false);
  const [poultryFarmValue, setPoultryFarmValue] = useState(null);
  const [poultryFarmItems, setPoultryFarmItems] = useState([]);
  // Dummy Farms
  const [farmOpen, setFarmOpen] = useState(false);
  const [farmValue, setFarmValue] = useState(null);
  const [farmItems, setFarmItems] = useState([]);
  // FORM
  const method = useForm({
    resolver: yupResolver(haulingSchema),
    method: "onTouched",
  });

  const { reset } = method;

  useEffect(() => {
    (async () => {
      try {
        setHogFarmItems([]);
        setPoultryFarmItems([]);
        const farmRes = await getFarm(token);

        // FILTER HOGS
        await farmRes.data
          .filter((item) => item.attributes.trip_type === "hogs")
          .map((filteredFarm) => {
            setHogFarmItems((currentValue) => [
              ...currentValue,
              {
                label: filteredFarm.attributes.farm,
                value: filteredFarm.attributes.farm,
              },
            ]);
          });

        // FILTER POULTRY
        await farmRes.data
          .filter((item) => item.attributes.trip_type === "poultry")
          .map((filteredFarm) => {
            setPoultryFarmItems((currentValue) => [
              ...currentValue,
              {
                label: filteredFarm.attributes.farm,
                value: filteredFarm.attributes.farm,
              },
            ]);
          });

        setFormData(route.params.trip);
        setVehicleInfo(route.params.vehicle);
        setLoading(false);
      } catch (error) {
        alert("ERROR GET FARM: Please try again. ", error);
      }
    })();
  }, []);

  useEffect(() => {
    setFarmOpen(false);
    setHogFarmOpen(false);
    setPoultryFarmOpen(false);
  }, [tripValue]);

  const handleOnSubmit = async (data) => {
    try {
      setLoading(true);
      Keyboard.dismiss();
      const tripObj = await handleUploadImage();
      const delObjt = await handlePostHauling(data, tripObj.data.id);
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
  const handlePostHauling = async (obj, tripId) => {
    const haulObj = { data: { ...obj, trip_id: tripId } };
    const haulRes = await createHauling(haulObj, token);
    if (haulRes) {
      return haulRes;
    } else {
      setLoading(false);
      return alert("ERROR POST HAULING: Server unreachable. Please try again");
    }
  };

  // 3
  const handleUpdateTrip = async (id, tripId) => {
    const updateTripObjt = { data: { hauling: id } };

    const updateRes = await updateTrip(tripId, updateTripObjt, token);
    if (updateRes) {
      reset();
      route.params.reset();
      route.params.setImageUri(null);
      navigation.navigate(
        routes.MAP,
        // "HaulingMap",
        {
          trip: updateRes.data,
          setLoading: setLoading(false),
        }
      );
    } else {
      setLoading(false);
      return alert("ERROR UPDATE TRIP: Server unreachable. Please try again");
    }
  };

  return (
    <>
      <Screen style={styles.screen}>
        <FormProvider {...method} onSubmit={handleOnSubmit}>
          <AppText>Trip number:</AppText>
          <AppFormField
            name="trip_number"
            placeholder="Input trip number"
            keyboardType="numeric"
          />

          <Spacer />

          <AppText>Trip type:</AppText>
          {!loading && (
            <View
              style={{
                position: "relative",
                zIndex: loading ? undefined : 20,
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
          )}

          <Spacer />

          <View style={{ alignItems: "center", flexDirection: "row" }}>
            <AppText>Farm:</AppText>
            {tripValue === null && (
              <AppText
                style={{
                  fontSize: 13,
                  color: colors.danger,
                }}
              >{` (select an item on trip type to show farm list)`}</AppText>
            )}
          </View>
          {!loading &&
            (hogFarmItems.length >= 0 || poultryFarmItems.length >= 0) && (
              <View
                style={{
                  position: "relative",
                  zIndex: loading ? undefined : 10,
                }}
              >
                <AppFormPicker
                  name="farm"
                  items={
                    tripValue === "Hogs"
                      ? hogFarmItems
                      : tripValue === "Poultry"
                      ? poultryFarmItems
                      : farmItems
                  }
                  value={
                    tripValue === "Hogs"
                      ? hogFarmValue
                      : tripValue === "Poultry"
                      ? poultryFarmValue
                      : farmValue
                  }
                  setValue={
                    tripValue === "Hogs"
                      ? setHogFarmValue
                      : tripValue === "Poultry"
                      ? setPoultryFarmValue
                      : setFarmValue
                  }
                  open={
                    tripValue === "Hogs"
                      ? hogFarmOpen
                      : tripValue === "Poultry"
                      ? poultryFarmOpen
                      : farmOpen
                  }
                  setOpen={
                    tripValue === "Hogs"
                      ? setHogFarmOpen
                      : tripValue === "Poultry"
                      ? setPoultryFarmOpen
                      : setFarmOpen
                  }
                />
              </View>
            )}

          <Spacer />

          <AppText>Tare weight:</AppText>
          <AppFormField
            name="tare_weight"
            placeholder="Input tare weight"
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
    width: "100%",
    bottom: 0,
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

export default HaulingScreen;
