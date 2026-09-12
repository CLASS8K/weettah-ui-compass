// eSIM-capable Android device database — model codes from User-Agent → device name
export const ESIM_ANDROID_MODELS: Record<string, string> = {
  "SM-G980": "Galaxy S20", "SM-G981": "Galaxy S20 5G", "SM-G985": "Galaxy S20+", "SM-G986": "Galaxy S20+ 5G",
  "SM-G988": "Galaxy S20 Ultra", "SM-G780": "Galaxy S20 FE", "SM-G781": "Galaxy S20 FE 5G",
  "SM-G991": "Galaxy S21", "SM-G996": "Galaxy S21+", "SM-G998": "Galaxy S21 Ultra", "SM-G990": "Galaxy S21 FE",
  "SM-S901": "Galaxy S22", "SM-S906": "Galaxy S22+", "SM-S908": "Galaxy S22 Ultra",
  "SM-S911": "Galaxy S23", "SM-S916": "Galaxy S23+", "SM-S918": "Galaxy S23 Ultra", "SM-S711": "Galaxy S23 FE",
  "SM-S921": "Galaxy S24", "SM-S926": "Galaxy S24+", "SM-S928": "Galaxy S24 Ultra",
  "SM-S931": "Galaxy S25", "SM-S936": "Galaxy S25+", "SM-S938": "Galaxy S25 Ultra",
  "SM-F700": "Galaxy Z Flip", "SM-F707": "Galaxy Z Flip 5G", "SM-F711": "Galaxy Z Flip3", "SM-F721": "Galaxy Z Flip4",
  "SM-F731": "Galaxy Z Flip5", "SM-F741": "Galaxy Z Flip6", "SM-F900": "Galaxy Fold", "SM-F907": "Galaxy Fold 5G",
  "SM-F916": "Galaxy Z Fold2", "SM-F926": "Galaxy Z Fold3", "SM-F936": "Galaxy Z Fold4", "SM-F946": "Galaxy Z Fold5", "SM-F956": "Galaxy Z Fold6",
  "SM-N970": "Galaxy Note10", "SM-N975": "Galaxy Note10+", "SM-N980": "Galaxy Note20", "SM-N985": "Galaxy Note20 Ultra",
  "SM-A546": "Galaxy A54", "SM-A556": "Galaxy A55", "SM-A356": "Galaxy A35", "SM-A566": "Galaxy A56",
  "Pixel 3": "Pixel 3", "Pixel 3a": "Pixel 3a", "Pixel 4": "Pixel 4", "Pixel 4a": "Pixel 4a",
  "Pixel 5": "Pixel 5", "Pixel 5a": "Pixel 5a", "Pixel 6": "Pixel 6", "Pixel 6a": "Pixel 6a",
  "Pixel 7": "Pixel 7", "Pixel 7a": "Pixel 7a", "Pixel 8": "Pixel 8", "Pixel 8a": "Pixel 8a",
  "Pixel 9": "Pixel 9", "Pixel Fold": "Pixel Fold",
  "motorola razr 2019": "Motorola Razr 2019", "motorola razr 5G": "Motorola Razr 5G",
  "motorola edge 40": "Motorola Edge 40", "razr 40": "Motorola Razr 40", "razr 40 ultra": "Motorola Razr 40 Ultra",
  "ELS-": "Huawei P40 series", "NOH-": "Huawei Mate 40 Pro",
  "XQ-DQ": "Sony Xperia 1 V", "XQ-EC": "Sony Xperia 1 VI", "XQ-DE": "Sony Xperia 5 V",
  "CPH2173": "Oppo Find X3 Pro", "22081212": "Xiaomi 12T Pro", "2306EPN60": "Xiaomi 13", "23127PN0C": "Xiaomi 14",
  "Nokia G60": "Nokia G60", "Nokia X30": "Nokia X30",
};

export function matchEsimAndroid(modelString: string): string | null {
  if (!modelString) return null;
  for (const [code, name] of Object.entries(ESIM_ANDROID_MODELS)) {
    if (modelString.startsWith(code) || modelString.includes(code)) return name;
  }
  return null;
}
