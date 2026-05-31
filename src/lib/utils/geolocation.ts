import { toast } from "sonner";
import { APP_CONFIG } from "@/lib/config";

const DENIED_MESSAGE = "位置情報が許可されていません。ブラウザのアドレスバー付近から位置情報を許可してください";

export async function requestGeolocation(): Promise<GeolocationPosition | null> {
  if (!navigator.geolocation) {
    toast.error("お使いのブラウザは位置情報に対応していません");
    return null;
  }
  try {
    return await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: APP_CONFIG.map.geolocationTimeout,
      })
    );
  } catch (e) {
    const err = e as GeolocationPositionError;
    if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
      toast.error(DENIED_MESSAGE);
    }
    return null;
  }
}
