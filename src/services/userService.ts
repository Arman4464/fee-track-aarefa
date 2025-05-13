
export type Parent = {
  id: string;
  email: string;
  isAdmin: boolean;
};

// Mock data for parents
const mockParents: Parent[] = [
  {
    id: "parent-id",
    email: "parent@example.com",
    isAdmin: false
  },
  {
    id: "admin-id",
    email: "admin@aarefatution.com",
    isAdmin: true
  }
];

// Mock service for users - would be replaced with Supabase
export const userService = {
  // Get all parents (exclude admin)
  getAllParents: (): Promise<Parent[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const parents = mockParents.filter(user => !user.isAdmin);
        resolve([...parents]);
      }, 500);
    });
  },
  
  // Add new parent
  addParent: (email: string): Promise<Parent> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check if parent already exists
        const existingParent = mockParents.find(p => p.email.toLowerCase() === email.toLowerCase());
        if (existingParent) {
          reject(new Error("Parent with this email already exists"));
          return;
        }
        
        const newParent = {
          id: `parent-${Date.now()}`,
          email,
          isAdmin: false
        };
        
        mockParents.push(newParent);
        resolve(newParent);
      }, 500);
    });
  },
  
  // Delete parent
  deleteParent: (parentId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockParents.findIndex(p => p.id === parentId);
        if (index === -1 || mockParents[index].isAdmin) {
          reject(new Error("Parent not found or cannot delete admin"));
          return;
        }
        mockParents.splice(index, 1);
        resolve();
      }, 500);
    });
  },
  
  // Get parent by id
  getParentById: (parentId: string): Promise<Parent | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const parent = mockParents.find(p => p.id === parentId);
        resolve(parent || null);
      }, 500);
    });
  },
  
  // Get parent by email
  getParentByEmail: (email: string): Promise<Parent | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const parent = mockParents.find(p => p.email.toLowerCase() === email.toLowerCase());
        resolve(parent || null);
      }, 500);
    });
  }
};
