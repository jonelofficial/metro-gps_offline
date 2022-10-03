import url from "./url";

const tripUrl = `${url.BASEURL}/api/routes`;

export const getRoutes = async (token) => {
  try {
    const response = await fetch(tripUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET-ROUTES API ERROR: ", error);
  }
};
