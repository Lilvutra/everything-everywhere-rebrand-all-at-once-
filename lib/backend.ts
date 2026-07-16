import { NextResponse } from "next/server";

function getBackendEnv() {
  const baseUrl = process.env.BACKEND_BASE_URL?.trim();
  const apiKey = process.env.BACKEND_API_KEY?.trim();

  if (!baseUrl) {
    throw new Error("Missing BACKEND_BASE_URL");
  }
  if (!apiKey) {
    throw new Error("Missing BACKEND_API_KEY");
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
  };
}

export async function proxyFormPost(request: Request, backendPath: string) {
  try {
    const { baseUrl, apiKey } = getBackendEnv();
    const formData = await request.formData();

    const response = await fetch(`${baseUrl}${backendPath}`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: formData,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown proxy error",
      },
      { status: 500 },
    );
  }
}
