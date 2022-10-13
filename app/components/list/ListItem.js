import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import dayjs from "dayjs";
import getPathLength from "geolib/es/getPathLength";

import colors from "../../config/colors";
import fonts from "../../config/fonts";
import AppText from "../AppText";
import Fonts from "../Fonts";

function ListItem({ onPress, item }) {
  if (item.locations.length === 0 || !item.points) return null;

  const arrayLength = item.locations.length - 1;

  //  Getting KM

  const meter = getPathLength(item.points);
  const km = meter / 1000;

  //  Getting TIME

  const date1 = dayjs(item.locations[arrayLength].date);
  const date2 = dayjs(item.locations[0].date);
  const minutes = date1.diff(date2, "minutes");
  const hours = date1.diff(date2, "h");
  const finalHours = hours * 60;
  const minute = minutes - finalHours;
  const hour = `${hours}.${minute === 0 ? "00" : minute}`;

  const name = dayjs(item.trip_date).format("h:mm A");
  const date = dayjs(item.trip_date).format("MM-DD-YY");
  const location = !item.locations[arrayLength].address[0]
    ? "Unknown"
    : item.locations[arrayLength].address[0].city;

  return (
    <TouchableOpacity onPress={onPress}>
      <Fonts>
        <View style={styles.container}>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginRight: 10,
              marginVertical: 7,
              padding: 2.5,
              borderWidth: 1,
              borderRadius: 5,
              borderColor: colors.success,
            }}
          >
            <AppText
              style={{
                fontSize: 14,
                color: colors.success,
                marginHorizontal: 5,
              }}
            >{`#${
              item.user_id.trip_template === "office"
                ? item._id.slice(20)
                : item.user_id.trip_template === "delivery"
                ? item.attributes.delivery?.attributes.booking_number
                : item.user_id.trip_template === "feeds_delivery"
                ? item.attributes.feeds_delivery?.attributes.bags
                : item.user_id.trip_template === "hauling" &&
                  item.attributes.hauling?.attributes.trip_number
            }`}</AppText>
          </View>
          {/*  */}
          <View style={styles.kmDetails}>
            <AppText style={styles.km}>
              {meter < 1000 ? meter : km.toFixed(0)} {meter < 1000 ? "m" : "km"}
            </AppText>
            <View style={styles.hrWrapper}>
              <AppText style={styles.kmph}>
                {hours === 0 ? minute : hour}
              </AppText>
              <AppText style={styles.hr}>
                /{hours >= 2 ? "hours." : hours === 0 ? "" : "hour."}
                {minute > 1 ? "minutes" : "minute"}
              </AppText>
            </View>
          </View>
          {/*  */}
          {/* <View style={styles.locationContainer}>
            <AppText style={styles.location}>{location}</AppText>
          </View> */}

          {/*  */}
          <View style={styles.detailsContainer}>
            <AppText style={styles.name}>{name}</AppText>
            <AppText style={styles.date}>{date}</AppText>
          </View>
        </View>
      </Fonts>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: colors.light,
  },
  name: {
    fontFamily: fonts.primaryName,
    lineHeight: 25,
    textAlign: "right",
    fontSize: 16,
    color: colors.lightMedium,
  },
  date: {
    fontFamily: fonts.primaryName,
    lineHeight: 25,
    textAlign: "right",
    fontSize: 16,
    color: colors.lightMedium,
  },
  location: {
    fontFamily: fonts.primaryName,
    fontSize: 16,
    color: colors.lightMedium,
    lineHeight: 25,
  },
  km: {
    fontFamily: fonts.primaryName,
    textAlign: "left",
    lineHeight: 25,
    color: colors.lightMedium,
  },
  kmph: {
    fontFamily: fonts.primaryName,
    color: colors.primary,
    textAlign: "left",
    fontSize: 20,
    lineHeight: 25,
  },
  hr: {
    fontFamily: fonts.primaryName,
    color: colors.lightMedium,
    fontSize: 16,
    lineHeight: 25,
  },
  hrWrapper: {
    flexDirection: "row",
  },
  kmDetails: { flex: 1 },
  detailsContainer: { flex: 1 },
  locationContainer: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ListItem;
