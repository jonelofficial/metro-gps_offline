// import { BASEURL } from "@env";

const tripUrl = `${process.env.BASEURL}/gas-station/stations`;
// console.log("URL: ", tripUrl);

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
