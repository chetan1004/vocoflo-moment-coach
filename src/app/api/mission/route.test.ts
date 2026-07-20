import { describe, expect, it, vi } from "vitest";
import { generateMission } from "@/lib/openai-client";
import { ModelOutputError } from "@/lib/model-output-error";
import { POST } from "./route";

vi.mock("@/lib/openai-client", () => ({
  generateMission: vi.fn(async () => ({
    title: "Start steady",
    mission: "Pause once, then say the first sentence.",
    focus: "Opening pace",
    successSignal: "You complete the first sentence.",
    framing: "This is a small real-world mission."
  }))
}));

describe("mission route", () => {
  it("returns a mocked mission for valid input", async () => {
    const response = await POST(
      new Request("http://localhost/api/mission", {
        method: "POST",
        body: JSON.stringify({
          situation: "I will update my team in standup.",
          audience: "My team",
          difficulty: "I rush at the start.",
          timing: "Tomorrow"
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      mission: { title: "Start steady" }
    });
  });

  it("returns a safe validation error", async () => {
    const response = await POST(
      new Request("http://localhost/api/mission", {
        method: "POST",
        body: JSON.stringify({ situation: "", audience: "", difficulty: "" })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Please check the form details and try again."
    });
  });

  it("returns the coaching-service message for invalid model output", async () => {
    vi.mocked(generateMission).mockRejectedValueOnce(new ModelOutputError("schema_validation"));

    const response = await POST(
      new Request("http://localhost/api/mission", {
        method: "POST",
        body: JSON.stringify({
          situation: "I will update my team in standup.",
          audience: "My team",
          difficulty: "I rush at the start.",
          timing: "Tomorrow"
        })
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "The coaching service returned an invalid response. Please try again."
    });
  });
});
