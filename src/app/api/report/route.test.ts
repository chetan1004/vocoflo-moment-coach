import { describe, expect, it, vi } from "vitest";
import { generateReflection } from "@/lib/openai-client";
import { ModelOutputError } from "@/lib/model-output-error";
import { POST } from "./route";

vi.mock("@/lib/openai-client", () => ({
  generateReflection: vi.fn(async () => ({
    observedEvidence: ["You asked the question before giving context."],
    usefulInterpretation: "You completed the planned action.",
    nextStep: "Ask one question early in the next meeting.",
    closing: "That is useful evidence from a real moment."
  }))
}));

const mission = {
  title: "Ask first",
  mission: "Ask the question in one sentence.",
  focus: "Direct ask",
  successSignal: "The question is spoken before extra context.",
  framing: "Keep the action small."
};

const situation = {
  situation: "I will ask about the timeline in planning.",
  audience: "My team lead and teammates",
  difficulty: "I worry I will avoid the direct question.",
  timing: "Tomorrow morning"
};

describe("report route", () => {
  it("validates and forwards situation context for valid input", async () => {
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          situation,
          mission,
          report: "I asked the question before explaining why.",
          previousResponses: [],
          responseNumber: 1
        })
      })
    );

    expect(response.status).toBe(200);
    expect(generateReflection).toHaveBeenCalledWith(
      situation,
      mission,
      "I asked the question before explaining why.",
      [],
      1
    );
    await expect(response.json()).resolves.toMatchObject({
      reflection: { nextStep: "Ask one question early in the next meeting." }
    });
  });

  it("does not expose internals in validation errors", async () => {
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({ situation, mission, report: "", previousResponses: [], responseNumber: 1 })
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Please check the form details and try again.");
    expect(JSON.stringify(body)).not.toContain("ZodError");
  });

  it("returns the form message for invalid incoming report data", async () => {
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({ situation, mission, report: "", previousResponses: [], responseNumber: 1 })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Please check the form details and try again."
    });
  });

  it("returns the coaching-service message for model output that exceeds a reflection limit", async () => {
    vi.mocked(generateReflection).mockRejectedValueOnce(new ModelOutputError("schema_validation"));

    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          situation,
          mission,
          report: "I asked the question and my lead answered.",
          previousResponses: [],
          responseNumber: 1
        })
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "The coaching service returned an invalid response. Please try again."
    });
  });

  it("returns the coaching-service message for malformed model JSON", async () => {
    vi.mocked(generateReflection).mockRejectedValueOnce(new ModelOutputError("invalid_json"));

    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          situation,
          mission,
          report: "I asked the question and my lead answered.",
          previousResponses: [],
          responseNumber: 1
        })
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "The coaching service returned an invalid response. Please try again."
    });
  });

  it("returns the coaching-service message for missing model output text", async () => {
    vi.mocked(generateReflection).mockRejectedValueOnce(new ModelOutputError("missing_output_text"));

    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          situation,
          mission,
          report: "I asked the question and my lead answered.",
          previousResponses: [],
          responseNumber: 1
        })
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "The coaching service returned an invalid response. Please try again."
    });
  });

  it("rejects a report response beyond the bounded mission limit", async () => {
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          situation,
          mission,
          report: "I have one more thought.",
          previousResponses: [],
          responseNumber: 4
        })
      })
    );

    expect(response.status).toBe(400);
  });

  it("rejects response number 2 with zero previous responses", async () => {
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          situation,
          mission,
          report: "I want to clarify.",
          previousResponses: [],
          responseNumber: 2
        })
      })
    );

    expect(response.status).toBe(400);
  });

  it("rejects response number 1 with one previous response", async () => {
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          situation,
          mission,
          report: "I want to clarify.",
          previousResponses: [
            {
              userText: "I asked the question.",
              coachResponse: {
                observedEvidence: ["You asked the question."],
                usefulInterpretation: "The report shows the question happened.",
                nextStep: "Ask one direct question in the next meeting.",
                closing: "Stay with the direct observation."
              }
            }
          ],
          responseNumber: 1
        })
      })
    );

    expect(response.status).toBe(400);
  });
});
