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
    framing: "This experiment tests what actually happens when you do not obey the urge to restart."
  }
};

const reportPayload = {
  reflection: {
    observedEvidence: [
      "You gave the update without restarting the sentence.",
      "Your teammate responded to the content of the update."
    ],
    usefulInterpretation: "The reported evidence supports that the conversation continued even though the opening felt difficult.",
    nextStep: "In your next short update, continue one sentence without correcting it and notice what the listener does.",
    closing: "Keep the conclusion limited to what actually happened."
  }
};

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
      .mockResolvedValueOnce(new Response(JSON.stringify(reportPayload), { status: 200 }));

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
      report: "I gave the update without restarting, and my teammate responded to the content."
    });

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
