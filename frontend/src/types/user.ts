    // In ../types/user.ts
    export interface ProfileData {
      name: string;
      bio: string;
      skills: string[];
      avatar: string;
    }

    // Also assuming AuthResponse looks something like this:
    export interface AuthResponse {
      token: string;
      user: User;
    }
    
    export interface User {
      // ... properties of a user, e.g.,
      id: string;
      name: string;
      email: string;
      bio?: string;
      skills?: string[];
      avatar?: string;
      // ... other user properties
    }
    