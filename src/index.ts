import { connectDBWithRetry } from "@/db";
import { launchBot } from "@/bot";

(async () => {
  await connectDBWithRetry();
  const status = await launchBot();
  console.log(status);
})();
