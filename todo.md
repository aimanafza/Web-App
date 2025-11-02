# Hierarchical Todo App - TODO

## Core Features
- [ ] User registration system (custom username/password)
- [ ] User login system (custom username/password)
- [x] Create todo lists
- [x] Delete todo lists
- [x] View list progress (completed/total tasks)
- [x] Add tasks to lists
- [x] Delete tasks
- [x] Mark tasks as complete/incomplete
- [x] Create subtasks within tasks
- [x] Move tasks between lists
- [x] Expand/collapse subtasks
- [x] Logout functionality

## UI/Layout
- [ ] Login page (custom form)
- [ ] Registration page (custom form)
- [x] Main dashboard with sidebar (My Lists)
- [x] List cards with progress indicators
- [x] Task list view with all action buttons
- [ ] Responsive design for all pages (in progress)

## Backend
- [ ] User model and authentication (custom with password hashing)
- [x] Todo list model
- [x] Task model with hierarchy support
- [x] Database migrations
- [x] All API endpoints for CRUD operations

## Bugs to Fix
- [x] Edit button (blue pencil) doesn't work - need inline editing
- [x] Sub-subtask creation (3-level hierarchy) - Add button doesn't work for subtasks of subtasks

## Custom Authentication (NEW)
- [ ] Replace Manus OAuth with username/password authentication
- [ ] Create register endpoint with password hashing
- [ ] Create login endpoint with JWT tokens
- [ ] Create register page with form validation
- [ ] Create login page with form validation
- [ ] Update useAuth hook for custom auth
- [ ] Add logout functionality

## Fixed Issues
- [x] Delete button - confirmation dialog working
- [x] Checkbox for subtasks/sub-subtasks - now working
- [x] Cascading completion - when parent marked done, children auto-complete
- [x] List progress metrics - update in real-time

## Testing
- [x] Test registration flow
- [x] Test login flow
- [x] Test task creation and deletion
- [x] Test subtask functionality
- [x] Test moving tasks between lists
- [x] Test progress calculation
- [x] Test edit functionality
- [x] Test 3-level hierarchy (sub-subtasks)
