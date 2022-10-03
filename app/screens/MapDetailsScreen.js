import React, { useContext, useEffect, useRef, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { StyleSheet, View, Button } from "react-native";
import dayjs from "dayjs";

import { getMyHaulings } from "../api/HaulingApi";
import { getGasStation } from "../api/GasStationApi";
import AppText from "../components/AppText";
import AuthContext from "../auth/context";
import colors from "../config/colors";
import Screen from "../components/Screen";
import Spacer from "../components/Spacer";

function MapDetailsScreen({ route }) {
  const [loading, setLoading] = useState(true);
  const [markerData, setMarkerData] = useState();
  const [gasData, setGasData] = useState();
  const [gasStation, setGasStation] = useState([]);
  const [points, setPoints] = useState();
  // Hauling state
  const [haulings, setHaulings] = useState([]);

  const map = useRef();

  const { token } = useContext(AuthContext);
  const { item } = route.params;

  const latlong = item.attributes.locations.data;

  useEffect(() => {
    fetchGasStation();
    setPoints(item.attributes.points);

    {
      item.attributes?.hauling &&
        (async () => {
          setHaulings([]);
          const haulingsRes = await getMyHaulings(item.id, token);
          setHaulings(haulingsRes.data);
        })();
    }
  }, []);

  const fetchGasStation = async () => {
    try {
      setGasStation([]);
      const gasRes = await getGasStation(token);
      setGasStation(
        gasRes.data.map((item) => {
          return { label: item.attributes.label, value: item.id };
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
          latitude: item.attributes.lat,
          longitude: item.attributes.long,
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
                  latitude: item.attributes.lat,
                  longitude: item.attributes.long,
                }}
                pinColor={
                  item.attributes.status === "left"
                    ? colors.danger
                    : colors.success
                }
                onPress={() => {
                  setGasData(null);
                  setMarkerData({ ...item, index: i });
                }}
                title={markerID.toString()}
              ></Marker>
            );
          })}

          {item.attributes.diesels.data.length >= 1 &&
            item.attributes.diesels.data.map((gasItem, i) => {
              return (
                <Marker
                  key={i}
                  coordinate={{
                    latitude: gasItem.attributes.lat,
                    longitude: gasItem.attributes.long,
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
          (item.attributes?.odometer_done < 0 ||
            item.attributes?.odometer_done === null) && (
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
            {item.attributes.diesels.data.length >= 1 && (
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
                {item.attributes.trip_type === "delivery" ||
                item.attributes.trip_type === "hauling" ? undefined : (
                  <AppText
                    style={{
                      textTransform: "capitalize",
                    }}
                  >
                    Trip Type:{" "}
                    {item.attributes.trip_type === "feeds_delivery"
                      ? "feeds delivery"
                      : item.attributes.trip_type}
                  </AppText>
                )}
                <AppText>
                  Trip Date:{" "}
                  {dayjs(item.attributes.trip_date).format(
                    "YYYY-MM-DD | hh:mm A"
                  )}
                </AppText>
                {item.attributes.trip_type === "hauling" ? undefined : (
                  <AppText>Total Location: {latlong.length}</AppText>
                )}
                <AppText>
                  Total Gas: {item.attributes.diesels.data.length}
                </AppText>
                <AppText>Odometer Out: {item.attributes.odometer}</AppText>
                <AppText>
                  Odometer Done: {item.attributes.odometer_done}
                </AppText>
                <AppText>Companion: {item.attributes.companion}</AppText>
                {item.attributes?.feeds_delivery && (
                  <AppText>
                    Bags: {item.attributes.feeds_delivery.data?.attributes.bags}
                  </AppText>
                )}
                {/*
                 * IF TRIP IS DELIVERY
                 */}
                {item.attributes?.delivery &&
                  item.attributes.delivery.data?.attributes && (
                    <>
                      <Spacer />
                      <View
                        style={{
                          borderBottomColor: "black",
                          borderBottomWidth: 1,
                        }}
                      />
                      <Spacer />
                      <AppText>
                        Trip Type:{" "}
                        {item.attributes.delivery.data.attributes.trip_type}
                      </AppText>
                      <AppText>
                        Booking Number:{" "}
                        {
                          item.attributes.delivery.data.attributes
                            .booking_number
                        }
                      </AppText>
                      <AppText>
                        Route: {item.attributes.delivery.data.attributes.route}
                      </AppText>
                      <AppText>
                        Trip Problem:{" "}
                        {item.attributes.delivery.data.attributes.trip_problem}
                      </AppText>
                      <AppText>
                        Temperature Left:{" "}
                        {
                          item.attributes.delivery.data.attributes
                            .temperature_left
                        }
                      </AppText>
                      <AppText>
                        Temperature Arrived:{" "}
                        {
                          item.attributes.delivery.data.attributes
                            .temperature_arrived
                        }
                      </AppText>
                      <AppText>
                        Crates Lent:{" "}
                        {item.attributes.delivery.data.attributes.crates_lent}
                      </AppText>
                      <AppText>
                        Crates Collected:{" "}
                        {
                          item.attributes.delivery.data.attributes
                            .crates_collected
                        }
                      </AppText>
                      <AppText>
                        Crates Dropped:{" "}
                        {
                          item.attributes.delivery.data.attributes
                            .crates_dropped
                        }
                      </AppText>
                    </>
                  )}
                {/*
                 * IF TRIP IS Hauling
                 */}
                {item.attributes?.hauling && haulings && (
                  <>
                    <Spacer />
                    <View
                      style={{
                        borderBottomColor: "black",
                        borderBottomWidth: 1,
                      }}
                    />
                    <Spacer />

                    <AppText>
                      Trip Number: {haulings[0]?.attributes.trip_number}
                    </AppText>

                    <AppText>
                      Trip Type: {haulings[0]?.attributes.trip_type}
                    </AppText>

                    <AppText>Farm: {haulings[0]?.attributes.farm}</AppText>
                  </>
                )}
              </>
            ) : !gasData ? (
              <>
                {/*
                 *
                 * MARKER DETAILS
                 *
                 */}
                <AppText style={{ textTransform: "capitalize" }}>{`${
                  markerData.attributes.status
                } Date: ${dayjs(markerData.attributes.date).format(
                  "YYYY-MM-DD | hh:mm A"
                )}`}</AppText>
                <AppText>
                  Location:{" "}
                  {markerData.attributes.address[0]?.city
                    ? markerData.attributes.address[0].city
                    : "Unknown"}
                </AppText>
                {/* IF TRIP IS HAULING */}
                {item.attributes?.hauling &&
                haulings &&
                markerData.index === 0 ? (
                  <>
                    <Spacer />
                    <AppText>
                      Tare Weight:{" "}
                      {haulings[markerData.index]?.attributes.tare_weight}
                    </AppText>
                  </>
                ) : item.attributes?.hauling &&
                  haulings &&
                  markerData.index === 1 ? (
                  <>
                    <Spacer />
                    <AppText>
                      Gross Weight:{" "}
                      {haulings[markerData.index]?.attributes.gross_weight}
                    </AppText>
                  </>
                ) : item.attributes?.hauling &&
                  haulings &&
                  markerData.index === 2 ? (
                  <>
                    <Spacer />
                    <AppText>
                      Tare Weight:{" "}
                      {haulings[markerData.index]?.attributes.tare_weight}
                    </AppText>
                    <AppText>
                      Gross Weight:{" "}
                      {haulings[markerData.index]?.attributes.gross_weight}
                    </AppText>
                    <AppText>
                      Net Weight:{" "}
                      {haulings[markerData.index]?.attributes.net_weight}
                    </AppText>
                  </>
                ) : (
                  item.attributes?.hauling &&
                  haulings &&
                  markerData.index === 3 && (
                    <>
                      <Spacer />
                      <AppText>
                        Tare Weight:{" "}
                        {haulings[markerData.index]?.attributes.tare_weight}
                      </AppText>
                      <AppText>
                        Gross Weight:{" "}
                        {haulings[markerData.index]?.attributes.gross_weight}
                      </AppText>
                      <AppText>
                        Net Weight:{" "}
                        {haulings[markerData.index]?.attributes.net_weight}
                      </AppText>
                      <AppText>
                        DOA Count:{" "}
                        {haulings[markerData.index]?.attributes.doa_count}
                      </AppText>
                    </>
                  )
                )}
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
                  {dayjs(gasData.attributes.createdAt).format(
                    "YYYY-MM-DD | hh:mm A"
                  )}
                </AppText>
                <AppText>
                  Gas Station:
                  {gasStation[gasData.attributes.gas_station_id - 1].label}
                </AppText>
                <AppText>Liter: {gasData.attributes.liter}</AppText>
                <AppText>Odometer: {gasData.attributes.odometer}</AppText>
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
