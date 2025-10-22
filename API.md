# Tantra IDE - API Documentation

## Overview

Tantra IDE provides a comprehensive REST API and WebSocket interface for all IDE functionality. The API is built with Express.js and uses Socket.IO for real-time communication.

**Base URL**: `http://localhost:3001`  
**WebSocket**: `ws://localhost:3001`

## Authentication

Currently, Tantra IDE does not require authentication. All endpoints are publicly accessible.

## API Endpoints

### File Operations

#### GET `/api/files/tree`
Get the file tree structure for a directory.

**Query Parameters**:
- `path` (string, optional): Directory path. Defaults to current directory.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "src",
      "path": "./src",
      "type": "directory",
      "children": [
        {
          "name": "App.tsx",
          "path": "./src/App.tsx",
          "type": "file",
          "size": 1024
        }
      ]
    }
  ]
}
```

#### GET `/api/files/read`
Read file contents.

**Query Parameters**:
- `path` (string, required): File path to read.

**Response**:
```json
{
  "success": true,
  "data": {
    "path": "./src/App.tsx",
    "content": "import React from 'react';\n\nexport default function App() {\n  return <div>Hello World</div>;\n}",
    "size": 1024,
    "lastModified": "2025-01-22T10:30:00Z"
  }
}
```

#### POST `/api/files/write`
Write content to a file.

**Request Body**:
```json
{
  "path": "./src/App.tsx",
  "content": "import React from 'react';\n\nexport default function App() {\n  return <div>Hello World</div>;\n}"
}
```

**Response**:
```json
{
  "success": true,
  "message": "File written successfully"
}
```

#### POST `/api/files/create`
Create a new file or directory.

**Request Body**:
```json
{
  "path": "./src/NewFile.tsx",
  "type": "file",
  "content": "// New file content"
}
```

#### DELETE `/api/files/delete`
Delete a file or directory.

**Request Body**:
```json
{
  "path": "./src/NewFile.tsx"
}
```

### AI Operations

#### POST `/api/ollama/chat`
Send a message to the AI assistant.

**Request Body**:
```json
{
  "id": "msg-123",
  "content": "Create a React component for user login",
  "context": {
    "currentFile": "./src/App.tsx",
    "projectType": "react"
  }
}
```

**Response**: Streaming WebSocket events
- `chat:stream`: Partial response chunks
- `chat:complete`: Final response
- `chat:error`: Error messages

#### POST `/api/ollama/generate`
Generate code from a prompt.

**Request Body**:
```json
{
  "id": "gen-123",
  "prompt": "Create a login form component",
  "language": "typescript"
}
```

### Git Operations

#### GET `/api/git/status`
Get Git repository status.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "path": "./src/App.tsx",
      "status": "modified",
      "staged": false
    }
  ]
}
```

#### GET `/api/git/diff`
Get Git diff for a file.

**Query Parameters**:
- `path` (string, optional): File path. If not provided, shows all changes.

**Response**:
```json
{
  "success": true,
  "data": "diff --git a/src/App.tsx b/src/App.tsx\nindex 1234567..abcdefg 100644\n--- a/src/App.tsx\n+++ b/src/App.tsx\n@@ -1,3 +1,3 @@\n-import React from 'react';\n+import React, { useState } from 'react';\n"
}
```

#### POST `/api/git/commit`
Commit changes to Git.

**Request Body**:
```json
{
  "message": "Add user authentication",
  "files": ["./src/App.tsx"]
}
```

#### POST `/api/git/push`
Push changes to remote repository.

**Request Body**:
```json
{
  "remote": "origin",
  "branch": "main"
}
```

#### POST `/api/git/pull`
Pull changes from remote repository.

**Request Body**:
```json
{
  "remote": "origin",
  "branch": "main"
}
```

### Package Management

#### GET `/api/packages/detect-missing`
Detect missing dependencies.

**Response**:
```json
{
  "success": true,
  "data": ["react-router-dom", "@types/node"]
}
```

#### POST `/api/packages/install`
Install a package.

**Request Body**:
```json
{
  "packageName": "react-router-dom",
  "manager": "npm"
}
```

#### GET `/api/packages/tree`
Get dependency tree.

**Query Parameters**:
- `manager` (string, optional): Package manager. Defaults to "npm".

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "my-project",
    "version": "1.0.0",
    "dependencies": {
      "react": {
        "version": "^18.3.1",
        "dependencies": {}
      }
    }
  }
}
```

### Security Operations

#### POST `/api/security/scan`
Scan for security vulnerabilities.

**Request Body**:
```json
{
  "type": "all"
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "vuln-123",
      "title": "Prototype Pollution",
      "severity": "high",
      "package": "lodash",
      "version": "4.17.20",
      "description": "Prototype pollution vulnerability in lodash"
    }
  ]
}
```

#### POST `/api/security/fix`
Attempt to fix a vulnerability.

**Request Body**:
```json
{
  "vulnerabilityId": "vuln-123",
  "manager": "npm"
}
```

### Media Operations

#### GET `/api/media/all`
Get all media files in the project.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "path": "./assets/logo.png",
      "type": "image",
      "size": 102400,
      "dimensions": "200x200",
      "tags": ["logo", "branding"]
    }
  ]
}
```

#### POST `/api/media/tag`
Generate AI tags for an image.

