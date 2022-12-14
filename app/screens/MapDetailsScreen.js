import React, { memo, useContext, useEffect, useRef, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { StyleSheet, View, Button } from "react-native";
import dayjs from "dayjs";

import AppText from "../components/AppText";
import AppButton from "../components/AppButton";
import AuthContext from "../auth/context";
import colors from "../config/colors";
import Screen from "../components/Screen";
import routes from "../navigation/routes";

function MapDetailsScreen({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [markerData, setMarkerData] = useState();
  const [gasData, setGasData] = useState();
  const [gasStation, setGasStation] = useState([]);
  const [points, setPoints] = useState();
  const [drag, setDrag] = useState(false);

  const [pinLocation, setPinLocation] = useState([]);

  const map = useRef();

  const { user, offlineGasStations, noInternet } = useContext(AuthContext);
  const { item } = route.params;

  const pin = () => {
    item.locations
      .filter((item) => item.status === "left" || item.status === "arrived")
      .map((filterItem) => {
        setPinLocation((prevState) => [...prevState, filterItem]);
      });
  };

  useEffect(() => {
    fetchGasStation();
    setPoints(item.points);
    pin();
    // console.log("P I N  L O C A T I O N : ", pinLocation);
  }, []);

  const handleResumeTrip = async () => {
    navigation.navigate(routes.MAP, {
      trip: item,
    });
  };

  const fetchGasStation = async () => {
    try {
      setGasStation([]);

      setGasStation(
        offlineGasStations.map((item) => {
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
      pinLocation.map((item) => {
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
        {!noInternet ? (
          <MapView
            ref={map}
            style={styles.map}
            loadingEnabled={loading}
            loadingIndicatorColor={colors.primary}
            onMapReady={handleMapReady}
            onPanDrag={() => setDrag(true)}
          >
            {points && (
              <Polyline
                coordinates={points}
                strokeColor={colors.line}
                strokeWidth={3}
              />
            )}

            {pinLocation.map((item, i) => {
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
        ) : (
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <AppText style={{ color: colors.danger }}>
              Connect to internet to show map
            </AppText>
          </View>
        )}

        {drag && (
          <View
            style={{
              width: "100%",
              position: "absolute",
              alignItems: "center",
              bottom: "50%",
            }}
          >
            <Button
              title="Fit on the map"
              onPress={() => {
                setDrag(false);
                fitMap();
              }}
            />
          </View>
        )}
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
          (item?.odometer_done < 0 ||
            item?.odometer_done === null ||
            pinLocation.length % 2 !== 0) && (
            <View style={styles.unFinishTransac}>
              <AppText
                style={{
                  color: colors.danger,
                }}
              >
                This trip is not done.
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
            {pinLocation.length > 1 && (
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
        <View
          style={{
            justifyContent: "space-between",
            height: "90%",
          }}
        >
          <View
            style={{
              backgroundColor: colors.light,
              margin: 10,
              padding: 10,
              borderRadius: 10,
            }}
          >
            {!markerData && !gasData ? (
              <>
                {user.trip_template === "delivery" ||
                user.trip_template === "hauling" ? undefined : (
                  <AppText
                    style={{
                      textTransform: "capitalize",
                    }}
                  >
                    Trip Type: {user.trip_template}
                  </AppText>
                )}
                <AppText>
                  Trip Date:{" "}
                  {dayjs(item.trip_date).format("YYYY-MM-DD | hh:mm A")}
                </AppText>
                {user.trip_template === "hauling" ? undefined : (
                  <AppText>Total Location: {pinLocation?.length}</AppText>
                )}
                <AppText>Total Gas: {item.diesels.length}</AppText>
                <AppText>Odometer Out: {item.odometer}</AppText>
                <AppText>Odometer Done: {item.odometer_done}</AppText>
                <AppText>Companion:</AppText>
                {item.companion.map((com, i) => {
                  return <AppText key={i}>{com.firstName}</AppText>;
                })}
                <AppText>
                  Others: {item.others == "null" ? "" : item.others}
                </AppText>
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
                  Region:{" "}
                  {markerData.address[0]?.region
                    ? markerData.address[0].region
                    : "Unknown"}
                </AppText>
                <AppText>
                  City:{" "}
                  {markerData.address[0]?.city
                    ? markerData.address[0].city
                    : "Unknown"}
                </AppText>
                <AppText>
                  Street:{" "}
                  {markerData.address[0]?.street
                    ? markerData.address[0].street
                    : "Unknown"}
                </AppText>
                <AppText>
                  District:{" "}
                  {markerData.address[0]?.district
                    ? markerData.address[0].district
                    : "Unknown"}
                </AppText>
                <AppText>
                  Name:{" "}
                  {markerData.address[0]?.name
                    ? markerData.address[0].name
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
                  Gas Station:{" "}
                  {gasStation.map((item) => {
                    if (item.value === gasData.gas_station_id) {
                      return item.label;
                    }
                  })}
                  {gasData?.gas_station_name &&
                    gasData.gas_station_name !== "null" &&
                    ` (${gasData.gas_station_name})`}
                </AppText>
                <AppText>Liter: {gasData.liter}</AppText>
                <AppText>Odometer: {gasData.odometer}</AppText>
                <AppText>Amount: {gasData.amount}</AppText>
              </>
            )}
          </View>
          {(item?.odometer_done < 0 ||
            item?.odometer_done === null ||
            pinLocation.length % 2 !== 0) && (
            <View style={{ margin: 10 }}>
              <AppButton
                title="RESUME"
                color={loading ? "light" : "success"}
                onPress={handleResumeTrip}
                disabled={loading}
              />
            </View>
          )}
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
    top: 0,
  },
  dragWrapper: {
    width: "100%",
    position: "absolute",
    alignItems: "center",
    bottom: 0,
  },
});
export default memo(MapDetailsScreen);
