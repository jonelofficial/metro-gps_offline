import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

import AppText from "../AppText";
import colors from "../../config/colors";
import defaultStyle from "../../config/styles";
import fonts from "../../config/fonts";
import Fonts from "../Fonts";

function AppFormPicker({ name, items, value, setValue, open, setOpen }) {
  const {
    formState: { errors },
    control,
  } = useFormContext();

  return (
    <>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange } }) => (
          <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={setValue}
            onChangeValue={onChange}
            defaultIndex={0}
            textStyle={[
              defaultStyle.text,
              {
                paddingHorizontal: 5,
                color: colors.lightMedium,
              },
            ]}
            dropDownContainerStyle={[
              defaultStyle.text,
              {
                borderColor: errors[name] ? colors.danger : colors.light,
                backgroundColor: colors.white,
                maxHeight: 150,
              },
            ]}
            labelStyle={[defaultStyle.text, { color: colors.dark }]}
            style={[
              {
                borderColor: errors[name] ? colors.danger : colors.light,
                backgroundColor: colors.light,
                borderRadius: 15,
                borderWidth: 2,
                marginBottom: 8,
              },
            ]}
          />
        )}
      />
      {errors[name] && (
        <Fonts>
          <AppText style={styles.error}>{errors[name].message}</AppText>
        </Fonts>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontFamily: fonts.primaryName,
    fontSize: 15,
  },
  errorBox: {
    borderColor: colors.danger,
  },
});

export default AppFormPicker;