**Request Body**:
```json
{
  "path": "./assets/logo.png"
}
```

**Response**:
```json
{
  "success": true,
  "data": ["logo", "branding", "company", "design"]
}
```

#### POST `/api/media/optimize`
Optimize an image.

**Request Body**:
```json
{
  "path": "./assets/logo.png",
  "options": {
    "quality": 80,
    "format": "webp"
  }
}
```

### Deployment Operations

#### GET `/api/deployment/platforms`
Get available deployment platforms.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "vercel",
      "name": "Vercel",
      "description": "Deploy to Vercel",
      "enabled": true
    }
  ]
}
```

#### POST `/api/deployment/deploy`
Deploy to a platform.

**Request Body**:
```json
{
  "platform": "vercel",
  "config": {
    "projectName": "my-app",
    "framework": "react"
  }
}
```

### Search Operations

#### GET `/api/search/stackoverflow`
Search Stack Overflow.

**Query Parameters**:
- `query` (string, required): Search query.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "title": "How to use React hooks",
      "url": "https://stackoverflow.com/questions/123",
      "score": 15,
      "tags": ["react", "hooks"]
    }
  ]
}
```

#### GET `/api/search/github`
Search GitHub repositories.

**Query Parameters**:
- `query` (string, required): Search query.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "react",
      "fullName": "facebook/react",
      "description": "A declarative, efficient, and flexible JavaScript library",
      "stars": 200000,
      "url": "https://github.com/facebook/react"
    }
  ]
}
```

### Performance Operations

#### GET `/api/performance/bundle`
Analyze bundle size and composition.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalSize": 1048576,
    "gzippedSize": 262144,
    "files": [
      {
        "name": "main.js",
        "size": 524288,
        "gzippedSize": 131072,
        "type": "js"
      }
    ],
    "duplicates": [],
    "recommendations": ["Enable gzip compression"]
  }
}
```

#### GET `/api/performance/lighthouse`
Run Lighthouse performance audit.

**Query Parameters**:
- `url` (string, optional): URL to audit. Defaults to localhost.

**Response**:
```json
{
  "success": true,
  "data": {
    "performance": 95,
    "accessibility": 90,
    "bestPractices": 88,
    "seo": 92,
    "metrics": {
      "firstContentfulPaint": 1200,
      "largestContentfulPaint": 2500,
      "cumulativeLayoutShift": 0.05
    }
  }
}
```

### Database Operations

#### GET `/api/database/connections`
Detect database connections.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "db-1",
      "name": "PostgreSQL Database",
      "type": "postgresql",
      "host": "localhost",
      "port": 5432,
      "database": "myapp",
      "status": "disconnected"
    }
  ]
}
```

#### POST `/api/database/test`
Test database connection.

**Request Body**:
```json
{
  "connection": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "myapp",
    "username": "user",
    "password": "pass"
  }
}
```

#### POST `/api/database/query`
Execute database query.

**Request Body**:
```json
{
  "connection": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "myapp"
  },
  "query": "SELECT * FROM users LIMIT 10"
}
```

### Agent Operations

#### POST `/api/agent/plan`
Create a task plan.

**Request Body**:
```json
{
  "goal": "Create a user authentication system",
  "context": {
    "projectType": "react",
    "currentFile": "./src/App.tsx"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "plan-123",
    "goal": "Create a user authentication system",
    "tasks": [
      {
        "id": "task-1",
        "title": "Create login component",
        "description": "Build a login form with email and password fields",
        "type": "code",
        "priority": "high",
        "estimatedDuration": 30
      }
    ],
    "status": "ready"
  }
}
```

#### POST `/api/agent/execute-plan`
Execute a task plan.

**Request Body**:
```json
{
  "plan": {
    "id": "plan-123",
    "tasks": [...]
  }
}
```

## WebSocket Events

### Client to Server

#### `chat:message`
Send a chat message to AI.
```json
{
  "id": "msg-123",
  "content": "Hello AI",
  "context": {}
}
```

#### `terminal:input`
Send terminal input.
```json
{
  "input": "npm install react"
}
```

### Server to Client

#### `chat:stream`
AI response chunk.
```json
{
  "id": "msg-123",
  "chunk": "Hello! How can I help you today?"
}
```

#### `chat:complete`
AI response complete.
```json
{
  "id": "msg-123"
}
```

#### `chat:error`
AI response error.
```json
{
  "id": "msg-123",
  "error": "Failed to get response from Ollama"
}
```

#### `terminal:output`
Terminal output.
```json
{
  "output": "npm install react\nadded 1 package"
}
```

#### `file:change`
File system change.
```json
{
  "type": "create",
  "path": "./src/NewFile.tsx"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `FILE_NOT_FOUND`: File does not exist
- `PERMISSION_DENIED`: Insufficient permissions
- `INVALID_REQUEST`: Malformed request
- `OLLAMA_ERROR`: Ollama service error
- `GIT_ERROR`: Git operation failed

## Rate Limiting

Currently no rate limiting is implemented. This may be added in future versions.

## CORS

CORS is enabled for all origins in development mode. In production, configure appropriate CORS settings.

## Health Check

#### GET `/health`
Check API health.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-22T10:30:00Z"
}
```

---

**Note**: This API documentation reflects the current implementation. Some endpoints may return mock data or placeholder responses until full implementation is complete.
