# Code Style and Standards

## TypeScript Guidelines

### Strict Configuration

Always use TypeScript strict mode:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Type Definitions

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Use types for unions and computed types
type Status = 'pending' | 'success' | 'error';
type UserWithStatus = User & { status: Status };

// Avoid any, use unknown instead
function handleApiResponse(data: unknown) {
  // Type guard
  if (isUser(data)) {
    return data.name;
  }
}
```

### Function Signatures

```typescript
// Be explicit with return types for public APIs
export function calculateEngagement(
  likes: number,
  retweets: number,
  impressions: number
): number {
  return ((likes + retweets) / impressions) * 100;
}

// Use async/await over Promises
async function fetchUserData(userId: string): Promise<User | null> {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}
```

## React Component Standards

### Component Structure

```typescript
// Use functional components with TypeScript
interface Props {
  title: string;
  onSave: (data: FormData) => void;
  isLoading?: boolean;
}

export function MyComponent({ title, onSave, isLoading = false }: Props) {
  // Hooks at the top
  const [data, setData] = useState<FormData | null>(null);
  const { user } = useAuth();

  // Event handlers
  const handleSubmit = useCallback(
    (formData: FormData) => {
      onSave(formData);
    },
    [onSave]
  );

  // Early returns for loading/error states
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Main render
  return (
    <div className="container">
      <h1>{title}</h1>
      {/* Component content */}
    </div>
  );
}
```

### Hooks Usage

```typescript
// Custom hooks for reusable logic
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T) => {
      try {
        setValue(newValue);
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    [key]
  );

  return [value, setStoredValue] as const;
}
```

## Styling Guidelines

### Tailwind CSS Usage

```typescript
// Use consistent spacing and sizing
<div className="container mx-auto px-4 py-8">
  <Card className="card-tron max-w-2xl mx-auto">
    <CardHeader>
      <CardTitle className="text-2xl font-bold text-tron-blue">
        Settings
      </CardTitle>
    </CardHeader>
  </Card>
</div>

// Group related classes
<Button
  className={cn(
    "btn-tron",
    "flex items-center space-x-2",
    "transition-all duration-200",
    isLoading && "opacity-50 cursor-not-allowed"
  )}
>
  Save Settings
</Button>
```

### CSS Custom Properties

```css
/* Use CSS variables for theming */
:root {
  --color-tron-blue: #00d4ff;
  --color-tron-cyan: #00ffff;
  --color-tron-orange: #ff6b00;
}

.card-tron {
  @apply border border-tron-blue/20 bg-card/50 backdrop-blur-sm;
}
```

## Error Handling

### API Error Handling

```typescript
// Consistent error response format
interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// Error handling in API routes
export async function handleApiRequest<T>(
  request: () => Promise<T>
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const data = await request();
    return { data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error };
    }

    return {
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        details: { originalError: error },
      },
    };
  }
}
```

### React Error Boundaries

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## Performance Guidelines

### React Performance

```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  const processedData = useMemo(() => {
    return data.map((item) => expensiveCalculation(item));
  }, [data]);

  return <div>{/* Render processed data */}</div>;
});

// Use useCallback for event handlers passed to children
const handleClick = useCallback(
  (id: string) => {
    onItemClick(id);
  },
  [onItemClick]
);
```

### Bundle Optimization

```typescript
// Use dynamic imports for code splitting
const LazyComponent = lazy(() => import('./LazyComponent'));

// Use dynamic imports for large libraries
async function handleExport() {
  const { exportToCsv } = await import('./exportUtils');
  exportToCsv(data);
}
```

## Naming Conventions

### Variables and Functions

```typescript
// Use camelCase for variables and functions
const userName = 'john_doe';
const calculateTotalScore = (scores: number[]) =>
  scores.reduce((a, b) => a + b, 0);

// Use PascalCase for components and types
interface UserProfile {
  displayName: string;
}

export function UserProfileCard({ user }: { user: UserProfile }) {
  return <div>{user.displayName}</div>;
}
```

### Files and Directories

```
// Use kebab-case for file names
user-profile.tsx
api-client.ts
settings-page.tsx

// Use PascalCase for component files
UserProfile.tsx
SettingsPage.tsx
ApiClient.ts
```

## Import/Export Standards

### Import Organization

```typescript
// 1. Node modules
import React from 'react';
import { NextPage } from 'next';

// 2. Internal modules (absolute imports)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

// 3. Relative imports
import './styles.css';
import { helper } from '../utils/helper';
```

### Export Preferences

```typescript
// Prefer named exports over default exports
export function UserCard() {
  return <div>User Card</div>;
}

export interface UserCardProps {
  user: User;
}

// Use default exports only for pages and main components
export default function SettingsPage() {
  return <div>Settings</div>;
}
```

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Calculates the engagement rate for a social media post
 * @param likes - Number of likes on the post
 * @param retweets - Number of retweets/shares
 * @param impressions - Total number of impressions
 * @returns Engagement rate as a percentage (0-100)
 * @throws {Error} When impressions is zero or negative
 */
export function calculateEngagementRate(
  likes: number,
  retweets: number,
  impressions: number
): number {
  if (impressions <= 0) {
    throw new Error('Impressions must be greater than zero');
  }

  return ((likes + retweets) / impressions) * 100;
}
```

### README Standards

- Include setup instructions
- Document all available scripts
- Provide examples of common tasks
- Keep documentation up to date with code changes
