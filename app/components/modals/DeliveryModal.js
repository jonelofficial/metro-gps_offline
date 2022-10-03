import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { FormProvider } from "react-hook-form";
import Modal from "react-native-modal";

import AppText from "../AppText";
import AppFormField from "../forms/AppFormField";
import Spacer from "../Spacer";
import SubmitButton from "../forms/SubmitButton";
import colors from "../../config/colors";

export default function DeliveryModal({
  arrivedModal,
  setArrivedModal,
  methodDelivery,
  handleDeliveryArrived,
  arrivedLoading,
}) {
  return (
    <View>
      <Modal
        isVisible={arrivedModal}
        animationIn={"slideInLeft"}
        animationOut={"slideOutRight"}
      >
        <KeyboardAwareScrollView>
          <View style={styles.modalContent}>
            <View style={styles.close}>
              <TouchableOpacity
                onPress={() => {
                  setArrivedModal(false);
                }}
              >
                <Ionicons name="ios-close-outline" size={30} />
              </TouchableOpacity>
            </View>

            <Spacer />

            <FormProvider {...methodDelivery} onSubmit={handleDeliveryArrived}>
              <AppText>Odometer:</AppText>

              <AppFormField
                name="odometer"
                placeholder="Input current odometer"
                keyboardType="numeric"
              />

              <AppText>Temperature:</AppText>

              <AppFormField
                name="temperature_arrived"
                placeholder="Input temperature"
                keyboardType="numeric"
              />

              <View
                style={{
                  alignItems: "center",
                  flexDirection: "row",
                }}
              >
                <AppText>Trip Problem:</AppText>
                <AppText
                  style={{
                    fontSize: 13,
                    color: colors.medium,
                  }}
                >{` (optional)`}</AppText>
              </View>

              <AppFormField
                name="trip_problem"
                placeholder="Input trip problem"
              />

              <AppText>Crates Dropped:</AppText>

              <AppFormField
                name="crates_dropped"
                placeholder="Input crates dropped"
                keyboardType="numeric"
              />

              <AppText>Crates Collected:</AppText>

              <AppFormField
                name="crates_collected"
                placeholder="Input crates collected"
                keyboardType="numeric"
              />

              <AppText>Crates Lent:</AppText>

              <AppFormField
                name="crates_lent"
                placeholder="Input crates lent"
                keyboardType="numeric"
              />

              <Spacer />

              <SubmitButton
                title="Submit"
                isLoading={arrivedLoading}
                color={arrivedLoading ? "light" : "primary"}
                disabled={arrivedLoading}
              />
            </FormProvider>
          </View>
        </KeyboardAwareScrollView>
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
