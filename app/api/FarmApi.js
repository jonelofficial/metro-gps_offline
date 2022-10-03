import url from "./url";

const tripUrl = `${url.BASEURL}/api/farms`;

export const getFarm = async (token) => {
  try {
    const response = await fetch(
      `${tripUrl}?fields[0]=trip_type&fields[1]=farm`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET-FARM API ERROR: ", error);
  }
};
