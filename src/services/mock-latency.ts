export function demoWait(ms = 120) {
  if (process.env.NEXT_PUBLIC_DEMO_LATENCY !== "true") return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
