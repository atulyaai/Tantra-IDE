import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
const execAsync = promisify(exec);
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
// Task Planning
export async function createTaskPlan(goal, context) {
    try {
        // Use AI to break down the goal into tasks
        const tasks = await generateTasksFromGoal(goal, context);
        const plan = {
            id: `plan-${Date.now()}`,
            goal,
            description: `Plan to achieve: ${goal}`,
            tasks,
            status: 'ready',
            createdAt: new Date(),
            updatedAt: new Date(),
            totalEstimatedDuration: tasks.reduce((sum, task) => sum + task.estimatedDuration, 0),
        };
        return plan;
    }
    catch (error) {
        console.error('Task plan creation error:', error);
        throw error;
    }
}
async function generateTasksFromGoal(goal, context) {
    try {
        const prompt = `
You are an AI task planner. Break down the following goal into specific, actionable tasks:

Goal: ${goal}

Context:
${context ? JSON.stringify(context, null, 2) : 'No specific context provided'}

Please create a detailed task breakdown with:
1. Specific, actionable tasks
2. Estimated duration for each task (in minutes)
3. Task dependencies
4. Priority levels
5. Task types

Return the tasks as a JSON array with this structure:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "type": "code|file|git|deploy|test|research|other",
    "priority": "low|medium|high|critical",
    "estimatedDuration": 30,
    "dependencies": [],
    "tags": ["tag1", "tag2"]
  }
]
`;
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: 'qwen2.5-coder:7b',
            prompt,
            stream: false,
        });
        const tasksText = response.data.response;
        // Extract JSON from the response
        const jsonMatch = tasksText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Could not parse task JSON from AI response');
        }
        const tasksData = JSON.parse(jsonMatch[0]);
        return tasksData.map((taskData, index) => ({
            id: `task-${Date.now()}-${index}`,
            title: taskData.title,
            description: taskData.description,
            status: 'pending',
            priority: taskData.priority,
            type: taskData.type,
            subtasks: [],
            dependencies: taskData.dependencies || [],
            estimatedDuration: taskData.estimatedDuration,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: taskData.tags || [],
        }));
    }
    catch (error) {
        console.error('Task generation error:', error);
        // Fallback to basic task creation
        return [{
                id: `task-${Date.now()}`,
                title: goal,
                description: `Complete: ${goal}`,
                status: 'pending',
                priority: 'medium',
                type: 'other',
                subtasks: [],
                dependencies: [],
                estimatedDuration: 60,
                createdAt: new Date(),
                updatedAt: new Date(),
                tags: [],
            }];
    }
}
// Task Execution
export async function executeTask(task, context) {
    const startTime = Date.now();
    try {
        task.status = 'in_progress';
        task.updatedAt = new Date();
        // Execute based on task type
        let result;
        switch (task.type) {
            case 'code':
                result = await executeCodeTask(task, context);
                break;
            case 'file':
                result = await executeFileTask(task, context);
                break;
            case 'git':
                result = await executeGitTask(task, context);
                break;
            case 'deploy':
                result = await executeDeployTask(task, context);
                break;
            case 'test':
                result = await executeTestTask(task, context);
                break;
            case 'research':
                result = await executeResearchTask(task, context);
                break;
            default:
                result = await executeGenericTask(task, context);
        }
        task.status = 'completed';
        task.result = result;
        task.actualDuration = Math.round((Date.now() - startTime) / 1000 / 60); // minutes
        task.completedAt = new Date();
    }
    catch (error) {
        task.status = 'failed';
        task.error = error.message;
        task.actualDuration = Math.round((Date.now() - startTime) / 1000 / 60);
    }
    task.updatedAt = new Date();
    return task;
}
async function executeCodeTask(task, context) {
    // Use AI to generate or modify code
    const prompt = `
You are an AI coding assistant. Please help with this task:

Task: ${task.title}
Description: ${task.description}

Context:
${context ? JSON.stringify(context, null, 2) : 'No specific context'}

Please provide:
1. The code solution
2. Explanation of the approach
3. Any additional files that need to be created or modified

Return your response in a structured format.
`;
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
        model: 'qwen2.5-coder:7b',
        prompt,
        stream: false,
    });
    return {
        type: 'code_generation',
        content: response.data.response,
        timestamp: new Date().toISOString(),
    };
}
async function executeFileTask(task, context) {
    // Handle file operations
    const filePath = extractFilePathFromTask(task);
    if (task.title.toLowerCase().includes('create')) {
        await fs.writeFile(filePath, '');
        return { type: 'file_created', path: filePath };
    }
    else if (task.title.toLowerCase().includes('delete')) {
        await fs.unlink(filePath);
        return { type: 'file_deleted', path: filePath };
    }
    else if (task.title.toLowerCase().includes('read')) {
        const content = await fs.readFile(filePath, 'utf-8');
        return { type: 'file_read', path: filePath, content };
    }
    return { type: 'file_operation', path: filePath };
}
async function executeGitTask(task, context) {
    const commands = extractGitCommandsFromTask(task);
    const results = [];
    for (const command of commands) {
        try {
            const { stdout } = await execAsync(command, { cwd: WORKSPACE_PATH });
            results.push({ command, output: stdout, success: true });
        }
        catch (error) {
            results.push({ command, error: error.message, success: false });
        }
    }
    return { type: 'git_operations', results };
}
async function executeDeployTask(task, context) {
    // Handle deployment tasks
    const deploymentType = extractDeploymentTypeFromTask(task);
    // This would integrate with the deployment service
    return {
        type: 'deployment',
        deploymentType,
        status: 'completed',
        timestamp: new Date().toISOString(),
    };
}
async function executeTestTask(task, context) {
    // Run tests
    const testCommand = await detectTestCommand();
    try {
        const { stdout } = await execAsync(testCommand, { cwd: WORKSPACE_PATH });
        return {
            type: 'test_execution',
            command: testCommand,
            output: stdout,
            success: true,
        };
    }
    catch (error) {
        return {
            type: 'test_execution',
            command: testCommand,
            error: error.message,
            success: false,
        };
    }
}
async function executeResearchTask(task, context) {
    // Use search capabilities to research
    const searchQuery = extractSearchQueryFromTask(task);
    // This would integrate with the search service
    return {
        type: 'research',
        query: searchQuery,
        results: 'Research results would be fetched here',
        timestamp: new Date().toISOString(),
    };
}
async function executeGenericTask(task, context) {
    // Generic task execution using AI
    const prompt = `
Please help complete this task:

Task: ${task.title}
Description: ${task.description}

Provide a detailed response on how to complete this task.
`;
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
        model: 'qwen2.5-coder:7b',
        prompt,
        stream: false,
    });
    return {
        type: 'generic_task',
        content: response.data.response,
        timestamp: new Date().toISOString(),
    };
}
// Helper functions
function extractFilePathFromTask(task) {
    // Extract file path from task description
    const pathMatch = task.description.match(/['"]([^'"]*\.\w+)['"]/);
    return pathMatch ? pathMatch[1] : 'unknown.txt';
}
function extractGitCommandsFromTask(task) {
    const commands = [];
    if (task.title.toLowerCase().includes('commit')) {
        commands.push('git add .');
        commands.push('git commit -m "Auto-commit from task execution"');
    }
    if (task.title.toLowerCase().includes('push')) {
        commands.push('git push');
    }
    if (task.title.toLowerCase().includes('pull')) {
        commands.push('git pull');
    }
    return commands;
}
function extractDeploymentTypeFromTask(task) {
    if (task.title.toLowerCase().includes('vercel'))
        return 'vercel';
    if (task.title.toLowerCase().includes('netlify'))
        return 'netlify';
    if (task.title.toLowerCase().includes('aws'))
        return 'aws';
    return 'unknown';
}
function extractSearchQueryFromTask(task) {
    // Extract search terms from task description
    return task.description.split(' ').slice(0, 5).join(' ');
}
async function detectTestCommand() {
    // Detect test command based on project type
    try {
        // Check for package.json
        const packageJsonPath = path.join(WORKSPACE_PATH, 'package.json');
        await fs.access(packageJsonPath);
        return 'npm test';
    }
    catch {
        return 'echo "No test command detected"';
    }
}
// Plan Execution
export async function executeTaskPlan(plan) {
    plan.status = 'executing';
    plan.updatedAt = new Date();
    const startTime = Date.now();
    try {
        // Execute tasks in dependency order
        const executedTasks = new Set();
        const taskMap = new Map(plan.tasks.map(task => [task.id, task]));
        while (executedTasks.size < plan.tasks.length) {
            let progressMade = false;
            for (const task of plan.tasks) {
                if (executedTasks.has(task.id))
                    continue;
                // Check if dependencies are met
                const dependenciesMet = task.dependencies.every(depId => executedTasks.has(depId));
                if (dependenciesMet) {
                    const updatedTask = await executeTask(task);
                    taskMap.set(task.id, updatedTask);
                    executedTasks.add(task.id);
                    progressMade = true;
                    // Update the task in the plan
                    const taskIndex = plan.tasks.findIndex(t => t.id === task.id);
                    if (taskIndex !== -1) {
                        plan.tasks[taskIndex] = updatedTask;
                    }
                }
            }
            if (!progressMade) {
                // Circular dependency or error
                plan.status = 'failed';
                break;
            }
        }
        if (plan.status !== 'failed') {
            plan.status = 'completed';
            plan.completedAt = new Date();
        }
        plan.totalActualDuration = Math.round((Date.now() - startTime) / 1000 / 60);
        plan.updatedAt = new Date();
    }
    catch (error) {
        plan.status = 'failed';
        plan.updatedAt = new Date();
    }
    return plan;
}
// Task Management
export async function getTaskPlans() {
    // In a real implementation, this would read from a database
    return [];
}
export async function saveTaskPlan(plan) {
    // In a real implementation, this would save to a database
    console.log('Saving task plan:', plan.id);
}
export async function getTaskPlan(id) {
    // In a real implementation, this would read from a database
    return null;
}
// Agent Context Management
export async function getAgentContext() {
    try {
        const context = {};
        // Get current Git branch
        try {
            const { stdout } = await execAsync('git branch --show-current', { cwd: WORKSPACE_PATH });
            context.gitBranch = stdout.trim();
        }
        catch {
            // Not a git repository
        }
        // Get recent changes
        try {
            const { stdout } = await execAsync('git log --oneline -5', { cwd: WORKSPACE_PATH });
            context.recentChanges = stdout.split('\n').filter(line => line.trim());
        }
        catch {
            // No git history
        }
        // Detect project type
        try {
            const packageJsonPath = path.join(WORKSPACE_PATH, 'package.json');
            await fs.access(packageJsonPath);
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            if (packageJson.dependencies?.react) {
                context.projectType = 'react';
            }
            else if (packageJson.dependencies?.vue) {
                context.projectType = 'vue';
            }
            else if (packageJson.dependencies?.next) {
                context.projectType = 'nextjs';
            }
            else {
                context.projectType = 'node';
            }
            context.dependencies = Object.keys(packageJson.dependencies || {});
        }
        catch {
            context.projectType = 'unknown';
        }
        return context;
    }
    catch (error) {
        console.error('Error getting agent context:', error);
        return {};
    }
}
//# sourceMappingURL=agentService.js.map