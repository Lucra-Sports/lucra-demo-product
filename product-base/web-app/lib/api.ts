const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '';

interface User {
  id: number;
  full_name: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  birthday?: string;
}

interface Stats {
  totalNumbersGenerated: number;
  bestNumber: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${baseUrl}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {

      throw new Error(data.error || 'Request failed');
    }
    return data as T;
  } catch (err: any) {
    if (err instanceof Error && /(fetch|NetworkError|ECONNREFUSED)/i.test(err.message)) {
      throw new Error('API server is unreachable');
    }
    throw err;
  }
}

function setUser(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem("rng_user", JSON.stringify(user));
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("rng_user");
  return stored ? (JSON.parse(stored) as User) : null;
}

function getUserId(): number | null {
  return getCurrentUser()?.id ?? null;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("rng_user");
  }
}

export async function login(email: string, password: string): Promise<User> {
  const data = await request<User>("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  setUser(data);
  return data;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  birthday: string;
}

export async function signup(data: SignupData): Promise<User> {
  const result = await request<{ id: number }>("/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: data.name,
      email: data.email,
      password: data.password,
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zip,
      birthday: data.birthday,
    }),
  });
  const user: User = {
    id: result.id,
    full_name: data.name,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    zip_code: data.zip,
    birthday: data.birthday,
  };
  setUser(user);
  return user;
}

export async function generateNumber(): Promise<number> {
  const userId = getUserId();
  const data = await request<{ number: number }>("/rng", {
    headers: {
      "rng-user-id": userId ? String(userId) : "",
    },
  });
  return data.number;
}

export async function getStats(): Promise<Stats> {
  const userId = getUserId();
  return await request<Stats>("/stats", {
    headers: {
      "rng-user-id": userId ? String(userId) : "",
    },
  });
}

interface UpdateProfileData {
  full_name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  birthday: string;
}

export async function updateProfile(data: UpdateProfileData): Promise<User> {
  const userId = getUserId();
  const updated = await request<User>("/update-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "rng-user-id": userId ? String(userId) : "",
    },
    body: JSON.stringify(data),
  });
  setUser(updated);
  return updated;
}

interface NumberRecord {
  id: number;
  value: number;
  created_at: string;
}

interface NumbersResponse {
  numbers: NumberRecord[];
  page: number;
  totalPages: number;
  next: string | null;
}

export async function getNumberHistory(
  page = 1,
  limit = 25
): Promise<NumbersResponse> {
  const userId = getUserId();
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return await request<NumbersResponse>(`/numbers?${params.toString()}`, {
    headers: {
      'rng-user-id': userId ? String(userId) : '',
    },
  });
}