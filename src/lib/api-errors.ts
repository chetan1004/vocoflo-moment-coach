import { ZodError } from "zod";
import { ModelOutputError } from "./model-output-error";

export const formErrorMessage = "Please check the form details and try again.";
export const invalidModelOutputMessage = "The coaching service returned an invalid response. Please try again.";

export function safeApiError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json(
      { error: formErrorMessage },
      { status: 400 }
    );
  }

  if (error instanceof ModelOutputError) {
    return Response.json({ error: invalidModelOutputMessage }, { status: 502 });
  }

  if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
    return Response.json(
      { error: "The coaching service is not configured yet. Add the server-side OpenAI API key to run live coaching." },
      { status: 503 }
    );
  }

  return Response.json(
    { error: "The coaching service could not complete that step. Please try again." },
    { status: 500 }
  );
}
