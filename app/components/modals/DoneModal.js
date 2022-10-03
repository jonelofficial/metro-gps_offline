import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FormProvider } from "react-hook-form";

import AppText from "../AppText";
import AppFormField from "../forms/AppFormField";
import Modal from "react-native-modal";
import SubmitButton from "../forms/SubmitButton";
import Spacer from "../Spacer";

const DoneModal = ({
  doneModal,
  setDoneModal,
  methodDone,
  handleDoneButton,
  doneLoading,
}) => {
  return (
    <View>
      <Modal
        isVisible={doneModal}
        animationIn={"slideInLeft"}
        animationOut={"slideOutRight"}
      >
        <View style={styles.modalContent}>
          <View style={styles.close}>
            <TouchableOpacity
              onPress={() => {
                setDoneModal(false);
              }}
            >
              <Ionicons name="ios-close-outline" size={30} />
            </TouchableOpacity>
          </View>

          <Spacer />

          <FormProvider {...methodDone} onSubmit={handleDoneButton}>
            <AppText style={{ marginBottom: 5 }}>Vehicle Odometer:</AppText>

            <AppFormField
              name="odometer_done"
              placeholder="Input vehicle odometer"
              keyboardType="numeric"
            />
            <Spacer />

            <SubmitButton
              title="Done"
              isLoading={doneLoading}
              color={doneLoading ? "light" : "primary"}
              disabled={doneLoading ? true : false}
            />
          </FormProvider>
        </View>
      </Modal>
    </View>
  );
};

export default DoneModal;

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
