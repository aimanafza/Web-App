# Hierarchical Todo App - Setup & Run Guide

A full-stack hierarchical todo application with **custom username/password authentication**, multi-level task nesting, and real-time updates.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (with npm or pnpm)
- No database server needed! Uses SQLite (file-based database)

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

3. **Set up the database:**
   ```bash
   node init-db.mjs
   ```
   This will create an `app.db` file in your project root (SQLite database) with all tables and a demo user.
   
   **Alternative (if using MySQL):**
   ```bash
   pnpm db:push
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`

### Demo Credentials

Once the app is running, you can log in with:
- **Username:** `demo`
- **Password:** `demo123`

Or create a new account using the registration page.

### Running on a Different Port

To run on a different port (e.g., 5002), set the PORT environment variable:

```bash
PORT=5002 pnpm dev
```

## 📋 Features

### ✅ Implemented
- **Custom Authentication** - Username/password registration and login with JWT sessions
- **SQLite Database** - File-based, no setup required, perfect for development
- **Todo Lists** - Create, edit, and delete multiple todo lists
- **Hierarchical Tasks** - Support for 3-level deep task nesting:
  - Level 1: Main tasks
  - Level 2: Subtasks
  - Level 3: Sub-subtasks
- **Task Management**
  - ✅ Mark tasks complete/incomplete
  - ✅ Edit task titles inline
  - ✅ Delete tasks with confirmation
  - ✅ Move tasks between lists
  - ✅ Expand/collapse subtasks
- **Progress Tracking** - Real-time completion percentage per list
- **Dark Theme UI** - Modern, responsive design with Tailwind CSS
- **Improved Dialog Readability** - Optimized colors for better contrast in move/delete dialogs

## 🏗️ Project Structure

```
hierarchical_todo_app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (Login, Register, Home)
│   │   ├── components/    # Reusable UI components
│   │   ├── App.tsx        # Main app component with routing
│   │   └── index.css      # Global styles
│   └── index.html
├── server/                # Express backend
│   ├── routers.ts         # tRPC procedures (auth, lists, tasks)
│   ├── db.ts              # Database queries
│   └── _core/             # Authentication & utilities
├── drizzle/               # Database schema & migrations
│   └── schema.ts
├── app.db                 # SQLite database (created after pnpm db:push)
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

### Authentication
- `auth.register` - Create a new user account
- `auth.login` - Log in with username and password
- `auth.logout` - Log out and clear session
- `auth.me` - Get current user info

### Lists
- `lists.getAll` - Get all lists for current user
- `lists.create` - Create a new list
- `lists.delete` - Delete a list
- `lists.getStats` - Get completion stats for a list

### Tasks
- `task.getByList` - Get all tasks in a list
- `task.create` - Create a new task or subtask
- `task.updateTitle` - Update task title
- `task.toggleComplete` - Mark task complete/incomplete
- `task.delete` - Delete a task
- `task.moveToList` - Move task to another list
- `task.getSubtasks` - Get subtasks for a task

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

### Database Issues
- **SQLite:** The database file is created automatically at `./app.db`
  - To reset: Delete `app.db` and run `node init-db.mjs` again
  - The demo user will be recreated automatically
- **MySQL:** Make sure MySQL server is running and connection string is correct in `.env.local`

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

### Login Not Working
- Make sure the database is properly set up:
  - For SQLite: Run `node init-db.mjs`
  - For MySQL: Run `pnpm db:push`
- Verify the demo user exists (username: `demo`, password: `demo123`)
- Check that the dev server is running without errors
- Try clearing browser cookies and logging in again

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
docker run -p 3000:3000 hierarchical-todo-app
```

### Deploying to Railway/Render/DigitalOcean
1. Push your code to GitHub (already done!)
2. Connect your GitHub repository to your hosting platform
3. Set environment variables if needed (DATABASE_URL is optional for SQLite)
4. Deploy and get a live URL with your custom domain

## 📝 License

MIT

## 🤝 Support

For issues or questions, refer to the inline code comments or check the component documentation.

---

**Happy organizing!** 🎯
