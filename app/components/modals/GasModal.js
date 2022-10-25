import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FormProvider } from "react-hook-form";

import AppText from "../AppText";
import AppFormPicker from "../forms/AppFormPicker";
import AppFormField from "../forms/AppFormField";
import Modal from "react-native-modal";
import Spacer from "../Spacer";
import SubmitButton from "../forms/SubmitButton";

export default function GasModal({
  isModalVisible,
  setModalVisible,
  reset,
  setValue,
  setOpen,
  items,
  value,
  open,
  method,
  onSubmit,
  loading,
  clearErrors,
  setGasValue,
}) {
  useEffect(() => {
    if (value == "507f191e810c19729de860ea") {
      setGasValue("gas_station_name", "");
    }
    clearErrors("gas_station_name");
    setGasValue("gas_station_name", "null");
  }, [value]);
  return (
    <View>
      <Modal
        isVisible={isModalVisible}
        animationIn={"slideInLeft"}
        animationOut={"slideOutRight"}
      >
        <View style={styles.modalContent}>
          <View style={styles.close}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false), reset(), setValue(null), setOpen(false);
              }}
            >
              <Ionicons name="ios-close-outline" size={30} />
            </TouchableOpacity>
          </View>
          <Spacer />

          <FormProvider {...method} onSubmit={onSubmit}>
            <AppText style={{ marginBottom: 5 }}>Gas Station:</AppText>

            <AppFormPicker
              name="gas_station_id"
              items={items}
              value={value}
              setValue={setValue}
              open={open}
              setOpen={setOpen}
            />

            <Spacer />

            {value == "507f191e810c19729de860ea" && (
              <>
                <AppText style={{ marginBottom: 5 }}>Gas Station Name:</AppText>
                <AppFormField
                  name="gas_station_name"
                  placeholder="Input gas station name..."
                />
                <Spacer />
              </>
            )}

            <AppText style={{ marginBottom: 5 }}>Odemeter:</AppText>
            <AppFormField
              name="odometer"
              placeholder="Input odometer..."
              keyboardType="numeric"
            />
            <Spacer />

            <AppText style={{ marginBottom: 5 }}>Liter:</AppText>

            <AppFormField
              name="liter"
              placeholder="Input liter gas..."
              keyboardType="numeric"
            />
            <Spacer />

            <AppText style={{ marginBottom: 5 }}>Amount:</AppText>

            <AppFormField
              name="amount"
              placeholder="Input amount of the gas..."
              keyboardType="numeric"
            />
            <Spacer />

            <SubmitButton
              title="Gas"
              isLoading={loading}
              color={loading ? "light" : "primary"}
              disabled={loading ? true : false}
            />
          </FormProvider>

          <Spacer />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // MODAL
  modalContent: {
    backgroundColor: "white",
    padding: 22,
    paddingBottom: 30,
    borderRadius: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  close: {
    alignItems: "flex-end",
  },
});
