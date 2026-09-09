export function deductionControl(calculatedValue, draftValue, manual) {
  return manual
    ? { inputValue: String(draftValue), queryValue: String(draftValue), mode: "manual" }
    : { inputValue: String(Number(calculatedValue || 0)), queryValue: "", mode: "inherited" };
}

export const shortHoursControl = deductionControl;
