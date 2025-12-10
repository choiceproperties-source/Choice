import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      id,
      email: insertUser.email,
      passwordHash: insertUser.passwordHash,
      fullName: insertUser.fullName ?? null,
      phone: insertUser.phone ?? null,
      role: insertUser.role ?? null,
      profileImage: insertUser.profileImage ?? null,
      bio: insertUser.bio ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
