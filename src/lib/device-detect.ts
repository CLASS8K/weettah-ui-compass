export type DeviceHint = {
  name: string;
  verdict: "likely" | "unknown";
  note: string;
  search: string;
};

/** Best-effort read of the visitor's own phone from the browser. Never definitive — always paired with the *#06# tip. */
export function detectDevice(userAgent: string): DeviceHint | null {
  const ua = userAgent || "";

  if (/iPad/i.test(ua)) {
    return {
      name: "iPad",
      verdict: "likely",
      note: "iPad Pro (3rd generation) and newer, iPad Air 3 and newer, iPad mini 5 and newer all take an eSIM — as long as it's the Wi-Fi + Cellular model.",
      search: "iPad",
    };
  }

  if (/iPhone/i.test(ua)) {
    const version = Number(/OS (\d+)[._]/.exec(ua)?.[1] ?? 0);
    return version >= 15
      ? {
          name: "iPhone",
          verdict: "likely",
          note: "Your iPhone runs a recent version of iOS, so it almost certainly takes an eSIM. Every iPhone from the XS and XR onwards does — unless it's locked to one network.",
          search: "iPhone",
        }
      : {
          name: "iPhone",
          verdict: "unknown",
          note: "We can see you're on an iPhone but not which one. iPhone XS, XR and newer take an eSIM.",
          search: "iPhone",
        };
  }

  if (/Android/i.test(ua)) {
    const model = /Android [\d.]+;\s*([^;)]+?)(?:\s+Build)?[;)]/.exec(ua)?.[1]?.trim();
    const clean = model && model.length < 40 && !/^[a-z]{2}-[a-z]{2}$/i.test(model) ? model : undefined;
    return {
      name: clean ? `Android — ${clean}` : "Android phone",
      verdict: "unknown",
      note: clean
        ? `We can see your phone reports itself as “${clean}”. Search it below, or dial *#06# — if an EID number appears, it takes an eSIM.`
        : "We can see you're on Android but not which model. Dial *#06# — if an EID number appears, your phone takes an eSIM.",
      search: clean ?? "",
    };
  }

  return null;
}
