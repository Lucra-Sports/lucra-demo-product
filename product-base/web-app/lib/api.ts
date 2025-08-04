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

function setUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rng_user', JSON.stringify(user));
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('rng_user');
  return stored ? (JSON.parse(stored) as User) : null;
}

function getUserId(): number | null {
  return getCurrentUser()?.id ?? null;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('rng_user');
  }
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  setUser(data);
  return data as User;
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
  const res = await fetch(`${baseUrl}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Signup failed');
  }
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
  const res = await fetch(`${baseUrl}/rng`, {
    headers: {
      'rng-user-id': userId ? String(userId) : '',
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate number');
  }
  return data.number as number;
}

export async function getStats(): Promise<Stats> {
  const userId = getUserId();
  const res = await fetch(`${baseUrl}/stats`, {
    headers: {
      'rng-user-id': userId ? String(userId) : '',
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch stats');
  }
  return data as Stats;
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
  const res = await fetch(`${baseUrl}/update-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'rng-user-id': userId ? String(userId) : '',
    },
    body: JSON.stringify(data),
  });
  const updated = await res.json();
  if (!res.ok) {
    throw new Error(updated.error || 'Failed to update profile');
  }
  setUser(updated);
  return updated as User;
}
