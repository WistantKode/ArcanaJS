# 🛣️ Routing in ArcanaJS

ArcanaJS provides a powerful and expressive routing system built on top of Express.js. The router offers a clean, Laravel-inspired API with support for route groups, prefixes, middleware, and RESTful resource routes.

## Table of Contents

- [Basic Routing](#basic-routing)
- [Route Methods](#route-methods)
- [Route Parameters](#route-parameters)
- [Middleware](#middleware)
- [Route Groups](#route-groups)
- [Route Prefixes](#route-prefixes)
- [Controller Routes](#controller-routes)
- [Resource Routes](#resource-routes)
- [Advanced Patterns](#advanced-patterns)

## Basic Routing

ArcanaJS routing uses the `Route` class to define routes. You can use either the static `Route` class or create router instances.

### Using the Static Route Class

```typescript
import { Route } from "arcanajs";

// Simple GET route
Route.get("/", (req, res) => {
  res.send("Hello World!");
});

// POST route
Route.post("/users", (req, res) => {
  res.json({ message: "User created" });
});
```

### Creating Router Instances

```typescript
import { Router } from "arcanajs";

const router = Router.create();

router.get("/about", (req, res) => {
  res.send("About page");
});

// Mount the router to your app
router.mount(app, "/");
```

## Route Methods

ArcanaJS supports all standard HTTP methods:

```typescript
Route.get("/users", handler); // GET request
Route.post("/users", handler); // POST request
Route.put("/users/:id", handler); // PUT request
Route.patch("/users/:id", handler); // PATCH request
Route.delete("/users/:id", handler); // DELETE request
Route.options("/users", handler); // OPTIONS request
```

### Handler Functions

Route handlers receive Express's `req`, `res`, and `next` parameters:

```typescript
Route.get("/profile", (req, res, next) => {
  try {
    const user = getUserProfile(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});
```

## Route Parameters

Define dynamic route parameters using the `:param` syntax:

```typescript
// Single parameter
Route.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  res.json({ userId });
});

// Multiple parameters
Route.get("/posts/:postId/comments/:commentId", (req, res) => {
  const { postId, commentId } = req.params;
  res.json({ postId, commentId });
});

// Optional parameters (using Express syntax)
Route.get("/users/:id?", (req, res) => {
  const userId = req.params.id || "all";
  res.json({ userId });
});
```

### Parameter Validation

```typescript
Route.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  // Fetch user...
});
```

## Middleware

Apply middleware to routes for authentication, validation, logging, and more.

### Route-Level Middleware

```typescript
import { authenticate, validateUser } from "./middleware";

// Single middleware
Route.get("/dashboard", authenticate, (req, res) => {
  res.json({ message: "Dashboard" });
});

// Multiple middleware
Route.post("/users", authenticate, validateUser, (req, res) => {
  res.json({ message: "User created" });
});
```

### Middleware Stack

Middleware can be chained using the `middleware()` method:

```typescript
import { authenticate, isAdmin } from "./middleware";

// Apply middleware to subsequent routes
Route.middleware(authenticate, isAdmin)
  .get("/admin/users", (req, res) => {
    res.json({ users: [] });
  })
  .get("/admin/settings", (req, res) => {
    res.json({ settings: {} });
  });
```

### Creating Middleware

```typescript
// middleware/authenticate.ts
import { Request, Response, NextFunction } from "express";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Verify token and attach user to request
    req.user = verifyToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}
```

## Route Groups

Group related routes together with shared configuration.

### Basic Groups

```typescript
Route.group((router) => {
  router.get("/users", userController.index);
  router.get("/users/:id", userController.show);
  router.post("/users", userController.store);
});
```

### Groups with Middleware

```typescript
import { authenticate } from "./middleware";

Route.middleware(authenticate).group((router) => {
  router.get("/profile", profileController.show);
  router.put("/profile", profileController.update);
  router.delete("/account", accountController.destroy);
});
```

### Groups with Prefixes

```typescript
Route.prefix("api/v1").group((router) => {
  router.get("/users", userController.index);
  router.get("/posts", postController.index);
});

// Routes will be:
// GET /api/v1/users
// GET /api/v1/posts
```

### Nested Groups

```typescript
Route.prefix("api")
  .middleware(authenticate)
  .group((router) => {
    // Admin routes
    router
      .prefix("admin")
      .middleware(isAdmin)
      .group((r) => {
        r.get("/users", adminController.users);
        r.get("/stats", adminController.stats);
      });

    // User routes
    router.prefix("user").group((r) => {
      r.get("/profile", userController.profile);
      r.put("/settings", userController.updateSettings);
    });
  });

// Routes will be:
// GET /api/admin/users (with authenticate + isAdmin middleware)
// GET /api/admin/stats (with authenticate + isAdmin middleware)
// GET /api/user/profile (with authenticate middleware)
// PUT /api/user/settings (with authenticate middleware)
```

## Route Prefixes

Add prefixes to routes for versioning or organization.

### Simple Prefix

```typescript
Route.prefix("api").get("/users", handler);

// Route: GET /api/users
```

### Multiple Prefixes

```typescript
Route.prefix("api").prefix("v1").get("/users", handler);

// Route: GET /api/v1/users
```

### Prefix with Groups

```typescript
Route.prefix("api/v1").group((router) => {
  router.get("/users", userHandler);
  router.get("/posts", postHandler);
});

// Routes:
// GET /api/v1/users
// GET /api/v1/posts
```

## Controller Routes

Use controllers to organize your route handlers.

### Defining Controllers

```typescript
// controllers/UserController.ts
import { Request, Response } from "express";

export class UserController {
  async index(req: Request, res: Response) {
    const users = await User.all();
    res.json(users);
  }

  async show(req: Request, res: Response) {
    const user = await User.find(req.params.id);
    res.json(user);
  }

  async store(req: Request, res: Response) {
    const user = await User.create(req.body);
    res.status(201).json(user);
  }

  async update(req: Request, res: Response) {
    const user = await User.find(req.params.id);
    await user.update(req.body);
    res.json(user);
  }

  async destroy(req: Request, res: Response) {
    await User.destroy(req.params.id);
    res.status(204).send();
  }
}
```

### Using Controllers in Routes

```typescript
import { UserController } from "./controllers/UserController";

// Array syntax: [Controller, "method"]
Route.get("/users", [UserController, "index"]);
Route.get("/users/:id", [UserController, "show"]);
Route.post("/users", [UserController, "store"]);
Route.put("/users/:id", [UserController, "update"]);
Route.delete("/users/:id", [UserController, "destroy"]);
```

### Controllers with Middleware

```typescript
import { authenticate, validateUser } from "./middleware";

Route.get("/users", authenticate, [UserController, "index"]);
Route.post("/users", authenticate, validateUser, [UserController, "store"]);
```

## Resource Routes

Quickly define RESTful routes for a resource using the `resource()` method.

### Basic Resource

```typescript
import { UserController } from "./controllers/UserController";

Route.resource("/users", UserController);
```

This automatically creates the following routes:

| Method | URI               | Action  | Controller Method |
| ------ | ----------------- | ------- | ----------------- |
| GET    | `/users`          | index   | `index`           |
| GET    | `/users/create`   | create  | `create`          |
| POST   | `/users`          | store   | `store`           |
| GET    | `/users/:id`      | show    | `show`            |
| GET    | `/users/:id/edit` | edit    | `edit`            |
| PUT    | `/users/:id`      | update  | `update`          |
| PATCH  | `/users/:id`      | update  | `update`          |
| DELETE | `/users/:id`      | destroy | `destroy`         |

### Resource Controller Example

```typescript
// controllers/PostController.ts
export class PostController {
  // GET /posts - List all posts
  async index(req: Request, res: Response) {
    const posts = await Post.all();
    res.json(posts);
  }

  // GET /posts/create - Show create form
  async create(req: Request, res: Response) {
    res.render("posts/create");
  }

  // POST /posts - Store new post
  async store(req: Request, res: Response) {
    const post = await Post.create(req.body);
    res.status(201).json(post);
  }

  // GET /posts/:id - Show single post
  async show(req: Request, res: Response) {
    const post = await Post.find(req.params.id);
    res.json(post);
  }

  // GET /posts/:id/edit - Show edit form
  async edit(req: Request, res: Response) {
    const post = await Post.find(req.params.id);
    res.render("posts/edit", { post });
  }

  // PUT/PATCH /posts/:id - Update post
  async update(req: Request, res: Response) {
    const post = await Post.find(req.params.id);
    await post.update(req.body);
    res.json(post);
  }

  // DELETE /posts/:id - Delete post
  async destroy(req: Request, res: Response) {
    await Post.destroy(req.params.id);
    res.status(204).send();
  }
}
```

### Nested Resources

```typescript
// Posts with comments
Route.prefix("posts/:postId").group((router) => {
  router.resource("/comments", CommentController);
});

// Routes:
// GET    /posts/:postId/comments
// POST   /posts/:postId/comments
// GET    /posts/:postId/comments/:id
// PUT    /posts/:postId/comments/:id
// DELETE /posts/:postId/comments/:id
```

## Advanced Patterns

### API Versioning

```typescript
// API v1
Route.prefix("api/v1").group((router) => {
  router.resource("/users", V1UserController);
  router.resource("/posts", V1PostController);
});

// API v2
Route.prefix("api/v2").group((router) => {
  router.resource("/users", V2UserController);
  router.resource("/posts", V2PostController);
});
```

### Protected Routes

```typescript
import { authenticate, authorize } from "./middleware";

// Public routes
Route.get("/", homeController.index);
Route.post("/login", authController.login);
Route.post("/register", authController.register);

// Protected routes
Route.middleware(authenticate).group((router) => {
  router.get("/dashboard", dashboardController.index);
  router.get("/profile", profileController.show);

  // Admin-only routes
  router
    .middleware(authorize("admin"))
    .prefix("admin")
    .group((r) => {
      r.resource("/users", AdminUserController);
      r.resource("/settings", AdminSettingsController);
    });
});
```

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

Route.prefix("api")
  .middleware(apiLimiter)
  .group((router) => {
    router.get("/users", userController.index);
    router.post("/users", userController.store);
  });
```

### CORS Configuration

```typescript
import cors from "cors";

const corsOptions = {
  origin: "https://example.com",
  optionsSuccessStatus: 200,
};

Route.prefix("api")
  .middleware(cors(corsOptions))
  .group((router) => {
    router.get("/public-data", dataController.public);
  });
```

### File Upload Routes

```typescript
import multer from "multer";

const upload = multer({ dest: "uploads/" });

Route.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: req.file });
});

Route.post("/upload-multiple", upload.array("files", 10), (req, res) => {
  res.json({ files: req.files });
});
```

### Error Handling

```typescript
// Error handling middleware
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
};

// Apply to all routes
app.use(Route.getRouter());
app.use(errorHandler);
```

## Mounting Routes

### Mounting to Express App

```typescript
import express from "express";
import { Route } from "arcanajs";

const app = express();

// Define routes
Route.get("/", homeController.index);
Route.resource("/users", UserController);

// Mount routes to app
Route.mount(app, "/");

app.listen(3000);
```

### Multiple Router Instances

```typescript
import { Router } from "arcanajs";

// API routes
const apiRouter = Router.create();
apiRouter.prefix("api/v1").group((r) => {
  r.resource("/users", UserController);
  r.resource("/posts", PostController);
});

// Admin routes
const adminRouter = Router.create();
adminRouter
  .prefix("admin")
  .middleware(authenticate, isAdmin)
  .group((r) => {
    r.get("/dashboard", adminController.dashboard);
    r.resource("/users", AdminUserController);
  });

// Mount both routers
apiRouter.mount(app, "/");
adminRouter.mount(app, "/");
```

## Best Practices

### 1. Organize Routes by Feature

```typescript
// routes/users.ts
export function registerUserRoutes(router: Router) {
  router.resource("/users", UserController);
  router.get("/users/:id/posts", UserPostController.index);
}

// routes/index.ts
import { registerUserRoutes } from "./users";
import { registerPostRoutes } from "./posts";

Route.group((router) => {
  registerUserRoutes(router);
  registerPostRoutes(router);
});
```

### 2. Use Middleware Wisely

```typescript
// Apply middleware at the appropriate level
Route.middleware(cors()) // Global CORS
  .prefix("api")
  .group((router) => {
    router.middleware(authenticate).group((r) => {
      // Only authenticated routes here
      r.get("/profile", profileController.show);
    });
  });
```

### 3. Keep Controllers Thin

```typescript
// Good: Delegate to services
export class UserController {
  async store(req: Request, res: Response) {
    const user = await UserService.create(req.body);
    res.status(201).json(user);
  }
}

// Avoid: Business logic in controllers
export class UserController {
  async store(req: Request, res: Response) {
    // Too much logic here...
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      ...req.body,
      password: hashedPassword,
    });
    await sendWelcomeEmail(user.email);
    res.status(201).json(user);
  }
}
```

### 4. Use Type Safety

```typescript
import { Request, Response } from "express";

interface CreateUserRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

Route.post("/users", async (req: CreateUserRequest, res: Response) => {
  const { name, email, password } = req.body;
  // TypeScript knows the shape of req.body
});
```

## API Reference

### Router Class

#### Methods

- `create()` - Create a new router instance
- `middleware(...middleware)` - Add middleware to the stack
- `prefix(prefix)` - Add a prefix to routes
- `group(callback)` - Create a route group
- `get(path, ...args)` - Define a GET route
- `post(path, ...args)` - Define a POST route
- `put(path, ...args)` - Define a PUT route
- `patch(path, ...args)` - Define a PATCH route
- `delete(path, ...args)` - Define a DELETE route
- `options(path, ...args)` - Define an OPTIONS route
- `resource(path, controller)` - Define RESTful resource routes
- `getRouter()` - Get the underlying Express router
- `mount(app, basePath)` - Mount the router to an Express app

### Route Class

The `Route` class provides static methods that mirror the `Router` class methods, plus:

- `reset()` - Reset the global router instance

## Summary

ArcanaJS routing provides:

✅ **Clean, expressive syntax** - Laravel-inspired API  
✅ **Middleware support** - Apply middleware at any level  
✅ **Route groups** - Organize related routes  
✅ **Prefixes** - Easy API versioning and organization  
✅ **Controller binding** - Clean separation of concerns  
✅ **Resource routes** - RESTful routes in one line  
✅ **Type safety** - Full TypeScript support  
✅ **Express compatibility** - Built on Express.js

The routing system is flexible enough for simple applications while providing the structure needed for complex, enterprise-level applications.
