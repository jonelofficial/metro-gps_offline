import { BASEURL } from "@env";

const tripUrl = `${BASEURL}/gas-station/stations`;

export const getGasStation = async (token) => {
  try {
    const response = await fetch(tripUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET GAS STATION API ERROR: ", error);
  }
};
