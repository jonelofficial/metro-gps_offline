import * as SecureStore from "expo-secure-store";

const key = "authToken";

const storeToken = async (authToken) => {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(authToken));
  } catch (error) {
    console.log("ERROR ON STORING AUTH TOKEN: ", error);
  }
};

const getUser = async () => {
  const token = await getToken();
  return token ? token : null;
};

const getToken = async () => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.log("ERROR ON GETTING AUTH TOKEN: ", error);
  }
};

const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.log("ERROR ON REMOVING AUTH TOKEN: ", error);
  }
};

export default { storeToken, getUser, removeToken };
