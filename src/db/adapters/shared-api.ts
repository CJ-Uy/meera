import type { CreateUserInput, DatabaseAdapter, User } from "../types";

type SharedApiOptions = {
	baseUrl: string;
	token: string;
};

export class SharedApiDatabaseAdapter implements DatabaseAdapter {
	readonly adapterName = "shared-api";

	private readonly baseUrl: string;
	private readonly token: string;

	constructor(options: SharedApiOptions) {
		this.baseUrl = options.baseUrl.replace(/\/+$/, "");
		this.token = options.token;
	}

	async listUsers(): Promise<User[]> {
		return this.request<User[]>("/internal/users");
	}

	async createUser(input: CreateUserInput): Promise<User> {
		return this.request<User>("/internal/users", {
			method: "POST",
			body: JSON.stringify(input),
		});
	}

	async getUserById(id: string): Promise<User | null> {
		return this.request<User | null>(`/internal/users/${encodeURIComponent(id)}`);
	}

	private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			...init,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.token}`,
				...init.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`Shared database API request failed with HTTP ${response.status}.`);
		}

		return (await response.json()) as T;
	}
}
