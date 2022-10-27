const baseUrl = `${process.env.BASEURL}/vehicle/car/user`;

export const getVehicle = async (id, token) => {
  try {
    const response = await fetch(`${baseUrl}?plateNo=${id}`, {
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

export const getVehicles = async (token) => {
  try {
    const response = await fetch(`${process.env.BASEURL}/vehicle/cars`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET VEHICLES API ERROR: ", error);
  }
};
