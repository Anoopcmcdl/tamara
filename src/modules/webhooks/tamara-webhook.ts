import { type Readable } from "node:stream";

import { type NextApiRequest } from "next";

export const tamaraWebhookHandler = async (req: NextApiRequest) => {
  const body = await buffer(req);

  const unsafeParsedBody = JSON.parse(body.toString());

  console.log("\n\n\n unsafeParsedBody", unsafeParsedBody, "\n\n\n");
};

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
