import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { agentAPI } from '../../services/api';
import { 
  Bot, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Plus,
  Eye,
  Save,
  RefreshCw
} from 'lucide-react';

export default function AgentPanel() {
  const [goal, setGoal] = useState('');
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  const { data: context } = useQuery({
    queryKey: ['agent-context'],
    queryFn: () => agentAPI.getContext(),
  });

  const { data: plans, refetch: refetchPlans } = useQuery({
    queryKey: ['agent-plans'],
    queryFn: () => agentAPI.getPlans(),
  });

  const handleCreatePlan = async () => {
    if (!goal.trim()) return;

    try {
      const plan = await agentAPI.createPlan(goal, context);
      setCurrentPlan(plan);
      setActiveTab('plan');
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleExecutePlan = async () => {
    if (!currentPlan) return;

    setIsExecuting(true);
    try {
      const executedPlan = await agentAPI.executePlan(currentPlan);
      setCurrentPlan(executedPlan);
    } catch (error) {
      console.error('Error executing plan:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteTask = async (task: any) => {
    try {
      const executedTask = await agentAPI.executeTask(task, context);
      
      // Update the task in the current plan
      if (currentPlan) {
        const updatedTasks = currentPlan.tasks.map((t: any) => 
          t.id === task.id ? executedTask : t
        );
        setCurrentPlan({ ...currentPlan, tasks: updatedTasks });
      }
    } catch (error) {
      console.error('Error executing task:', error);
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'in_progress':
        return 'text-blue-500';
      case 'pending':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const tabs = [
    { id: 'create', label: 'Create Plan', icon: Plus },
    { id: 'plan', label: 'Current Plan', icon: Eye },
    { id: 'history', label: 'History', icon: RefreshCw },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Autonomous Agent</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent hover:bg-accent/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Create Plan Tab */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">What would you like me to accomplish?</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded bg-background h-32"
                placeholder="Describe your goal in detail. For example: 'Create a React component for user authentication with login and signup forms'"
              />
            </div>

            {context && (
              <div className="bg-card border border-border rounded p-4">
                <h3 className="font-semibold mb-2">Current Context</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  {context.projectType && <div>Project Type: {context.projectType}</div>}
                  {context.gitBranch && <div>Git Branch: {context.gitBranch}</div>}
                  {context.dependencies && <div>Dependencies: {context.dependencies.length} packages</div>}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleCreatePlan}
                disabled={!goal.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Create Plan
              </button>
            </div>
          </div>
        )}

        {/* Current Plan Tab */}
        {activeTab === 'plan' && (
          <div className="space-y-4">
            {!currentPlan ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active plan</p>
                <p className="text-xs">Create a plan to get started</p>
              </div>
            ) : (
              <>
                {/* Plan Header */}
                <div className="bg-card border border-border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{currentPlan.goal}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor('medium')}`}>
                        {currentPlan.status}
                      </span>
                      <button
                        onClick={handleExecutePlan}
                        disabled={isExecuting || currentPlan.status === 'executing'}
                        className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Execute Plan
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentPlan.description}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Estimated Duration: {currentPlan.totalEstimatedDuration} minutes
                    {currentPlan.totalActualDuration && (
                      <span> • Actual: {currentPlan.totalActualDuration} minutes</span>
                    )}
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Tasks</h4>
                  {currentPlan.tasks.map((task: any, index: number) => (
                    <div key={task.id} className="bg-card border border-border rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTaskStatusIcon(task.status)}
                          <span className="font-medium">{task.title}</span>
                          <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {task.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {task.estimatedDuration}min
                          </span>
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleExecuteTask(task)}
                              className="p-1 hover:bg-accent rounded"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {task.tags.map((tag: string, tagIndex: number) => (
                            <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {task.result && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <div className="font-medium text-green-800">Result:</div>
                          <div className="text-green-700">{JSON.stringify(task.result, null, 2)}</div>
                        </div>
                      )}
                      
                      {task.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <div className="font-medium text-red-800">Error:</div>
                          <div className="text-red-700">{task.error}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Plan History</h3>
              <button
                onClick={() => refetchPlans()}
                className="p-2 hover:bg-accent rounded"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            {plans && plans.length > 0 ? (
              <div className="space-y-3">
                {plans.map((plan: any) => (
                  <div key={plan.id} className="bg-card border border-border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{plan.goal}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor('medium')}`}>
                        {plan.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(plan.createdAt).toLocaleDateString()}
                      {plan.completedAt && (
                        <span> • Completed: {new Date(plan.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No plan history</p>
                <p className="text-xs">Create and execute plans to see them here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
