import url from "./url";

const baseUrl = `${url.BASEURL}/api/vehicles`;

export const getVehicle = async (id, token) => {
  try {
    const response = await fetch(`${baseUrl}?filters[plate_no][$eq]=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET VEHICLE API ERROR: ", error);
  }
};
