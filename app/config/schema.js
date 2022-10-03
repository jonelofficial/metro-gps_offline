import * as Yup from "yup";

// LOGIN SCREEN
export const loginSchema = Yup.object().shape({
  identifier: Yup.string().required().label("Username"),
  password: Yup.string().required().label("Password"),
});

//  TRANSPO DETAILS SCREEN
export const transpoDetailsSchema = Yup.object().shape({
  odometer: Yup.string().required().label("Odometer"),
  // odometer_image_path: Yup.string().required().label("Odometer Picture"),
  odometer_image_path: Yup.object().required().label("Odometer Picture"),
  companion: Yup.string().required().label("Companion"),
});

// SCAN SCREEN
export const vehicleIdSchema = Yup.object().shape({
  vehicle_id: Yup.string().required().label("Vehicle ID"),
});

// MAP SCREEN
export const mapGasSchema = Yup.object().shape({
  gas_station_id: Yup.string().nullable().required().label("Gas Station"),
  odometer: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Odometer"),
  liter: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Liter"),
});

// MAP SCREEN
export const mapDoneSchema = Yup.object().shape({
  odometer_done: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Odometer"),
});

// FEEDS DELIVERY SCREEN
export const bagsSchema = Yup.object().shape({
  bags: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Bags"),
});

// DELIVERY SCREEN
export const deliverySchema = Yup.object().shape({
  booking_number: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Booking Number"),
  temperature_left: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Temperature"),
  route: Yup.string().nullable().required().label("Routes"),
  trip_type: Yup.string().nullable().required().label("Trip Type"),
});

// MAP SCREEN
export const arrivedDeliverySchema = Yup.object().shape({
  odometer: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Odometer"),
  temperature_arrived: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Temperature"),
  trip_problem: Yup.string()
    .matches(/^([a-zA-Z]+\s)*[a-zA-Z]+$/, "Letters only or remove last space")
    .label("Trip Problem"),
  crates_dropped: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Crates Dropped"),
  crates_collected: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Crates Collected"),
  crates_lent: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Crates Lent"),
});

// MAP SCREEN
export const leftDeliverySchema = Yup.object().shape({
  odometer: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Odometer"),
  temperature_left: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Temperature"),
  companion: Yup.string().required().label("Companion"),
});

// HAULING SCREEN
export const haulingSchema = Yup.object().shape({
  trip_number: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .required()
    .label("Trip Number"),
  trip_type: Yup.string().nullable().required().label("Trip Type"),
  farm: Yup.string().nullable().required().label("Farm"),
  tare_weight: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Tare Weight"),
});

export const haulingFirstArrivedSchema = Yup.object().shape({
  gross_weight: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Gross Weight"),
});

export const haulingLastArrivedSchema = Yup.object().shape({
  tare_weight: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Tare Weight"),
  gross_weight: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Gross Weight"),
  net_weight: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Net Weight"),
  doa_count: Yup.string()
    .matches(/^\d*\.?(?:\d{1,1})?$/, "Must be digit and one dot only")
    .required()
    .label("DOA Count"),
});

export const haulingLastLeftSchema = Yup.object().shape({
  tare_weight: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Tare Weight"),
  gross_weight: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Gross Weight"),
  net_weight: Yup.string()
    .matches(/^\d*\.?(?:\d{1,9})?$/, "Must be digit and one dot only")
    .required()
    .label("Net Weight"),
});
