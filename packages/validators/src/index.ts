import { z } from "zod/v4";

export const unused = z.string().describe(
  `This lib is currently not used as we use drizzle-zod for simple schemas
   But as your application grows and you need other validators to share
   with back and frontend, you can put them in here
  `,
);

// Re-export all validators
export * from "./channel";
export * from "./comment";
export * from "./community";
export * from "./course";
export * from "./member";
export * from "./post";
