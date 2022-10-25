import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FormProvider } from "react-hook-form";

import AppText from "../AppText";
import AppFormField from "../forms/AppFormField";
import Modal from "react-native-modal";
import SubmitButton from "../forms/SubmitButton";
import Spacer from "../Spacer";

const ArrivedModal = ({
  arrivedModal,
  setArrivedModal,
  arrivedMethod,
  handleArrivedButton,
  arrivedModalLoading,
}) => {
  return (
    <View>
      <Modal
        isVisible={arrivedModal}
        animationIn={"slideInLeft"}
        animationOut={"slideOutRight"}
      >
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

          <FormProvider {...arrivedMethod} onSubmit={handleArrivedButton}>
            <AppText style={{ marginBottom: 5 }}>Vehicle Odometer:</AppText>

            <AppFormField
              name="odometer"
              placeholder="Input vehicle odometer"
              keyboardType="numeric"
            />
            <Spacer />

            <SubmitButton
              title="Arrived"
              isLoading={arrivedModalLoading}
              color={arrivedModalLoading ? "light" : "success"}
              disabled={arrivedModalLoading ? true : false}
            />
          </FormProvider>
        </View>
      </Modal>
    </View>
  );
};

export default ArrivedModal;

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
