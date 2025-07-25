import { User } from "./user";

export type UserWithCategory = User & { category: string[] };
