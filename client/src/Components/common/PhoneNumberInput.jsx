import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const PhoneNumberInput = ({
    label = "Mobile Number",
    name = "phone",
    value,
    onChange,
    error,
    helperText,
    required = false,
    disabled = false,
    defaultCountry = "IN",
}) => {
    return (
        <div className="w-full space-y-1.5">
            {/* Label — matches Input.jsx */}
            {label && (
                <label
                    htmlFor={name}
                    className="block text-xs font-medium text-slate-700"
                >
                    {label}
                    {required && (
                        <span className="ml-1 text-rose-500">*</span>
                    )}
                </label>
            )}

            {/* Phone input — matches Input.jsx */}
            <div
                className={`
          phone-input-wrapper relative flex h-10 w-full items-center
          rounded-lg border bg-slate-50 transition-all duration-200
          ${error
                        ? "border-rose-500 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100"
                        : "border-slate-200 hover:border-slate-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100"
                    }
          ${disabled ? "cursor-not-allowed bg-slate-100 opacity-70" : ""}
        `}
            >
                <PhoneInput
                    id={name}
                    name={name}
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry={defaultCountry}
                    value={value || undefined}
                    onChange={(phone) => onChange(phone || "")}
                    limitMaxLength
                    disabled={disabled}
                    autoComplete="tel"
                    placeholder="Enter mobile number"
                    className="w-full"
                    numberInputProps={{
                        required,
                        "aria-invalid": Boolean(error),
                        "aria-describedby": error ? `${name}-error` : undefined,
                        className:
                            "phone-number-input h-full w-full min-w-0 border-0 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed",
                    }}
                />
            </div>

            {/* Error message — matches Input.jsx */}
            {error && (
                <p
                    id={`${name}-error`}
                    className="text-xs font-medium text-rose-500"
                    role="alert"
                >
                    {error}
                </p>
            )}

            {!error && helperText && (
                <p className="text-xs text-slate-500">{helperText}</p>
            )}

            {/* Country selector styling */}
            <style>{`
        .phone-input-wrapper .PhoneInput {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
          gap: 8px;
          padding: 0 10px;
        }

        .phone-input-wrapper .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
          margin: 0;
        }

        .phone-input-wrapper .PhoneInputCountrySelect {
          cursor: pointer;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
        }

        .phone-input-wrapper .PhoneInputCountryIcon {
          width: 20px;
          height: 15px;
          overflow: hidden;
          border-radius: 2px;
          box-shadow: none;
        }

        .phone-input-wrapper .PhoneInputCountryIconImg {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .phone-input-wrapper .PhoneInputCountrySelectArrow {
          width: 5px;
          height: 5px;
          margin-left: 2px;
          border-color: #94a3b8;
          opacity: 0.8;
        }

        .phone-input-wrapper .PhoneInputInput {
          flex: 1;
          min-width: 0;
          height: 100%;
          padding: 0;
          border: none;
          outline: none;
          background: transparent;
          box-shadow: none;
          font-size: 14px;
          color: #1e293b;
        }

        .phone-input-wrapper .PhoneInputInput::placeholder {
          color: #94a3b8;
          opacity: 1;
        }

        .phone-input-wrapper .PhoneInputInput:focus {
          outline: none;
          border: none;
          box-shadow: none;
        }
      `}</style>
        </div>
    );
};

export default PhoneNumberInput;
