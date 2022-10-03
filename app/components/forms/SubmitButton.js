import { useFormContext } from "react-hook-form";

import AppButton from "../AppButton";

function SubmitButton({ title, isLoading, color, disabled, ...otherProps }) {
  const { handleSubmit, onSubmit } = useFormContext();
  return (
    <AppButton
      title={title}
      onPress={handleSubmit(onSubmit)}
      isLoading={isLoading && isLoading}
      color={color && color}
      disabled={disabled && disabled}
      {...otherProps}
    />
  );
}

export default SubmitButton;
