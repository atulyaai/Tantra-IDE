export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'code' | 'file' | 'git' | 'deploy' | 'test' | 'research' | 'other';
    subtasks: Task[];
    dependencies: string[];
    estimatedDuration: number;
    actualDuration?: number;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    assignedTo?: string;
    tags: string[];
    context?: any;
    result?: any;
    error?: string;
}
export interface TaskPlan {
    id: string;
    goal: string;
    description: string;
    tasks: Task[];
    status: 'planning' | 'ready' | 'executing' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    totalEstimatedDuration: number;
    totalActualDuration?: number;
}
export interface AgentContext {
    currentFile?: string;
    projectType?: string;
    gitBranch?: string;
    recentChanges?: string[];
    dependencies?: string[];
    environment?: string;
}
export declare function createTaskPlan(goal: string, context?: AgentContext): Promise<TaskPlan>;
export declare function executeTask(task: Task, context?: AgentContext): Promise<Task>;
export declare function executeTaskPlan(plan: TaskPlan): Promise<TaskPlan>;
export declare function getTaskPlans(): Promise<TaskPlan[]>;
export declare function saveTaskPlan(plan: TaskPlan): Promise<void>;
export declare function getTaskPlan(id: string): Promise<TaskPlan | null>;
export declare function getAgentContext(): Promise<AgentContext>;
//# sourceMappingURL=agentService.d.ts.map