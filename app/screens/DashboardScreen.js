import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { findTrip, getTrip } from "../api/office/TripApi";
import AppText from "../components/AppText";
import AuthContext from "../auth/context";
import AppHeading from "../components/AppHeading";
import authStorage from "../auth/storage";
import Camera from "../components/Camera";
import Card from "../components/Card";
import colors from "../config/colors";
import Fonts from "../components/Fonts";
import fonts from "../config/fonts";
import ListItem from "../components/list/ListItem";
import ListItemSeperator from "../components/list/ListItemSeperator";
import LogoutModal from "../components/modals/LogoutModal";
import Screen from "../components/Screen";
import SearchBar from "../components/SearchBar";
import Spacer from "../components/Spacer";
import { BASEURL } from "@env";
import * as Notifications from "expo-notifications";

import routes from "../navigation/routes";
import { deleteFromTable, selectTable } from "../utility/sqlite";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

function DashboardScreen({ navigation }) {
  const [text, setText] = useState();
  const [endLoading, setEndLoading] = useState(false);
  const [noData, setNoData] = useState(false);

  const [data, setData] = useState(0);
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);
  const [image, setImage] = useState();
  const [isModalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [tripDate, setTripDate] = useState();
  const [syncing, setSyncing] = useState(false);
  const {
    setOfflineVehicles,
    setOfflineGasStations,
    setOffScan,
    offline,
    setOffline,
    token,
    user,
    setUser,
    setToken,
    offScan,
    noInternet,
  } = useContext(AuthContext);

  useEffect(() => {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    console.log(dayjs.tz("2014-06-01 12:00", "Asia/Tokyo"));

    console.log("Europe: ", dayjs().tz("Europe/Paris").format("h:mm A"));
    console.log("Taipei: ", dayjs().tz("Asia/Singapore").format("h:mm A"));
    console.log("Local: ", dayjs(Date.now()).format("h:mm A"));
  }, []);

  // Scroll
  const [prevScrollPos, setPrevScrollPos] = useState(0);

  const fetchTrip = async () => {
    try {
      if (!noInternet) {
        const res = await getTrip(token, page + 1);
        if (res.data.length === 0) {
          setEndLoading(false);
          return setNoData(true);
        }
        await res.data.map((item) =>
          setTrips((currentValue) => [...currentValue, item])
        );
        setData((currentValue) => currentValue + res.data.length);
        setEndLoading(false);
        return setLoading(false);
      } else {
        alert("No internet connection...");
      }
    } catch (error) {
      alert("No server response: ", error);
      setLoading(false);
      setData(0);
    }
  };

  const searchFetchTrip = async () => {
    try {
      if (!noInternet) {
        const res = await findTrip(token, tripDate, page + 1);
        if (res.data.length === 0) {
          setEndLoading(false);
          return setNoData(true);
        }
        await res.data.map((item) =>
          setTrips((currentValue) => [...currentValue, item])
        );
        setData((currentValue) => currentValue + res.data.length);
        setEndLoading(false);
        return setLoading(false);
      } else {
        alert("No internet connection...");
      }
    } catch (error) {
      alert("No server response: ", error);
      setLoading(false);
      setData(0);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        ToastAndroid.show(`Syncing`, ToastAndroid.SHORT);

        Notifications.setNotificationHandler({
          handleNotification: async () => {
            return {
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            };
          },
        });

        // await deleteFromTable("offline_trip");
        await deleteFromTable("route");

        setImage(user.profile ? `${BASEURL}/${user.profile}` : null);

        await handleRefresh();

        setOfflineGasStations([]);
        setOfflineVehicles([]);
        setOfflineVehicles(await selectTable("vehicles"));
        setOfflineGasStations(await selectTable("gas_station"));
      } catch (error) {
        alert("ERROR ON CACHE: ", error);
        console.log(error);
      }
    })();
  }, []);

  useEffect(() => {
    if (offScan) {
      const content = {
        title: `Fresh Morning ${
          user.first_name[0].toUpperCase() +
          user.first_name.substring(1).toLowerCase()
        } `,
        body: "You have an unfinished trip. Please resume it or report to your immediate supervisor",
      };

      Notifications.scheduleNotificationAsync({
        content,
        trigger: null,
      });
    }
  }, [offScan]);

  const handleLogout = () => {
    setOffScan(false);
    setOffline(false);
    setUser(null);
    setToken(null);
    authStorage.removeToken();
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleRefresh = async () => {
    try {
      setOffScan(false);
      setOffline(false);
      setPage(1);
      setLoading(true);
      setTrips([]);
      setData(0);
      setNoData(false);
      setText(null);

      let totalItems = 0;
      const res = await selectTable("offline_trip");

      if (res.length >= 0) {
        setOffline(true);
        await res.reverse().map((item) => {
          setTrips((prevState) => [
            ...prevState,
            {
              _id: item.id,
              vehicle_id: item.vehicle_id,
              companion: JSON.parse(item.companion),
              diesels: JSON.parse(item.gas),
              locations: JSON.parse(item.locations),
              odometer: JSON.parse(item.odometer),
              odometer_done: parseInt(JSON.parse(item.odometer_done)),
              points: JSON.parse(item.points),
              image: JSON.parse(item.image),
              user_id: {
                _id: user.userId,
                trip_template: user.trip_template,
              },
              offline: true,
              trip_date: JSON.parse(item.date),
              others: item.others,
              locations: JSON.parse(item.locations),
              diesels: JSON.parse(item.gas),
            },
          ]);
        });
        totalItems = totalItems + res.length;
      }

      if (!noInternet) {
        const res = await getTrip(token, 1);
        res.data.map((item) => {
          setTrips((prevState) => [...prevState, item]);
        });
        totalItems = totalItems + res.data.length;
      } else {
        alert("No internet connection...");
      }

      setData(totalItems);
      slideIn();
      return setLoading(false);
    } catch (error) {
      alert("No server response: ", error);
      setLoading(false);
      setData(0);
    }
  };

  // FlatList Ref

  const fadeAnim = useRef(new Animated.Value(300)).current;

  const slideIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      useNativeDriver: true,
      duration: 300,
    }).start();
  };

  const slideOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 300,
      useNativeDriver: true,
      duration: 300,
    }).start();
  };

  const onScroll = (e) => {
    const currentScrollPos = e.nativeEvent.contentOffset.y;

    if (currentScrollPos > prevScrollPos) {
      // Scroll Down
      slideOut();
    } else {
      // Scroll Up
      slideIn();
    }
    return setPrevScrollPos(currentScrollPos);
  };

  // FlatList Footer
  const Footer = () => {
    return <ActivityIndicator size="large" color={colors.primary} />;
  };

  // Render Item

  const renderItem = ({ item, index }) => {
    return (
      <ListItem
        key={index}
        setOffScan={setOffScan}
        offScan={offScan}
        setOffline={setOffline}
        token={token}
        handleRefresh={handleRefresh}
        setSyncing={setSyncing}
        syncing={syncing}
        noInternet={noInternet}
        item={item}
        onPress={() => navigation.navigate(routes.MAPVIEW, { item })}
      />
    );
  };

  // Refresh
  const onRefresh = () => {
    if (endLoading === false && !syncing) {
      handleRefresh();
    } else {
      alert("Please wait to finish syncing");
    }
  };

  // Reached End
  const onEndReached = async () => {
    if (
      data >= 25 &&
      noData === false &&
      text === null &&
      !endLoading &&
      !syncing
    ) {
      setEndLoading(true);
      setPage((value) => value + 1);
      await fetchTrip();
    } else if (
      data >= 25 &&
      noData === false &&
      text &&
      !endLoading &&
      !syncing
    ) {
      setEndLoading(true);
      setPage((value) => value + 1);
      await searchFetchTrip();
    }
  };

  return (
    <>
      <Screen>
        <Card
          image={image && { uri: image }}
          name={`${user.first_name} ${user.last_name}`}
          onPress={
            loading
              ? () => alert("Please wait the loading to be done.")
              : toggleModal
          }
        />
        <SearchBar
          syncing={syncing}
          setData={setData}
          setTrips={setTrips}
          user_id={user.userId}
          token={token}
          fetchTrip={handleRefresh}
          text={text}
          setText={setText}
          setNoData={setNoData}
          setLoading={setLoading}
          loading={loading}
          page={page}
          setTripDate={setTripDate}
        />
        <Fonts>
          <AppHeading
            size="h3"
            style={[
              styles.count,
              { display: loading ? "none" : "flex", position: "relative" },
            ]}
          >
            {data > 1
              ? `${data} items`
              : data == 0
              ? `No item found`
              : data === undefined
              ? ``
              : `${data} item`}
          </AppHeading>
          {/* <View
            style={{
              alignItems: "center",
              position: "absolute",
              paddingLeft: 10,
              top: -5,
              display: offline ? "flex" : "none",
            }}
          >
            <Button title="sync" color={colors.success} onPress={handleSync} />
          </View> */}
        </Fonts>
        <Spacer />

        {data > 0 && loading === false ? (
          <>
            <FlatList
              showsVerticalScrollIndicator={false}
              onScroll={onScroll}
              data={trips}
              // keyExtractor={(initialData,index) => initialData._id.toString()}
              renderItem={renderItem}
              ItemSeparatorComponent={ListItemSeperator}
              refreshing={false}
              onRefresh={onRefresh}
              ListFooterComponent={
                endLoading && !noData ? (
                  <Footer />
                ) : (
                  <AppText
                    style={{
                      textAlign: "center",
                    }}
                  >
                    {!endLoading && noData && "No data to show"}
                  </AppText>
                )
              }
              onEndReached={onEndReached}
              onEndReachedThreshold={0.0001}
            />
          </>
        ) : data === 0 && loading === false ? (
          <View style={styles.refreshTouchWrapper}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.refreshTouch}
            >
              <Ionicons name="ios-refresh" size={30} />
            </TouchableOpacity>
          </View>
        ) : (
          loading === true && (
            <View style={styles.container}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginTop: "-40%" }}
              />
            </View>
          )
        )}
        {trips && endLoading === false && (
          <Animated.View
            style={{
              transform: [{ translateY: fadeAnim }],
              alignItems: "center",
              height: 50,
              width: "100%",
              position: "absolute",
              bottom: 0,
            }}
          >
            <Camera />
          </Animated.View>
        )}
      </Screen>

      {/* LOGOUT MODAL */}
      <LogoutModal
        isModalVisible={isModalVisible}
        toggleModal={toggleModal}
        handleLogout={handleLogout}
      />
    </>
  );
}
const styles = StyleSheet.create({
  count: {
    color: colors.lightMedium,
    textAlign: "center",
    fontFamily: fonts.primaryName,
  },

  container: {
    flex: 1,
    justifyContent: "center",
  },
  noLocation: {
    textAlign: "center",
    color: colors.danger,
    paddingVertical: 25,
    backgroundColor: colors.light,
  },
  refreshTouch: {
    backgroundColor: colors.light,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 100,
  },
  refreshTouchWrapper: { justifyContent: "center", alignItems: "center" },
});

export default DashboardScreen;
