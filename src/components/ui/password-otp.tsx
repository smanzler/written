import React from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./input-otp";

const PasswordOTP = ({
  secure = true,
  ...props
}: Omit<React.ComponentProps<typeof InputOTP>, "render" | "maxLength"> & {
  secure?: boolean;
}) => {
  return (
    <InputOTP {...props} maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} secure={secure} />
        <InputOTPSlot index={1} secure={secure} />
        <InputOTPSlot index={2} secure={secure} />
        <InputOTPSlot index={3} secure={secure} />
        <InputOTPSlot index={4} secure={secure} />
        <InputOTPSlot index={5} secure={secure} />
      </InputOTPGroup>
    </InputOTP>
  );
};

export default PasswordOTP;
