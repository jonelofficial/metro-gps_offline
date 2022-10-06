import { BASEURL } from "@env";

const tripUrl = `${BASEURL}/office/trips`;

export const createTrip = async (form, token) => {
  try {
    const response = await fetch(`${BASEURL}/office/trip`, {
      method: "POST",
      headers: {
        // Accept: "application/json",
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("CREATE-TRIP API ERROR: ", error);
  }
};

// USED
export const getTrip = async (token, page) => {
  try {
    const response = await fetch(`${tripUrl}/user?page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET-TRIP API ERROR: ", error);
  }
};

/*
 * FOR SEARCH FUNCTION // USED
 */
export const findTrip = async (token, trip_date, page) => {
  try {
    const response = await fetch(
      `${tripUrl}/search?searchDate=${trip_date}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("FIND-TRIP API ERROR: ", error);
  }
};

// USED
export const updateTrip = async (id, data, token) => {
  try {
    const response = await fetch(`${BASEURL}/office/trip/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("UPDATE-TRIP API ERROR: ", error);
  }
};

/*














*/

export const deleteTrip = async (id, token) => {
  try {
    const response = await fetch(`${tripUrl}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("DELETE-TRIP API ERROR: ", error);
  }
};

export const getSingleTrip = async (token, trip_id) => {
  try {
    const response = await fetch(`${tripUrl}/${trip_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET-SINGLE-TRIP API ERROR: ", error);
  }
};
