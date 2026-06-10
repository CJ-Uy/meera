const baseUrl = process.env.SHARED_API_BASE_URL ?? process.env.ADMIN_SEED_BASE_URL ?? "http://localhost:3000";
const token = process.env.SHARED_API_TOKEN ?? process.env.ADMIN_SEED_TOKEN;

if (!token) {
	console.error("Set SHARED_API_TOKEN or ADMIN_SEED_TOKEN before seeding admin data.");
	process.exit(1);
}

const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/admin/seed`, {
	method: "POST",
	headers: {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	},
	body: JSON.stringify({}),
});

if (!response.ok) {
	console.error(`Admin seed failed with HTTP ${response.status}: ${await response.text()}`);
	process.exit(1);
}

console.log("Admin seed completed.");
