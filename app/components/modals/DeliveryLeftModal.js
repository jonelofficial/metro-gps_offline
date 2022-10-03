import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FormProvider } from "react-hook-form";

import AppText from "../AppText";
import AppFormField from "../forms/AppFormField";
import Modal from "react-native-modal";
import Spacer from "../Spacer";
import SubmitButton from "../forms/SubmitButton";

export default function DeliveryLeftModal({
  leftModal,
  setLeftModal,
  methodLeftDelivery,
  handleDeliveryLeft,
  leftLoading,
}) {
  return (
    <View>
      <Modal
        isVisible={leftModal}
        animationIn={"slideInLeft"}
        animationOut={"slideOutRight"}
      >
        <View style={styles.modalContent}>
          <View style={styles.close}>
            <TouchableOpacity
              onPress={() => {
                setLeftModal(false);
              }}
            >
              <Ionicons name="ios-close-outline" size={30} />
            </TouchableOpacity>
          </View>
          <Spacer />

          <FormProvider {...methodLeftDelivery} onSubmit={handleDeliveryLeft}>
            <AppText>Odometer:</AppText>

            <AppFormField
              name="odometer"
              placeholder="Input current odometer"
              keyboardType="numeric"
            />

            <AppText>Temperature:</AppText>

            <AppFormField
              name="temperature_left"
              placeholder="Input temperature"
              keyboardType="numeric"
            />

            <AppText>Companion:</AppText>

            <AppFormField
              name="companion"
              placeholder="Input companion"
              maxLength={255}
              numberOfLines={4}
              multiline
              style={{ textAlignVertical: "top" }}
            />

            <Spacer />

            <SubmitButton
              title="Submit"
              isLoading={leftLoading}
              color={leftLoading ? "light" : "primary"}
              disabled={leftLoading}
            />
          </FormProvider>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
