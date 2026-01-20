import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
  role: "user" | "admin";
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "7d";

// User storage path
const USERS_FILE = path.join(process.cwd(), "data", "users.json");

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
  }
};

// Load users from file
const loadUsers = (): User[] => {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
};

// Save users to file
const saveUsers = (users: User[]): void => {
  try {
    ensureDataDirectory();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o644 });
  } catch (error) {
    console.error("Error saving users:", error);
    throw new Error("Failed to save user data");
  }
};

// Generate tokens
export const generateTokens = (user: User): AuthTokens => {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return { accessToken, refreshToken };
};

// Verify access token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

// Verify refresh token
const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

// Register new user
export const registerUser = async (userData: RegisterRequest): Promise<AuthTokens> => {
  const { email, username, password } = userData;

  // Validate input
  if (!email || !username || !password) {
    throw new Error("Email, username, and password are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // Check if user already exists
  const users = loadUsers();
  const existingUser = users.find(u => u.email === email || u.username === username);

  if (existingUser) {
    throw new Error("User with this email or username already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const newUser: User = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
    role: "user",
  };

  // Save user
  users.push(newUser);
  saveUsers(users);

  // Generate tokens
  return generateTokens(newUser);
};

// Login user
export const loginUser = async (loginData: LoginRequest): Promise<AuthTokens> => {
  const { email, password } = loginData;

  // Find user
  const users = loadUsers();
  const user = users.find(u => u.email === email.toLowerCase());

  if (!user) {
    throw new Error("Login failed");
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error("Login failed");
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  // Generate tokens
  return generateTokens(user);
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<AuthTokens> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const userId = decoded.userId;

    // Find user
    const users = loadUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Generate new tokens
    return generateTokens(user);
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

// Get user by ID (for middleware)
export const getUserById = (userId: string): User | null => {
  const users = loadUsers();
  return users.find(u => u.id === userId) || null;
};

// Get all users (admin only)
export const getAllUsers = (): Omit<User, 'passwordHash'>[] => {
  return loadUsers().map(user => ({
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    role: user.role,
  }));
};

// Get user by email (for login response)
export const getUserByEmail = (email: string): User | null => {
  const users = loadUsers();
  return users.find(u => u.email === email.toLowerCase()) || null;
};

// Password validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Optional: Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password should contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Change user password
export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> => {
  // Validate inputs
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("Current password, new password, and confirmation are required");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirmation do not match");
  }

  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(`Password validation failed: ${validation.errors.join(", ")}`);
  }

  // Load users and find user
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  const user = users[userIndex];

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Update user
  user.passwordHash = newPasswordHash;
  users[userIndex] = user;

  // Save users
  saveUsers(users);

  console.log(`Password changed for user: ${user.username} (${user.email})`);
};

// Delete user account
export const deleteUserAccount = async (userId: string, password: string): Promise<void> => {
  // Validate input
  if (!password) {
    throw new Error("Password confirmation is required");
  }

  // Load users and find user
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  const user = users[userIndex];

  // Prevent admin deletion
  if (user.role === "admin") {
    throw new Error("Admin accounts cannot be deleted");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Password is incorrect");
  }

  // Remove user
  users.splice(userIndex, 1);

  // Save users
  saveUsers(users);

  console.log(`User account deleted: ${user.username} (${user.email})`);
};

// Initialize with default admin user (for first setup)
export const initializeDefaultAdmin = async (): Promise<void> => {
  const users = loadUsers();

  // Check if admin already exists
  const adminExists = users.some(u => u.role === "admin");

  if (!adminExists) {
    console.log("Creating default admin user...");

    const adminUser: User = {
      id: "admin-" + Date.now(),
      email: "admin@example.com",
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 12),
      createdAt: new Date().toISOString(),
      role: "admin",
    };

    users.push(adminUser);
    saveUsers(users);

    console.log("✅ Default admin created:");
    console.log("   Email: admin@example.com");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!");
  }
};