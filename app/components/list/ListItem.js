import React, { useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Button } from "react-native";
import dayjs from "dayjs";

import getPathLength from "geolib/es/getPathLength";

import colors from "../../config/colors";
import fonts from "../../config/fonts";
import AppText from "../AppText";
import Fonts from "../Fonts";

function ListItem({ onPress, item, setOffScan, setOffline }) {
  let newMinutes = 0;
  let newHours = 0;
  let newLocations = [];

  item.locations
    .filter(
      (location) => location.status == "left" || location.status == "arrived"
    )
    .map((filteredLocation) => {
      newLocations.push(filteredLocation);
    });

  useEffect(() => {
    if (item.locations.length === 0 || !item.points) return null;
    if (
      item.odometer_done < 0 ||
      newLocations.length % 2 !== 0 ||
      item.odometer_done == null
    ) {
      setOffScan(true);
    }
    item?.offline === true && setOffline(true);
    // console.log("T E S T  :", item);
  }, []);

  newLocations.length % 2 === 0 &&
    newLocations.map((location, index) => {
      if (index % 2 === 0) {
        const date1 = dayjs(newLocations[index + 1].date);
        const date2 = dayjs(location.date);
        const minutes = date1.diff(date2, "minutes");
        const hours = date1.diff(date2, "h");
        newMinutes = newMinutes + minutes;
        newHours = newHours + hours;
      }
    });

  //  Getting KM

  const meter = getPathLength(item.points);
  const km = meter / 1000;

  //  Getting TIME
  const finalHours = newHours * 60;
  const minute = newMinutes - finalHours;

  const hour = `${newHours}.${minute == 0 ? "00" : minute}`;

  const name = dayjs(item.trip_date).format("h:mm A");
  const date = dayjs(item.trip_date).format("MM-DD-YY");

  const handleSync = async () => {
    console.log(item);
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Fonts>
        <View
          style={[
            styles.container,
            {
              backgroundColor:
                item.odometer_done < 0 ||
                newLocations.length % 2 !== 0 ||
                item.odometer_done == null
                  ? colors.danger
                  : item?.offline === true && colors.disablePrimary,
            },
          ]}
        >
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginRight: 10,
              marginVertical: 7,
              padding: 2.5,
              borderWidth: item?.offline === true ? 0 : 1,
              borderRadius: 5,
              borderColor:
                item.odometer_done < 0 ||
                newLocations.length % 2 !== 0 ||
                item.odometer_done == null ||
                item?.offline === true
                  ? colors.light4
                  : colors.success,
            }}
          >
            <AppText
              style={{
                fontSize: 14,
                color:
                  item.odometer_done < 0 ||
                  newLocations.length % 2 !== 0 ||
                  item.odometer_done == null ||
                  item?.offline === true
                    ? colors.light4
                    : colors.success,
                marginHorizontal: 5,
                display: item?.offline === true ? "none" : "flex",
              }}
            >{`#${
              item._id.length > 20 ? item._id.slice(20) : item._id
            }`}</AppText>
            <View
              style={{
                justifyContent: "center",
                display: item?.offline ? "flex" : "none",
              }}
            >
              <Button title="add" color={colors.success} onPress={handleSync} />
            </View>
          </View>
          {/*  */}
          <View style={styles.kmDetails}>
            <AppText
              style={[
                styles.km,
                {
                  color:
                    (item.odometer_done < 0 ||
                      newLocations.length % 2 !== 0 ||
                      item.odometer_done == null ||
                      item?.offline === true) &&
                    colors.light4,
                },
              ]}
            >
              {meter < 1000 ? meter : km.toFixed(1)} {meter < 1000 ? "m" : "km"}
            </AppText>
            <View style={styles.hrWrapper}>
              <AppText style={[styles.kmph]}>
                {/* {hours === 0 ? minute : hour} */}
                {newHours == 0 ? minute : hour}
              </AppText>
              <AppText
                style={[
                  styles.hr,
                  {
                    color:
                      (item.odometer_done < 0 ||
                        newLocations.length % 2 !== 0 ||
                        item.odometer_done == null ||
                        item?.offline === true) &&
                      colors.light4,
                  },
                ]}
              >
                {/* /{hours >= 2 ? "hours." : hours === 0 ? "" : "hour."} */}/
                {newHours >= 2 ? "hours." : newHours == 0 ? "" : "hour."}
                {minute > 1 ? "minutes" : "minute"}
              </AppText>
            </View>
          </View>
          {/*  */}

          {/*  */}
          <View style={styles.detailsContainer}>
            <AppText
              style={[
                styles.name,
                {
                  color:
                    (item.odometer_done < 0 ||
                      newLocations.length % 2 !== 0 ||
                      item.odometer_done == null ||
                      item?.offline === true) &&
                    colors.light4,
                },
              ]}
            >
              {name}
            </AppText>
            <AppText
              style={[
                styles.date,
                {
                  color:
                    (item.odometer_done < 0 ||
                      newLocations.length % 2 !== 0 ||
                      item.odometer_done == null ||
                      item?.offline === true) &&
                    colors.light4,
                },
              ]}
            >
              {date}
            </AppText>
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
    position: "relative",
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
