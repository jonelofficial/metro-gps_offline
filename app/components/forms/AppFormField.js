import { Controller, useFormContext } from "react-hook-form";
import { StyleSheet } from "react-native";

import AppText from "../AppText";
import AppTextInput from "../AppTextInput";
import colors from "../../config/colors";
import fonts from "../../config/fonts";
import Fonts from "../Fonts";

function AppFormField({
  name,
  icon,
  style,
  containerStyle,
  disabled,
  defaultValue,
  ...otherProps
}) {
  const {
    formState: { errors },
    control,
  } = useFormContext();

  return (
    <>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextInput
            containerStyle={containerStyle}
            error={errors[name] && styles.errorBox}
            style={style}
            secIcon={icon}
            onChangeText={onChange}
            onBlur={onBlur}
            defaultValue={defaultValue}
            {...otherProps}
            disabled={disabled}
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

export default AppFormField;
