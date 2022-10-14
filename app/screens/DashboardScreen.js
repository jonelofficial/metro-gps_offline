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
import AsyncStorage from "@react-native-async-storage/async-storage";

import { findTrip, getTrip, updateTrip } from "../api/office/TripApi";
import AppText from "../components/AppText";
import AuthContext from "../auth/context";
import AppHeading from "../components/AppHeading";
import authStorage from "../auth/storage";
import cache from "../utility/cache";
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

import routes from "../navigation/routes";
import {
  createTable,
  deleteFromTable,
  insertToTable,
  selectTable,
} from "../utility/sqlite";

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

  const { setOfflineVehicles, setOfflineGasStations } = useContext(AuthContext);

  // Scroll
  const [prevScrollPos, setPrevScrollPos] = useState(0);

  const { token, user, setUser, setToken } = useContext(AuthContext);

  const fetchTrip = async () => {
    try {
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
    } catch (error) {
      alert("No server response: ", error);
      setLoading(false);
      setData(0);
    }
  };

  const searchFetchTrip = async () => {
    try {
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
    } catch (error) {
      alert("No server response: ", error);
      setLoading(false);
      setData(0);
    }
  };

  useEffect(() => {
    ToastAndroid.show(`Syncing`, ToastAndroid.SHORT);

    setImage(user.profile ? `${BASEURL}/${user.profile}` : null);
    // Handle if have an unsave trip from map screen
    (async () => {
      try {
        setOfflineGasStations([]);
        setOfflineVehicles([]);
        setOfflineVehicles(await selectTable("vehicles"));
        setOfflineGasStations(await selectTable("gas_station"));

        const tripCache = await cache.get(user.userId);
        if (tripCache === null) return handleRefresh();

        setLoading(true);

        await updateTrip(tripCache.id, tripCache.dataObj, token);
        await AsyncStorage.removeItem("cache" + user.userId);
        handleRefresh();
      } catch (error) {
        alert("ERROR ON CACHE: ", error);
        console.log(error);
      }
    })();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    authStorage.removeToken();
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleRefresh = async () => {
    try {
      setPage(1);
      setLoading(true);
      setTrips([]);
      setData(0);
      setNoData(false);
      setText(null);

      const res = await getTrip(token, 1);
      setTrips(res.data);
      setData(res.data.length);
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

  const FooterNoData = () => {
    return (
      <AppText
        style={{
          textAlign: "center",
        }}
      >
        No data to show
      </AppText>
    );
  };

  // Render Item

  const renderItem = ({ item }) => {
    return (
      <ListItem
        item={item}
        onPress={() => navigation.navigate(routes.MAPVIEW, { item })}
      />
    );
  };

  // Refresh
  const onRefresh = () => {
    if (endLoading === false) {
      handleRefresh();
    } else {
      return null;
    }
  };

  // Reached End
  const onEndReached = async () => {
    if (data >= 25 && noData === false && text === null && !endLoading) {
      setEndLoading(true);
      setPage((value) => value + 1);
      await fetchTrip();
    } else if (data >= 25 && noData === false && text && !endLoading) {
      setEndLoading(true);
      setPage((value) => value + 1);
      await searchFetchTrip();
    } else {
      return;
    }
  };

  return (
    <>
      <Screen>
        <Card
          image={image && { uri: image }}
          name={`${user.first_name} ${user.last_name}`}
          onPress={toggleModal}
        />
        <SearchBar
          setData={setData}
          setTrips={setTrips}
          // populate={user.user.trip_template}
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
            style={[styles.count, { display: loading ? "none" : "flex" }]}
          >
            {data > 1
              ? `${data} items`
              : data == 0
              ? `No item found`
              : data === undefined
              ? ``
              : `${data} item`}
          </AppHeading>
        </Fonts>
        <Spacer />

        {data > 0 && loading === false ? (
          <>
            <FlatList
              onScroll={onScroll}
              data={trips}
              keyExtractor={(initialData) => initialData._id.toString()}
              renderItem={renderItem}
              ItemSeparatorComponent={ListItemSeperator}
              refreshing={false}
              onRefresh={onRefresh}
              ListFooterComponent={
                endLoading && !noData ? (
                  <Footer />
                ) : noData ? (
                  <FooterNoData />
                ) : null
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
