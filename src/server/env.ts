import { z } from "zod";

export const APP_ENVS = ["local", "shared", "production"] as const;
export const STORAGE_MODES = ["local", "api", "r2-s3", "binding"] as const;

const optionalString = z.preprocess(
	(value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
	z.string().optional(),
);

const envSchema = z
	.object({
		APP_ENV: z.enum(APP_ENVS).default("local"),
		STORAGE_MODE: z.enum(STORAGE_MODES).default("local"),
		SHARED_API_BASE_URL: optionalString,
		SHARED_API_TOKEN: optionalString,
		R2_ACCOUNT_ID: optionalString,
		R2_BUCKET_NAME: optionalString,
		R2_ACCESS_KEY_ID: optionalString,
		R2_SECRET_ACCESS_KEY: optionalString,
		R2_ENDPOINT: optionalString,
		LOCAL_SQLITE_PATH: z.string().default("./.local/dev.db"),
		LOCAL_STORAGE_DIR: z.string().default("./.local/uploads"),
	})
	.superRefine((env, context) => {
		if (env.APP_ENV === "shared") {
			for (const key of ["SHARED_API_BASE_URL", "SHARED_API_TOKEN"] as const) {
				if (!env[key]) {
					context.addIssue({ code: "custom", path: [key], message: `${key} is required when APP_ENV=shared` });
				}
			}
		}

		if (env.STORAGE_MODE === "r2-s3") {
			for (const key of ["R2_ACCOUNT_ID", "R2_BUCKET_NAME", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT"] as const) {
				if (!env[key]) {
					context.addIssue({ code: "custom", path: [key], message: `${key} is required when STORAGE_MODE=r2-s3` });
				}
			}
		}
	});

export type AppEnv = z.infer<typeof envSchema>;
export type AppEnvironment = AppEnv["APP_ENV"];
export type StorageMode = AppEnv["STORAGE_MODE"];

export function parseAppEnv(source: Record<string, string | undefined>): AppEnv {
	const result = envSchema.safeParse(source);
	if (result.success) return result.data;

	const message = result.error.issues.map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`).join("; ");
	throw new Error(`Invalid environment configuration: ${message}`);
}

export function getAppEnv() {
	return parseAppEnv(process.env);
}

export function describeRequiredEnv(env = getAppEnv()) {
	return {
		sharedApiConfigured: Boolean(env.SHARED_API_BASE_URL && env.SHARED_API_TOKEN),
		r2S3Configured: Boolean(env.R2_ACCOUNT_ID && env.R2_BUCKET_NAME && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_ENDPOINT),
		localFallbackConfigured: Boolean(env.LOCAL_SQLITE_PATH && env.LOCAL_STORAGE_DIR),
	};
}
