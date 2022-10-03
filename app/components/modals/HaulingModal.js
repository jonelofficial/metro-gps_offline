import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FormProvider } from "react-hook-form";

import AppText from "../AppText";
import AppFormField from "../forms/AppFormField";
import Modal from "react-native-modal";
import Spacer from "../Spacer";
import SubmitButton from "../forms/SubmitButton";

const HaulingModal = ({
  trip,
  haulingModal,
  setHaulingModal,
  methodHaulingArrived,
  handleHaulingSubmit,
  leftLoading,
  arrivedLoading,
}) => {
  return (
    <View>
      <Modal
        isVisible={haulingModal}
        animationIn={"slideInLeft"}
        animationOut={"slideOutRight"}
      >
        <View style={styles.modalContent}>
          <View style={styles.close}>
            <TouchableOpacity
              onPress={() => {
                setHaulingModal(false);
              }}
            >
              <Ionicons name="ios-close-outline" size={30} />
            </TouchableOpacity>
          </View>

          <Spacer />

          <FormProvider
            {...methodHaulingArrived}
            onSubmit={handleHaulingSubmit}
          >
            {trip?.attributes.locations.data.length === 1 ? (
              <>
                <AppText>Gross Weight:</AppText>
                <AppFormField
                  name="gross_weight"
                  placeholder="Input gross weight"
                  keyboardType="numeric"
                />
              </>
            ) : trip?.attributes.locations.data.length === 2 ? (
              <>
                <AppText>Tare Weight:</AppText>
                <AppFormField
                  name="tare_weight"
                  placeholder="Input tare weight"
                  keyboardType="numeric"
                />
                <AppText>Gross Weight:</AppText>
                <AppFormField
                  name="gross_weight"
                  placeholder="Input gross weight"
                  keyboardType="numeric"
                />
                <AppText>Net Weight:</AppText>
                <AppFormField
                  name="net_weight"
                  placeholder="Input net weight"
                  keyboardType="numeric"
                />
              </>
            ) : (
              <>
                <AppText>Tare Weight:</AppText>
                <AppFormField
                  name="tare_weight"
                  placeholder="Input tare weight"
                  keyboardType="numeric"
                />

                <AppText>Gross Weight:</AppText>
                <AppFormField
                  name="gross_weight"
                  placeholder="Input gross weight"
                  keyboardType="numeric"
                />

                <AppText>Net Weight:</AppText>
                <AppFormField
                  name="net_weight"
                  placeholder="Input net weight"
                  keyboardType="numeric"
                />

                <AppText>DOA Count:</AppText>
                <AppFormField
                  name="doa_count"
                  placeholder="Input doa count"
                  keyboardType="numeric"
                />
              </>
            )}

            <Spacer />

            <SubmitButton
              title={
                trip?.attributes.locations.data.length === 1
                  ? "Arrived"
                  : trip?.attributes.locations.data.length === 2
                  ? "Left"
                  : trip?.attributes.locations.data.length > 2 && "Arrived"
              }
              color={
                trip?.attributes.locations.data.length === 1 && !arrivedLoading
                  ? "success"
                  : trip?.attributes.locations.data.length === 2 && !leftLoading
                  ? "danger"
                  : trip?.attributes.locations.data.length > 2 &&
                    !arrivedLoading
                  ? "success"
                  : "light"
              }
              disabled={arrivedLoading || leftLoading}
              isLoading={arrivedLoading || leftLoading}
            />
          </FormProvider>
        </View>
      </Modal>
    </View>
  );
};

export default HaulingModal;

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
