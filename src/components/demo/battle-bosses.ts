import { asset } from "@/components/demo/shared";

export type BossConfig = {
	id: string;
	name: string;
	kind: string;
	dept: string;
	sprites: {
		idle: string;
		hurt: string;
		attack: string;
		defeated: string;
	};
	accent: "teal" | "sand" | "gold" | "green" | "rose";
};

function spriteSet(id: string) {
	return {
		idle: asset(`battle/${id}/idle.png`),
		hurt: asset(`battle/${id}/hurt.png`),
		attack: asset(`battle/${id}/attack.png`),
		defeated: asset(`battle/${id}/defeated.png`),
	};
}

const cobraSprites = {
	idle: asset("battle/cobra-idle.png"),
	hurt: asset("battle/cobra-hurt.png"),
	attack: asset("battle/cobra-attack.png"),
	defeated: asset("battle/cobra-defeated.png"),
};

export const DEFAULT_BOSS: BossConfig = {
	id: "snag",
	name: "THE SNAG",
	kind: "Campus snag / Hawk type",
	dept: "Unknown",
	sprites: spriteSet("hawk"),
	accent: "teal",
};

export const MYSTERY_BOSS: BossConfig = {
	id: "mystery",
	name: "???",
	kind: "Unknown issue / Mystery type",
	dept: "Unknown",
	sprites: spriteSet("mystery"),
	accent: "teal",
};

export const BOSS_BY_DEPT: Record<string, BossConfig> = {
	IT: {
		id: "hawk",
		name: "GLITCH HAWK",
		kind: "IT outage / Hawk type",
		dept: "IT",
		sprites: spriteSet("hawk"),
		accent: "teal",
	},
	Registrar: {
		id: "cobra",
		name: "RED-TAPE COBRA",
		kind: "Records snag / Cobra type",
		dept: "Registrar",
		sprites: cobraSprites,
		accent: "sand",
	},
	Finance: {
		id: "jackal",
		name: "FEE JACKAL",
		kind: "Balance blocker / Jackal type",
		dept: "Finance",
		sprites: spriteSet("jackal"),
		accent: "gold",
	},
	Health: {
		id: "eagle",
		name: "BACKLOG EAGLE",
		kind: "Care queue / Eagle type",
		dept: "Health",
		sprites: spriteSet("eagle"),
		accent: "green",
	},
	"Student Services": {
		id: "caracal",
		name: "RUNAROUND LYNX",
		kind: "Campus loop / Caracal type",
		dept: "Student Services",
		sprites: spriteSet("caracal"),
		accent: "rose",
	},
};

export function pickBosses(activeDepartments: string[]): BossConfig[] {
	const picked: BossConfig[] = [];
	for (const department of activeDepartments) {
		const boss = BOSS_BY_DEPT[department];
		if (boss && !picked.some((entry) => entry.id === boss.id)) picked.push(boss);
		if (picked.length >= 3) break;
	}
	return picked.length ? picked : [DEFAULT_BOSS];
}
