import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FormProvider } from "react-hook-form";

import AppText from "../AppText";
import AppFormField from "../forms/AppFormField";
import Modal from "react-native-modal";
import SubmitButton from "../forms/SubmitButton";
import Spacer from "../Spacer";

const ScanToastModal = ({
  isModalVisible,
  setModalVisible,
  method,
  onSubmit,
}) => {
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
                setModalVisible(false), reset();
              }}
            >
              <Ionicons name="ios-close-outline" size={30} />
            </TouchableOpacity>
          </View>
          <Spacer />

          <FormProvider {...method} onSubmit={onSubmit}>
            <AppText style={{ marginBottom: 5 }}>Vehicle Plate #:</AppText>

            <AppFormField
              name="vehicle_id"
              placeholder="Input vehicle number..."
            />
            <Spacer />

            <SubmitButton title="Enter" />
          </FormProvider>

          <Spacer />
        </View>
      </Modal>
    </View>
  );
};

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

export default ScanToastModal;
