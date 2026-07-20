import { safeApiError } from "@/lib/api-errors";
import { generateMission } from "@/lib/openai-client";
import { situationRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const parsed = situationRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return safeApiError(parsed.error);
    }

    const input = parsed.data;
    const mission = await generateMission(input);
    return Response.json({ mission });
  } catch (error) {
    return safeApiError(error);
  }
}
