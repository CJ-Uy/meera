import type { AppEnv } from "./env";
import { getAppEnv } from "./env";

export function getSharedApiBackendEnv(source: AppEnv = getAppEnv()): AppEnv {
	return {
		...source,
		APP_ENV: "local",
		STORAGE_MODE: "binding",
	};
}
