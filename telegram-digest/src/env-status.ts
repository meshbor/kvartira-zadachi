import { envStatus } from "./config.ts";

// Prints only set/missing. Never prints token or chat id values.
console.log(JSON.stringify(envStatus(), null, 2));
