import { useContext, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { yupResolver } from "@hookform/resolvers/yup";

import { loginSchema } from "../config/schema";
import { useLogin } from "../api/LoginApi";
import authStorage from "../auth/storage";
import AppHeading from "../components/AppHeading";
import AppText from "../components/AppText";
import AppFormField from "../components/forms/AppFormField";
import SubmitButton from "../components/forms/SubmitButton";
import Screen from "../components/Screen";
import Spacer from "../components/Spacer";
import colors from "../config/colors";
import defaultStyle from "../config/styles";
import fonts from "../config/fonts";
import routes from "../navigation/routes";
import useAuth from "../auth/useAuth";
import SyncingIndicator from "../components/indicator/SyncingIndicator";
import AuthContext from "../auth/context";
import { getVehicles } from "../api/VehicleApi";
import {
  createTable,
  deleteFromTable,
  insertToTable,
  selectTable,
} from "../utility/sqlite";
import { getGasStation } from "../api/GasStationApi";

function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const { logIn } = useAuth();
  const { setOfflineVehicles, setOfflineGasStations, noInternet } =
    useContext(AuthContext);
  useEffect(() => {
    (async () => {
      await createTable(
        "vehicles",
        "id integer primary key not null, _id TEXT, plate_no TEXT, vehicle_type TEXT, name TEXT,brand TEXT, fuel_type TEXT, km_per_liter INTEGER"
      );
      await createTable(
        "gas_station",
        "id integer primary key not null, _id TEXT, label TEXT"
      );
    })();
  }, []);

  const handleScan = () => {
    navigation.navigate(routes.SCAN);
  };

  const methods = useForm({
    resolver: yupResolver(loginSchema),
    mode: "onTouched",
  });

  const { reset } = methods;

  const onSubmit = async (user) => {
    try {
      Keyboard.dismiss();
      setLoading(true);

      if (!noInternet) {
        const data = await useLogin(user);

        if (data?.message) {
          setLoading(false);
          return alert(`${data.message}`);
        }

        // UPDATE USER FROM SQLITE
        await deleteFromTable("user");
        await insertToTable(
          "INSERT INTO user (username, password, token) values (?,?,?)",
          [user.username, user.password, data.token]
        );

        const vehicles = await getVehicles();

        if (vehicles.data) {
          // Handle store and update vehicles master list to local storage
          try {
            let vehicleCount;
            vehicleCount = vehicles.data.length;
            const data = await selectTable("vehicles");
            if (data.length === 0) {
              await vehicles.data.map(async (item) => {
                await insertToTable(
                  "INSERT INTO vehicles (_id, plate_no, vehicle_type, name,brand, fuel_type, km_per_liter) values (?,?,?,?,?,?,?)",
                  [
                    item._id,
                    item.plate_no,
                    item.vehicle_type,
                    item.name,
                    item.brand,
                    item.fuel_type,
                    item.km_per_liter,
                  ]
                );
              });
            } else if (vehicleCount !== data.length) {
              await deleteFromTable("vehicles");
              await vehicles.data.map(async (item) => {
                await insertToTable(
                  "INSERT INTO vehicles (_id, plate_no, vehicle_type, name,brand, fuel_type, km_per_liter) values (?,?,?,?,?,?,?)",
                  [
                    item._id,
                    item.plate_no,
                    item.vehicle_type,
                    item.name,
                    item.brand,
                    item.fuel_type,
                    item.km_per_liter,
                  ]
                );
              });
            }
          } catch (error) {
            console.log("SQLITE VEHICLES ERROR: ", error);
          }
          // End
        }

        const gasStation = await getGasStation();

        if (gasStation.data) {
          // Handle store and update gas station master list to local storage
          try {
            let stationCount;
            stationCount = gasStation.data.length;
            const data = await selectTable("gas_station");
            if (data.length === 0) {
              await gasStation.data.map(async (item) => {
                await insertToTable(
                  "INSERT INTO gas_station (_id, label) values (?,?)",
                  [item._id, item.label]
                );
              });
            } else if (stationCount !== data.length) {
              await deleteFromTable("gas_station");
              await gasStation.data.map(async (item) => {
                await insertToTable(
                  "INSERT INTO gas_station (_id,label) values (?,?)",
                  [item._id, item.label]
                );
              });
            }
          } catch (error) {
            console.log("SQLITE GAS STATION ERROR: ", error);
          }
          // End
        }

        logIn(data);
        authStorage.storeToken(data);
        reset();
      } else {
        const offlineData = await selectTable("user");
        offlineData.map((item) => {
          if (
            (item.password === user.password) &
            (item.username === user.username)
          ) {
            logIn(item);
            authStorage.storeToken(item);
            reset();
          } else {
            alert(
              `Could not find user. Login with internet connection instead`
            );
            setLoading(false);
          }
        });
      }
    } catch (error) {
      console.log("LOGIN SCREEN ERROR:", error);
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.titleContainer}>
        <AppHeading style={styles.title}>Login to your</AppHeading>
        <AppHeading style={styles.title}>Account</AppHeading>
      </View>
      <View style={styles.formContainer}>
        <FormProvider {...methods} onSubmit={onSubmit}>
          <AppText style={styles.formLabel}>Username</AppText>
          <AppFormField
            name="username"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Spacer />

          <AppText style={styles.formLabel}>Password</AppText>
          <AppFormField
            name="password"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password" // for Ios
            secureTextEntry={!showPassword} // password
            secIcon
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <Spacer />

          <View style={styles.scanContainer}>
            <TouchableOpacity onPress={handleScan}>
              <Text style={[defaultStyle.text, styles.scanID]}>Scan ID</Text>
            </TouchableOpacity>
          </View>

          <Spacer />

          <SubmitButton title="Sign In" />
        </FormProvider>
      </View>
      {loading && (
        <View style={styles.container}>
          <SyncingIndicator visible={true} />
        </View>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: {
    padding: 20,
  },
  titleContainer: {
    paddingTop: "15%",
  },
  title: {
    fontSize: 40,
    fontFamily: fonts.primaryName,
    lineHeight: 45,
    fontWeight: "600",
  },
  formContainer: {
    paddingTop: 40,
  },
  formLabel: {
    fontFamily: fonts.primaryName,
    marginBottom: 6,
  },
  input: {
    color: colors.medium,
  },
  scanContainer: {
    alignItems: "flex-end",
  },
  scanID: {
    fontFamily: fonts.primaryName,
    color: colors.primary,
  },
  container: {
    position: "absolute",
    backgroundColor: "white",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default LoginScreen;
