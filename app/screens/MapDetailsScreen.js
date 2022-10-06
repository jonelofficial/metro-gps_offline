import React, { useContext, useEffect, useRef, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { StyleSheet, View, Button } from "react-native";
import dayjs from "dayjs";

import { getGasStation } from "../api/GasStationApi";
import AppText from "../components/AppText";
import AuthContext from "../auth/context";
import colors from "../config/colors";
import Screen from "../components/Screen";

function MapDetailsScreen({ route }) {
  const [loading, setLoading] = useState(true);
  const [markerData, setMarkerData] = useState();
  const [gasData, setGasData] = useState();
  const [gasStation, setGasStation] = useState([]);
  const [points, setPoints] = useState();

  const map = useRef();

  const { token } = useContext(AuthContext);
  const { item } = route.params;

  const latlong = item.locations;

  useEffect(() => {
    fetchGasStation();
    setPoints(item.points);
  }, []);

  const fetchGasStation = async () => {
    try {
      setGasStation([]);
      const gasRes = await getGasStation(token);
      setGasStation(
        gasRes.data.map((item) => {
          return { label: item.label, value: item._id };
        })
      );
    } catch (error) {
      alert("FETCH GAS ERROR: ", error);
    }
  };

  const handleMapReady = () => {
    fitMap();
    setLoading(false);
  };

  const fitMap = () => {
    map.current.fitToCoordinates(
      latlong.map((item) => {
        return {
          latitude: item.lat,
          longitude: item.long,
        };
      }),
      {
        edgePadding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        },
      }
    );
  };

  return (
    <Screen>
      <View style={{ height: "50%" }}>
        <MapView
          ref={map}
          style={styles.map}
          loadingEnabled={loading}
          loadingIndicatorColor={colors.primary}
          onMapReady={handleMapReady}
        >
          {points && (
            <Polyline
              coordinates={points}
              strokeColor={colors.line}
              strokeWidth={3}
            />
          )}

          {latlong.map((item, i) => {
            const markerID = i + 1;
            return (
              <Marker
                key={i}
                coordinate={{
                  latitude: item.lat,
                  longitude: item.long,
                }}
                pinColor={
                  item.status === "left" ? colors.danger : colors.success
                }
                onPress={() => {
                  setGasData(null);
                  setMarkerData({ ...item, index: i });
                }}
                title={markerID.toString()}
              ></Marker>
            );
          })}

          {item.diesels.length >= 1 &&
            item.diesels.map((gasItem, i) => {
              return (
                <Marker
                  key={i}
                  coordinate={{
                    latitude: gasItem.lat,
                    longitude: gasItem.long,
                  }}
                  pinColor={colors.primary}
                  onPress={() => {
                    setMarkerData(null);
                    setGasData(gasItem);
                  }}
                ></Marker>
              );
            })}
        </MapView>
        {markerData || gasData ? (
          <View style={styles.dragWrapper}>
            <Button
              title="Back to Trip Details"
              onPress={() => {
                setMarkerData(null);
                setGasData(null);
              }}
            />
          </View>
        ) : undefined}

        {
          /* Checking if the `odometer_done` attribute is unsave. */
          (item?.odometer_done < 0 || item?.odometer_done === null) && (
            <View style={styles.unFinishTransac}>
              <AppText
                style={{
                  color: colors.danger,
                }}
              >
                This trip is not done. Please report the reason
              </AppText>
              <AppText
                style={{
                  color: colors.danger,
                }}
              >
                for this to your supervisor.
              </AppText>
            </View>
          )
        }
      </View>

      {/*
       *
       * START OF DETAILS
       *
       */}
      <View style={{ height: "50%" }}>
        {/*
         *
         * LEGEND DETAILS
         *
         */}
        <View style={styles.legendWrapper}>
          <AppText>Legend:</AppText>
          <View style={{ flexDirection: "row" }}>
            <View style={styles.leftWrapper}>
              <AppText style={styles.legendText}>LEFT</AppText>
            </View>
            {latlong.length > 1 && (
              <View style={styles.arrivedWrapper}>
                <AppText style={styles.legendText}>ARRIVED</AppText>
              </View>
            )}
            {item.diesels.length >= 1 && (
              <View style={styles.gasWrapper}>
                <AppText style={styles.legendText}>GAS</AppText>
              </View>
            )}
            {points && (
              <View style={styles.lineWrapper}>
                <AppText style={styles.legendText}>ROUTE</AppText>
              </View>
            )}
          </View>
        </View>

        {/*
         *
         * TRIP DETAILS
         *
         */}
        <View>
          <View
            style={{
              backgroundColor: colors.light,
              height: "90%",
              margin: 10,
              padding: 10,
              borderRadius: 10,
            }}
          >
            {!markerData && !gasData ? (
              <>
                {item.trip_type === "delivery" ||
                item.trip_type === "hauling" ? undefined : (
                  <AppText
                    style={{
                      textTransform: "capitalize",
                    }}
                  >
                    Trip Type:{" "}
                    {item.trip_type === "feeds_delivery"
                      ? "feeds delivery"
                      : item.trip_type}
                  </AppText>
                )}
                <AppText>
                  Trip Date:{" "}
                  {dayjs(item.trip_date).format("YYYY-MM-DD | hh:mm A")}
                </AppText>
                {item.trip_type === "hauling" ? undefined : (
                  <AppText>Total Location: {latlong.length}</AppText>
                )}
                <AppText>Total Gas: {item.diesels.length}</AppText>
                <AppText>Odometer Out: {item.odometer}</AppText>
                <AppText>Odometer Done: {item.odometer_done}</AppText>
                <AppText>Companion: {item.companion}</AppText>
              </>
            ) : !gasData ? (
              <>
                {/*
                 *
                 * MARKER DETAILS
                 *
                 */}
                <AppText style={{ textTransform: "capitalize" }}>{`${
                  markerData.status
                } Date: ${dayjs(markerData.date).format(
                  "YYYY-MM-DD | hh:mm A"
                )}`}</AppText>
                <AppText>
                  Location:{" "}
                  {markerData.address[0]?.city
                    ? markerData.address[0].city
                    : "Unknown"}
                </AppText>
              </>
            ) : (
              <>
                {/*
                 *
                 * GAS DETAILS
                 *
                 */}
                <AppText style={{ textTransform: "capitalize" }}>
                  Date:{" "}
                  {dayjs(gasData.createdAt).format("YYYY-MM-DD | hh:mm A")}
                </AppText>
                <AppText>
                  Gas Station:
                  {gasStation.map((item) => {
                    return item.value === gasData.gas_station;
                  })}
                </AppText>
                <AppText>Liter: {gasData.liter}</AppText>
                <AppText>Odometer: {gasData.odometer}</AppText>
              </>
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  legendWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  leftWrapper: {
    backgroundColor: colors.danger,
    padding: 5,
    borderRadius: 5,
    margin: 2.5,
  },
  arrivedWrapper: {
    backgroundColor: colors.success,
    padding: 5,
    borderRadius: 5,
    margin: 2.5,
  },
  gasWrapper: {
    backgroundColor: colors.primary,
    padding: 5,
    borderRadius: 5,
    margin: 2.5,
  },
  lineWrapper: {
    backgroundColor: colors.line,
    padding: 5,
    borderRadius: 5,
    margin: 2.5,
  },
  legendText: { color: colors.white, fontSize: 12 },
  unFinishTransac: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    width: "100%",
    alignItems: "center",
    padding: 15,
  },
  dragWrapper: {
    width: "100%",
    position: "absolute",
    alignItems: "center",
    bottom: 0,
  },
});
export default MapDetailsScreen;
