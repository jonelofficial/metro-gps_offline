import { useEffect, useState } from "react";
import { useNetInfo } from "@react-native-community/netinfo";

const useInternetStatus = () => {
  const netInfo = useNetInfo();
  const [noInternet, setInternet] = useState(false);

  useEffect(() => {
    if (netInfo.type !== "unknown" && netInfo.isInternetReachable === false) {
      return setInternet(true);
    }
    setInternet(false);
  }, [netInfo]);

  return { noInternet, setInternet, netInfo };
};

export default useInternetStatus;
