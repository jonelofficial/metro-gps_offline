import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

import { findTrip } from "../api/TripApi";
import defaultStyle from "../config/styles";
import Fonts from "./Fonts";
import fonts from "../config/fonts";

function SearchBar({
  text,
  setText,
  setData,
  setTrips,
  token,
  fetchTrip,
  setNoData,
  loading,
  setLoading,
  page,
  setTripDate,
}) {
  const [datePicker, setDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const onDateSelected = async (event, value) => {
    setLoading(true);
    setDatePicker(false);
    setNoData(false);

    if (event.type === "dismissed") return fetchTrip();

    const trip_date = dayjs(value).format("YYYY-MM-DD");
    const displayDate = dayjs(value).format("MM-DD-YY");
    const res = await findTrip(token, trip_date, page);
    if (res) {
      setTrips(res.data);
      setData(res.data.length);

      setDate(value);
      setText(displayDate);
      setTripDate(trip_date);
      // setText(trip_date);
      return setLoading(false);
    }
    alert("No server response");
    setLoading(false);
  };
  const showDatePicker = () => {
    setDatePicker(true);
  };
  const handleClear = () => {
    setText(null);
    fetchTrip();
  };
  return (
    <>
      <View style={styles.container}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="ios-search"
            style={styles.searchIcon}
            size={20}
            color={defaultStyle.colors.medium}
          />
          <Fonts style={styles.inputWrapper}>
            <TextInput
              style={[defaultStyle.text, styles.input]}
              placeholder={
                loading ? "Loading..." : "Click the calendar to search..."
              }
              placeholderTextColor={defaultStyle.colors.light3}
              // onChangeText={setText}
              value={text}
              editable={false}
            />
          </Fonts>
        </View>

        {text ? (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="ios-close-outline" size={20} style={styles.close} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={showDatePicker}>
            <Ionicons
              name="ios-calendar-sharp"
              style={styles.dateIcon}
              size={20}
              color={defaultStyle.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {datePicker && (
        <DateTimePicker
          value={date}
          mode={"date"}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          is24Hour={true}
          onChange={onDateSelected}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 15,
    backgroundColor: defaultStyle.colors.light,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputWrapper: {
    overflow: "hidden",
    width: "85%",
    alignItems: "center",
  },
  input: {
    fontFamily: fonts.primaryName,
  },
  searchIcon: {
    marginRight: 10,
    marginTop: -2,
  },
});

export default SearchBar;
