import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppText from "../AppText";
import AppButton from "../AppButton";
import Modal from "react-native-modal";
import Spacer from "../Spacer";

const LogoutModal = ({ isModalVisible, toggleModal, handleLogout }) => {
  return (
    <View>
      <Modal isVisible={isModalVisible} style={styles.bottomModal}>
        <View style={styles.modalContent}>
          <View style={styles.close}>
            <TouchableOpacity onPress={toggleModal}>
              <Ionicons name="ios-close-outline" size={30} />
            </TouchableOpacity>
          </View>
          <Spacer />

          <AppText style={{ textAlign: "center" }}>
            Are you sure to logout?
          </AppText>
          <Spacer />
          <AppButton title="Logout" onPress={handleLogout} color="danger" />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomModal: {
    justifyContent: "flex-end",
    margin: 0,
  },
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

export default LogoutModal;
