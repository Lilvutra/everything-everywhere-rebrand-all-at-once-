import { proxyFormPost } from "@/lib/backend";

export async function POST(request: Request) {
  return proxyFormPost(request, "/paper-debug/classify-license-plate");
}
