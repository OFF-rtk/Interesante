// src/types/express.d.ts
declare namespace Express {
  export interface Request {
    cookies: { [key: string]: string };
  }
}
