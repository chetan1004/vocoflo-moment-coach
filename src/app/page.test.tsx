import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

const missionPayload = {
  mission: {
    title: "Continue without correcting",
    mission: "Give the short project update once. If a word feels difficult, continue the sentence without restarting it.",
    focus: "Whether the conversation can continue without correcting the sentence",
    successSignal: "Notice whether the listener responds to the meaning and whether you continue after difficulty.",
    framing: "This mission tests what actually happens when you do not obey the urge to restart."
  }
};

const reportPayload = (nextStep: string) => ({
  reflection: {
    observedEvidence: [
      "You gave the update without restarting the sentence.",
      "Your teammate responded to the content of the update."
    ],
    usefulInterpretation: "The reported evidence supports that the conversation continued even though the opening felt difficult.",
    nextStep,
    closing: "Keep the conclusion limited to what actually happened."
  }
});

describe("Moment Coach UI", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("completes one representative coaching loop and saves local history", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(missionPayload), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(reportPayload("In your next short update, continue one sentence without correcting it and notice what the listener does.")),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(reportPayload("Add one missing fact from the same speaking moment.")), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(reportPayload("Start a new mission when you are ready for another speaking moment.")), {
          status: 200
        })
      );

    render(<Home />);

    expect(screen.getByText("Real-world speaking coaching for people who stutter.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How this coach works" })).toBeInTheDocument();
    expect(screen.getByText(/does not score your speech or give you a pile of techniques/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/upcoming speaking situation/i), "I will give a short project update.");
    await user.type(screen.getByLabelText(/who will you speak with/i), "My team");
    await user.type(screen.getByLabelText(/what feels difficult/i), "I rush the first line.");
    await user.click(screen.getByRole("button", { name: /generate one mission/i }));

    expect(await screen.findByText("Continue without correcting")).toBeInTheDocument();
    expect(screen.getByText("What this mission is testing")).toBeInTheDocument();
    expect(screen.getByText("Evidence to notice")).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toContain(["exper", "iment"].join(""));

    await user.type(
      screen.getByLabelText(/what actually happened/i),
      "I gave the update without restarting, and my teammate responded to the content."
    );
    await user.click(screen.getByRole("button", { name: /get evidence and next step/i }));

    expect(await screen.findByText("Evidence from this moment")).toBeInTheDocument();
    expect(
      screen.getByText("In your next short update, continue one sentence without correcting it and notice what the listener does.")
    ).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toMatchObject({
      situation: {
        situation: "I will give a short project update.",
        audience: "My team",
        difficulty: "I rush the first line."
      },
      mission: missionPayload.mission,
      report: "I gave the update without restarting, and my teammate responded to the content.",
      previousResponses: [],
      responseNumber: 1
    });

    expect(screen.getByRole("button", { name: "Continue this mission" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start a new mission" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue this mission" }));
    expect(screen.getByLabelText(/add clarification/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/add clarification/i), "I also noticed I wanted to correct one word.");
    await user.click(screen.getByRole("button", { name: /send continuation/i }));

    await screen.findByText("Add one missing fact from the same speaking moment.");
    expect(JSON.parse(fetchMock.mock.calls[2][1]?.body as string)).toMatchObject({
      previousResponses: [
        {
          userText: "I gave the update without restarting, and my teammate responded to the content."
        }
      ],
      responseNumber: 2
    });

    await user.click(screen.getByRole("button", { name: "Continue this mission" }));
    await user.type(screen.getByLabelText(/add clarification/i), "I disagree that I fully continued because I paused hard.");
    await user.click(screen.getByRole("button", { name: /send continuation/i }));

    await screen.findByText("This bounded mission thread is complete.");
    expect(screen.queryByRole("button", { name: "Continue this mission" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start a new mission" })).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem("vocoflo.momentCoach.history.v1") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].thread).toHaveLength(3);
    expect(stored[0].endedReason).toBe("max_responses");
    expect(screen.getByRole("heading", { name: "Mission history" })).toBeInTheDocument();
    expect(screen.getByText("4 of 4 total coach responses used")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start a new mission" }));
    expect(screen.getByLabelText(/upcoming speaking situation/i)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("vocoflo.momentCoach.history.v1") || "[]")).toHaveLength(1);

    await waitFor(() => {
      expect(screen.getByText(/I will give a short project update/i)).toBeInTheDocument();
    });
  });

  it("shows recoverable API errors", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "The coaching service could not complete that step. Please try again." }), {
        status: 500
      })
    );

    render(<Home />);

    await user.type(screen.getByLabelText(/upcoming speaking situation/i), "I will ask for timeline clarity.");
    await user.type(screen.getByLabelText(/who will you speak with/i), "My lead");
    await user.type(screen.getByLabelText(/what feels difficult/i), "I avoid asking directly.");
    await user.click(screen.getByRole("button", { name: /generate one mission/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not complete");
  });
});
