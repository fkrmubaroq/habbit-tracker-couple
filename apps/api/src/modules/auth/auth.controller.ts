import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { userRepo } from "../../repositories/repository.factory.js";
import { User } from "../../types/index.js";
import { generateToken } from "../../utils/jwt.util.js";
import { comparePassword, hashPassword } from "../../utils/password.util.js";

// Helper to query partner candidate by role (opposite role)
async function findPartnerCandidate(role: "husband" | "wife"): Promise<User | null> {
  const oppositeRole = role === "husband" ? "wife" : "husband";
  // We check if the repository supports finding by role or queries it.
  // Since we'll add findByRole to the repository, we can call it:
  if ("findByRole" in userRepo) {
    return (userRepo as any).findByRole(oppositeRole);
  }
  return null;
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password, name, avatar_emoji, role } = req.body;

    // 1. Guardrail: Limit of 2 users
    const count = await userRepo.count();
    if (count >= 2) {
      return res.status(400).json({ error: "Registration limit reached. Only 2 users (couple) are allowed." });
    }

    // 2. Check if username exists
    const existingUser = await userRepo.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // 3. Create user
    const password_hash = await hashPassword(password);
    const userId = uuidv4();

    const newUser: User = {
      id: userId,
      username,
      password_hash,
      name,
      avatar_emoji,
      avatar_image: null,
      role,
      partner_id: null,
      theme_preferences: { theme: role === "husband" ? "Duo" : "Sakura" },
    };

    // 4. Autolink partner if the other user exists
    const partner = await findPartnerCandidate(role);
    if (partner) {
      newUser.partner_id = partner.id;
    }

    await userRepo.create(newUser);

    if (partner) {
      // Update partner to point back to the new user
      partner.partner_id = newUser.id;
      await userRepo.update(partner);
    }

    const token = generateToken(newUser.id);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        avatar_emoji: newUser.avatar_emoji,
        role: newUser.role,
        partner_id: newUser.partner_id,
        theme_preferences: newUser.theme_preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    const user = await userRepo.findByUsername(username);
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password (101)" });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password (102)" });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar_emoji: user.avatar_emoji,
        role: user.role,
        partner_id: user.partner_id,
        theme_preferences: user.theme_preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie("token");
  return res.json({ message: "Logout successful" });
}

export async function me(req: Request, res: Response) {
  // req.user is attached by authMiddleware
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar_emoji: user.avatar_emoji,
      avatar_image: user.avatar_image,
      role: user.role,
      partner_id: user.partner_id,
      theme_preferences: user.theme_preferences,
    },
  });
}
