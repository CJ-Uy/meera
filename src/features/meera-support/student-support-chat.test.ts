import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  deriveCaseStage,
  deriveSupportStage,
} from "@/features/meera-support/support-stage";
import type { SupportTicketResult } from "@/features/ai/ai-types";

const ticket: SupportTicketResult = {
  id: "tkt_123",
  ticketNumber: "MEERA-123",
  office: "Finance/Billing",
  category: "Registration hold",
  priority: "High",
  studentFacingSummary: "I created a ticket for the bursar to review the hold.",
};

describe("student demo live support page", () => {
  it("uses the live support chat on /demo/student instead of the scripted student experience", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/demo/student/page.tsx"),
      "utf8",
    );

    expect(source).toContain("StudentSupportChat");
    expect(source).not.toContain("StudentExperience");
  });

  it("drives visual stage states from the chat transcript and ticket result", () => {
    expect(
      deriveSupportStage({ messages: [], sending: false, ticket: null }).state,
    ).toBe("ready");
    expect(
      deriveSupportStage({
        messages: [
          { role: "user", content: "I cannot register before tomorrow" },
        ],
        sending: true,
        ticket: null,
      }).state,
    ).toBe("probing");
    expect(
      deriveSupportStage({
        messages: [
          {
            role: "assistant",
            content: "I am routing this to Finance/Billing for staff review.",
          },
        ],
        sending: false,
        ticket: null,
      }).state,
    ).toBe("routing");
    expect(
      deriveSupportStage({ messages: [], sending: false, ticket }).state,
    ).toBe("ticket-created");
  });

  it("shows the case meter and ticket visibility copy", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/meera-support/student-support-chat.tsx",
      ),
      "utf8",
    );

    expect(source).toContain("Case meter");
    expect(source).toContain("CaseMeter");
    expect(source).toContain("Visible in admin");
    expect(source).toContain("/demo/admin/inbox");
  });

  it("advances the case meter from intake through a filed ticket", () => {
    expect(deriveCaseStage({ messages: [], ticket: null }).stage).toBe(0);
    expect(
      deriveCaseStage({
        messages: [{ role: "user", content: "My Wi-Fi is down" }],
        ticket: null,
      }).stage,
    ).toBe(1);
    expect(
      deriveCaseStage({
        messages: [
          { role: "user", content: "My Wi-Fi is down" },
          { role: "assistant", content: "When did it start?" },
        ],
        ticket: null,
      }).stage,
    ).toBe(2);
    expect(
      deriveCaseStage({
        messages: [
          { role: "user", content: "My Wi-Fi is down" },
          { role: "assistant", content: "I am routing this to IT staff." },
        ],
        ticket: null,
      }).stage,
    ).toBe(3);
    const packaged = deriveCaseStage({ messages: [], ticket });
    expect(packaged.stage).toBe(4);
    expect(packaged.fixed).toBe(true);
    expect(
      deriveCaseStage({
        messages: [{ role: "user", content: "help" }],
        ticket: null,
        hasError: true,
      }).damage,
    ).toBe(true);
  });

  it("includes a chat-to-battle toggle on the student screen", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/meera-support/student-support-chat.tsx",
      ),
      "utf8",
    );

    expect(source).toContain("BattleView");
    expect(source).toContain("ViewToggle");
    expect(source).toContain("Battle mode - Mound showdown");
    expect(source).toContain('type StudentView = "chat" | "battle";');
  });
});
