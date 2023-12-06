# ResumEdit: Professional Resume Web App

Welcome to _ResumEdit_, a web-based application designed for professionals to craft and manage their resumes.

## Features

- **Resume Manager**: Build new resumes or modify existing ones from your personal collection of past applications.
- **Resume Editor**: Work on shaping up your resume, one at a time, with a user-friendly interface.

## Technical Stack

- Built using Next.JS 14.
- Server-side state management with Prisma.
- Client-side state management via Zustand, enhanced with persist and immer middleware.

## Data Organization

ResumEdit is structured around a hierarchy of five primary data types. Each type is part of a nested relationship and is managed by a `ParentItemList` object.

### Structure of Data Types

#### Core Element: `ParentItemList`

This is a TypeScript example showing the structure of data types used in ResumEdit:

- **Item Disposition**: Enum to track the status of items (New, Modified, Deleted, Synced).
- **Basic Item Type**: Represents an item with properties like ID, parent ID, creation, and modification timestamps.
- **Various Item Types**: Different types for creating, sending, and managing items in the app and on the server.
- **Parent Item List Type**: A generic type capturing a list of items, their parent ID, and the last modification time.

### Hierarchy of Types

- **User**: Represents a user with one or more resumes.
- **Resume**: A user's resume, encompassing various organizations.
- **Role**: Roles within an organization, detailed with achievements and timeframes.
- **Achievement**: Specific accomplishments within a role, orderable through drag-and-drop.

For managing these components, the app utilizes distinct stores for each hierarchy level: `resumeStore`, `organizationStore`, `roleStore`, and `achievementStore`. These stores are synchronized with the server for real-time updates and management.

## Running the App

For instructions on setting up and running the development version of ResumEdit, please refer to the [Development Guide](./DEVELOPMENT.md).
