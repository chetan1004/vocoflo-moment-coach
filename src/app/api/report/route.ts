import { safeApiError } from "@/lib/api-errors";
import { generateReflection } from "@/lib/openai-client";
import { reportRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const parsed = reportRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return safeApiError(parsed.error);
    }

    const input = parsed.data;
    const reflection = await generateReflection(
      input.situation,
      input.mission,
      input.report,
      input.previousResponses,
      input.responseNumber
    );
    return Response.json({ reflection });
  } catch (error) {
    return safeApiError(error);
  }
}
