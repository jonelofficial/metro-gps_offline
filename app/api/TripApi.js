import url from "./url";

const tripUrl = `${url.BASEURL}/office/trips`;

export const createTrip = async (data, token) => {
  try {
    const response = await fetch(tripUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("CREATE-TRIP API ERROR: ", error);
  }
};

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

export const getSingleTrip = async (token, populate, trip_id) => {
  try {
    const response = await fetch(
      `${tripUrl}/${trip_id}?populate=${populate},locations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("GET-SINGLE-TRIP API ERROR: ", error);
  }
};

/*
 * FOR SEARCH FUNCTION
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

export const updateTrip = async (id, data, token) => {
  try {
    const response = await fetch(`${tripUrl}/${id}`, {
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

export const searchTripInfiniteScroll = async (token, trip_date, page) => {
  try {
    const response = await fetch(
      `${tripUrl}?filters[user_id][$eq]=${user_id}&sort[id]=DESC&populate=${populate},locations,diesels&filters[trip_date][$gte]=${trip_date}T00:00:00&filters[trip_date][$lte]=${trip_date}T23:59:59&pagination[start]=${start}&pagination[limit]=25`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("SEARCH-TRIP API ERROR: ", error);
  }
};

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
