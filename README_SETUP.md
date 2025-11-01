# Hierarchical Todo App - Setup & Run Guide

A full-stack hierarchical todo application with user authentication, multi-level task nesting, and real-time updates.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (with npm or pnpm)
- MySQL 8.0+ or compatible database

### Installation

1. **Extract the zip file:**
   ```bash
   unzip hierarchical_todo_app.zip
   cd hierarchical_todo_app
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=mysql://user:password@localhost:3306/hierarchical_todo_app
   JWT_SECRET=your-secret-key-here
   VITE_APP_ID=your-app-id
   VITE_APP_TITLE=Hierarchical Todo App
   VITE_APP_LOGO=https://example.com/logo.png
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
   ```

4. **Set up the database:**
   ```bash
   pnpm db:push
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`

### Running on Port 5002

To run on port 5002 instead of 3000, modify the `package.json` or set the PORT environment variable:

```bash
PORT=5002 pnpm dev
```

Or edit `vite.config.ts` and change the server port configuration.

## 📋 Features

### ✅ Implemented
- **User Authentication** - Manus OAuth integration with secure sessions
- **Todo Lists** - Create, edit, and delete multiple todo lists
- **Hierarchical Tasks** - Support for 3-level deep task nesting:
  - Level 1: Main tasks
  - Level 2: Subtasks
  - Level 3: Sub-subtasks
- **Task Management**
  - ✅ Mark tasks complete/incomplete
  - ✅ Edit task titles inline
  - ✅ Delete tasks
  - ✅ Move tasks between lists
  - ✅ Expand/collapse subtasks
- **Progress Tracking** - Real-time completion percentage per list
- **Dark Theme UI** - Modern, responsive design with Tailwind CSS

## 🏗️ Project Structure

```
hierarchical_todo_app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── App.tsx        # Main app component
│   │   └── index.css      # Global styles
│   └── index.html
├── server/                # Express backend
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # Database queries
│   └── _core/             # Authentication & utilities
├── drizzle/               # Database schema & migrations
│   └── schema.ts
└── package.json
```

## 🔧 Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Push database schema changes
pnpm db:push

# Generate database migrations
pnpm db:generate

# Run tests
pnpm test
```

## 📱 API Endpoints

All API endpoints are tRPC procedures under `/api/trpc`:

### Lists
- `lists.getAll` - Get all lists for current user
- `lists.create` - Create a new list
- `lists.delete` - Delete a list
- `lists.getStats` - Get completion stats for a list

### Tasks
- `tasks.getByList` - Get all tasks in a list
- `tasks.create` - Create a new task or subtask
- `tasks.update` - Update task title
- `tasks.toggleComplete` - Mark task complete/incomplete
- `tasks.delete` - Delete a task
- `tasks.moveToList` - Move task to another list
- `tasks.getSubtasks` - Get subtasks for a task

## 🎨 Customization

### Changing Colors
Edit `client/src/index.css` to modify the color scheme. The app uses CSS variables for theming.

### Modifying Database Schema
1. Edit `drizzle/schema.ts`
2. Run `pnpm db:push` to apply changes
3. Restart the dev server

### Adding Features
1. Add database tables to `drizzle/schema.ts`
2. Add query helpers to `server/db.ts`
3. Add tRPC procedures to `server/routers.ts`
4. Create UI components in `client/src/pages/` or `client/src/components/`

## 🐛 Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check DATABASE_URL in `.env.local`
- Ensure database exists: `CREATE DATABASE hierarchical_todo_app;`

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 pnpm dev
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📦 Deployment

### Build for Production
```bash
pnpm build
pnpm start
```

### Docker Deployment
Create a `Dockerfile` in the root:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

Build and run:
```bash
docker build -t hierarchical-todo-app .
docker run -p 3000:3000 -e DATABASE_URL=... hierarchical-todo-app
```

## 📝 License

MIT

## 🤝 Support

For issues or questions, refer to the inline code comments or check the component documentation.

---

**Happy organizing!** 🎯
