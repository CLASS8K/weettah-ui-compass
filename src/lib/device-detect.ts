import { matchEsimAndroid } from "./esim-devices";

export type DeviceCheck =
  | { status: "supported"; device: string; note: string }
  | { status: "check"; device: string; note: string }
  | { status: "desktop" };

type HighEntropyNavigator = Navigator & {
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
    getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string; platform?: string }>;
  };
};

const DIAL_TIP = "To be sure, dial *#06#. If an EID number appears, your phone supports eSIM.";

// Best-effort automatic check from the visitor's own browser. Browsers never
// report eSIM support directly, so we infer it from the iOS version (iOS 17+
// only runs on iPhone XS/XR and newer, which all have eSIM) or the Android
// model code (via User-Agent Client Hints on Chrome, or the classic UA).
export async function checkThisDevice(nav: Navigator): Promise<DeviceCheck> {
  const ua = nav.userAgent || "";

  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && nav.maxTouchPoints > 1)) {
    return {
      status: "check",
      device: "iPad",
      note: "Recent iPads support eSIM if they're the Wi-Fi + Cellular model. Wi-Fi-only iPads can't use one.",
    };
  }

  if (/iPhone/i.test(ua)) {
    const major = Number(/OS (\d+)[._]/.exec(ua)?.[1] ?? 0);
    if (major >= 17) {
      return {
        status: "supported",
        device: "iPhone",
        note: "Your iPhone runs iOS 17 or later, and every iPhone that can run it supports eSIM. It just needs to be unlocked, not tied to one network.",
      };
    }
    return {
      status: "check",
      device: "iPhone",
      note: `iPhone XS, XR and every newer iPhone support eSIM. Your iOS version doesn't tell us which model you have. ${DIAL_TIP}`,
    };
  }

  const uaData = (nav as HighEntropyNavigator).userAgentData;
  const isAndroid = /Android/i.test(ua) || uaData?.platform === "Android";
  if (isAndroid) {
    let model = "";
    try {
      model = (await uaData?.getHighEntropyValues?.(["model"]))?.model?.trim() ?? "";
    } catch {
      // Client Hints unavailable (Firefox, Samsung Internet on some versions).
    }
    if (!model) {
      const fromUa = /Android [\d.]+;\s*([^;)]+?)(?:\s+Build)?[;)]/.exec(ua)?.[1]?.trim() ?? "";
      // Chrome's reduced UA reports the placeholder "K" instead of the model.
      if (fromUa && fromUa !== "K" && fromUa.length < 40) model = fromUa;
    }
    const matched = model ? matchEsimAndroid(model) : null;
    if (matched) {
      return {
        status: "supported",
        device: matched,
        note: "Your phone supports eSIM. It just needs to be unlocked, not tied to one network.",
      };
    }
    return {
      status: "check",
      device: model ? `Android (${model})` : "Android phone",
      note: `This model isn't on our list yet, but many Android phones support eSIM. ${DIAL_TIP}`,
    };
  }

  return { status: "desktop" };
}
