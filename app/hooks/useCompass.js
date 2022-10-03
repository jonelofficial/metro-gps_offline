import { Magnetometer } from "expo-sensors";
import { Gyroscope } from "expo-sensors";
import React, { useEffect, useState } from "react";

export default useCompass = () => {
  // GYRO
  const [data, setData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [subscriptionGyro, setSubscriptionGyro] = useState(null);

  const _subscribeGyro = () => {
    setSubscriptionGyro(
      Gyroscope.addListener((gyroscopeData) => {
        setData(gyroscopeData);
      })
    );
  };

  const _unsubscribeGyro = () => {
    subscriptionGyro && subscriptionGyro.remove();
    setSubscriptionGyro(null);
  };

  useEffect(() => {
    // Gyroscope.setUpdateInterval(1000);
    _subscribeGyro();
    return () => _unsubscribeGyro();
  }, []);

  //   COMPASS

  const [subscriptionCompass, setSubscriptionCompass] = useState(null);
  const [magnetometer, setMagnetometer] = useState(0);

  useEffect(() => {
    // Magnetometer.setUpdateInterval(1000);
    _toggle();
    return () => {
      _unsubscribe();
    };
  }, []);

  const _toggle = () => {
    if (subscriptionCompass) {
      _unsubscribe();
    } else {
      _subscribe();
    }
  };

  const _subscribe = () => {
    setSubscriptionCompass(
      Magnetometer.addListener((data) => {
        setMagnetometer(_angle(data));
      })
    );
  };

  const _unsubscribe = () => {
    subscriptionCompass && subscriptionCompass.remove();
    setSubscriptionCompass(null);
  };

  const _angle = (magnetometer) => {
    let angle = 0;
    if (magnetometer) {
      let { x, y, z } = magnetometer;
      if (Math.atan2(y, x) >= 0) {
        angle = Math.atan2(y, x) * (180 / Math.PI);
      } else {
        angle = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
      }
    }
    return Math.round(angle);
  };

  //   const _direction = (degree) => {
  //     if (degree >= 22.5 && degree < 67.5) {
  //       return "NE";
  //     } else if (degree >= 67.5 && degree < 112.5) {
  //       return "E";
  //     } else if (degree >= 112.5 && degree < 157.5) {
  //       return "SE";
  //     } else if (degree >= 157.5 && degree < 202.5) {
  //       return "S";
  //     } else if (degree >= 202.5 && degree < 247.5) {
  //       return "SW";
  //     } else if (degree >= 247.5 && degree < 292.5) {
  //       return "W";
  //     } else if (degree >= 292.5 && degree < 337.5) {
  //       return "NW";
  //     } else {
  //       return "N";
  //     }
  //   };

  // Match the device top with pointer 0° degree. (By default 0° starts from the right of the device.)
  const _degree = (magnetometer) => {
    return magnetometer - 90 >= 0 ? magnetometer - 90 : magnetometer + 271;
  };
  //   const tilt = data.z === -0 ? -125 : 125;
  const direction = _degree(magnetometer);
  return direction;
};
