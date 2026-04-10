import { handleStripeWebhook } from "@repo/billing/webhook-handler";

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const arrayBuffer = await request.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  try {
    const result = await handleStripeWebhook(body, signature);
    return Response.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 400 });
  }
}
