# Code Patterns & Practices

- Prefer Early Returns Over Nested Conditions
- Use Object Literals Instead of Switch Statements
- Use Type Guards Instead of Type Assertions
- Prefer Immutable Updates
- Use Discriminated Unions for State Management

## Magic Numbers and Strings

Avoid using magic numbers or strings directly in your code. Instead, define them as constants with descriptive names to improve readability and maintainability.

```typescript
const MAX_RETRIES = 3;
const API_BASE_URL = "https://api.example.com";
const ERROR_MESSAGES = {
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "You are not authorized to perform this action",
};
export function fetchData(endpoint: string): Promise<any> {
  return fetch(`${API_BASE_URL}/${endpoint}`).then((response) => {
    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.NOT_FOUND);
    }
    return response.json();
  });
}
```

## Avoid Proxy Methods in Classes

Proxy methods are methods that simply forward calls to another object without adding logic. When using composition, prefer exposing the composed object directly rather than creating unnecessary wrapper methods.

**AVOID:**

```typescript
export class UserApi {
  async fetchUser(userId: string): Promise<User> {}
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {}
}

export class UserManager {
  private api: UserApi;

  constructor(api: UserApi) {
    this.api = api;
  }

  // Proxy methods add no value - just expose the API directly
  fetchUser(userId: string): Promise<User> {
    return this.api.fetchUser(userId);
  }

  updateUser(userId: string, userData: Partial<User>): Promise<User> {
    return this.api.updateUser(userId, userData);
  }
}
```

**PREFER:**

```typescript
class UserApi {
  async fetchUser(userId: string): Promise<User> {}
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {}
}

export class UserManager {
  public readonly api: UserApi;

  constructor(api: UserApi) {
    this.api = api;
  }
}

// Usage: userManager.api.fetchUser(id)
```

### Justified Proxy Methods

Proxy methods are justified when they add logic like validation, logging, error handling, or data transformation:

```typescript
export class UserManager {
  private api: UserApi;

  constructor(api: UserApi) {
    this.api = api;
  }

  async fetchUser(userId: string): Promise<User> {
    if (!userId?.trim()) {
      throw new Error("User ID is required");
    }

    console.log(`Fetching user: ${userId}`);

    try {
      return await this.api.fetchUser(userId);
    } catch (error) {
      console.error(`Failed to fetch user ${userId}:`, error);
      throw error;
    }
  }
}
```

## Breaking Classes into Smaller entities

Each entity is usually defined in its own file.

```typescript
class Document {
  private events: Events;
  private undoRedo: UndoRedo;
  private selection: Selection;

  constructor() {
    this.events = new Events();
    this.undoRedo = new UndoRedo(this.events);
    this.selection = new Selection(this);
  }
}
```

## Don't use constructor public/private typescript shorthands

**AVOID:**

```typescript
class UserManager {
  constructor(private api: UserApi) {}
}
```

**PREFER:**

```typescript
class UserManager {
  private api: UserApi;
  constructor(api: UserApi) {
    this.api = api;
  }
}
```

## Modern Code Style

**AVOID:**

```typescript
if (!groups[extension]) {
  groups[extension] = new Set<string>();
}
```

**PREFER:**

```typescript
groups[extension] ??= new Set<string>();
```
