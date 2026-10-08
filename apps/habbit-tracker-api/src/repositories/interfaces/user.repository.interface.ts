import { User } from "../../types/index.js";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByRole(role: "husband" | "wife"): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  count(): Promise<number>;
}
