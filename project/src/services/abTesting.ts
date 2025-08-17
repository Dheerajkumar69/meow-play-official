/**
 * A/B Testing framework for feature experimentation
 */
import { AnalyticsService } from './analytics';

interface Experiment {
  id: string;
  name: string;
  variants: ExperimentVariant[];
  traffic: number; // Percentage of users to include (0-100)
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  targetMetric: string;
  description?: string;
}

interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // Percentage allocation (0-100)
  config: Record<string, any>;
}

interface UserAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: number;
}

export class ABTestingService {
  private static instance: ABTestingService;
  private experiments: Map<string, Experiment> = new Map();
  private userAssignments: Map<string, UserAssignment[]> = new Map();
  private analytics: AnalyticsService;

  private constructor() {
    this.analytics = AnalyticsService.getInstance();
    this.loadExperiments();
    this.loadUserAssignments();
  }

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  /**
   * Create a new experiment
   */
  createExperiment(experiment: Omit<Experiment, 'status'>): void {
    const fullExperiment: Experiment = {
      ...experiment,
      status: 'draft'
    };

    this.experiments.set(experiment.id, fullExperiment);
    this.saveExperiments();
  }

  /**
   * Start an experiment
   */
  startExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.status = 'running';
    experiment.startDate = new Date();
    this.experiments.set(experimentId, experiment);
    this.saveExperiments();

    console.log(`Started experiment: ${experiment.name}`);
  }

  /**
   * Stop an experiment
   */
  stopExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.status = 'completed';
    experiment.endDate = new Date();
    this.experiments.set(experimentId, experiment);
    this.saveExperiments();

    console.log(`Stopped experiment: ${experiment.name}`);
  }

  /**
   * Get variant for a user in an experiment
   */
  getVariant(experimentId: string, userId: string): ExperimentVariant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user is already assigned
    const userAssignments = this.userAssignments.get(userId) || [];
    const existingAssignment = userAssignments.find(a => a.experimentId === experimentId);
    
    if (existingAssignment) {
      const variant = experiment.variants.find(v => v.id === existingAssignment.variantId);
      return variant || null;
    }

    // Check if user should be included in experiment
    if (!this.shouldIncludeUser(userId, experiment.traffic)) {
      return null;
    }

    // Assign user to variant
    const variant = this.assignUserToVariant(userId, experiment);
    if (variant) {
      this.recordAssignment(userId, experimentId, variant.id);
      this.analytics.trackExperiment(experiment.name, variant.name, userId);
    }

    return variant;
  }

  /**
   * Get feature flag value with A/B testing
   */
  getFeatureFlag(flagName: string, userId: string, defaultValue: any = false): any {
    // Check if there's an active experiment for this feature
    const experiment = Array.from(this.experiments.values()).find(
      exp => exp.status === 'running' && exp.name.includes(flagName)
    );

    if (!experiment) {
      return defaultValue;
    }

    const variant = this.getVariant(experiment.id, userId);
    return variant?.config[flagName] ?? defaultValue;
  }

  /**
   * Track conversion for experiment
   */
  trackConversion(experimentId: string, userId: string, metricName: string, value?: number): void {
    const assignment = this.getUserAssignment(userId, experimentId);
    if (!assignment) return;

    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    this.analytics.track('experiment_conversion', {
      experimentId,
      experimentName: experiment.name,
      variantId: assignment.variantId,
      metricName,
      value,
      userId
    });
  }

  /**
   * Get experiment results
   */
  getExperimentResults(experimentId: string): {
    experiment: Experiment;
    variants: Array<{
      variant: ExperimentVariant;
      participants: number;
      conversions: number;
      conversionRate: number;
    }>;
    totalParticipants: number;
    isSignificant: boolean;
  } {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Get all assignments for this experiment
    const allAssignments = Array.from(this.userAssignments.values())
      .flat()
      .filter(a => a.experimentId === experimentId);

    const variantStats = experiment.variants.map(variant => {
      const participants = allAssignments.filter(a => a.variantId === variant.id).length;
      
      // In a real implementation, you'd query your analytics data
      // For now, we'll simulate some conversion data
      const conversions = Math.floor(participants * (0.05 + Math.random() * 0.1));
      const conversionRate = participants > 0 ? (conversions / participants) * 100 : 0;

      return {
        variant,
        participants,
        conversions,
        conversionRate
      };
    });

    const totalParticipants = allAssignments.length;
    
    // Simple significance test (in production, use proper statistical tests)
    const isSignificant = this.calculateStatisticalSignificance(variantStats);

    return {
      experiment,
      variants: variantStats,
      totalParticipants,
      isSignificant
    };
  }

  /**
   * Get all active experiments
   */
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(exp => exp.status === 'running');
  }

  /**
   * Get user's experiment assignments
   */
  getUserExperiments(userId: string): Array<{
    experiment: Experiment;
    variant: ExperimentVariant;
    assignedAt: Date;
  }> {
    const assignments = this.userAssignments.get(userId) || [];
    
    return assignments.map(assignment => {
      const experiment = this.experiments.get(assignment.experimentId)!;
      const variant = experiment.variants.find(v => v.id === assignment.variantId)!;
      
      return {
        experiment,
        variant,
        assignedAt: new Date(assignment.assignedAt)
      };
    }).filter(item => item.experiment && item.variant);
  }

  private shouldIncludeUser(userId: string, trafficPercentage: number): boolean {
    // Use consistent hashing to determine if user should be included
    const hash = this.hashUserId(userId);
    return (hash % 100) < trafficPercentage;
  }

  private assignUserToVariant(userId: string, experiment: Experiment): ExperimentVariant | null {
    const hash = this.hashUserId(userId + experiment.id);
    let cumulativeWeight = 0;
    const randomValue = hash % 100;

    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (randomValue < cumulativeWeight) {
        return variant;
      }
    }

    return experiment.variants[0] || null;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private recordAssignment(userId: string, experimentId: string, variantId: string): void {
    const assignment: UserAssignment = {
      userId,
      experimentId,
      variantId,
      assignedAt: Date.now()
    };

    const userAssignments = this.userAssignments.get(userId) || [];
    userAssignments.push(assignment);
    this.userAssignments.set(userId, userAssignments);
    
    this.saveUserAssignments();
  }

  private getUserAssignment(userId: string, experimentId: string): UserAssignment | null {
    const assignments = this.userAssignments.get(userId) || [];
    return assignments.find(a => a.experimentId === experimentId) || null;
  }

  private calculateStatisticalSignificance(variantStats: any[]): boolean {
    // Simplified significance test - in production use proper statistical methods
    if (variantStats.length < 2) return false;
    
    const [control, treatment] = variantStats;
    const minSampleSize = 100;
    
    return control.participants >= minSampleSize && 
           treatment.participants >= minSampleSize &&
           Math.abs(control.conversionRate - treatment.conversionRate) > 2;
  }

  private loadExperiments(): void {
    try {
      const stored = localStorage.getItem('ab_experiments');
      if (stored) {
        const experiments = JSON.parse(stored);
        experiments.forEach((exp: Experiment) => {
          this.experiments.set(exp.id, exp);
        });
      }
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  private saveExperiments(): void {
    try {
      const experiments = Array.from(this.experiments.values());
      localStorage.setItem('ab_experiments', JSON.stringify(experiments));
    } catch (error) {
      console.error('Failed to save experiments:', error);
    }
  }

  private loadUserAssignments(): void {
    try {
      const stored = localStorage.getItem('ab_user_assignments');
      if (stored) {
        const assignments = JSON.parse(stored);
        Object.entries(assignments).forEach(([userId, userAssignments]) => {
          this.userAssignments.set(userId, userAssignments as UserAssignment[]);
        });
      }
    } catch (error) {
      console.error('Failed to load user assignments:', error);
    }
  }

  private saveUserAssignments(): void {
    try {
      const assignments = Object.fromEntries(this.userAssignments);
      localStorage.setItem('ab_user_assignments', JSON.stringify(assignments));
    } catch (error) {
      console.error('Failed to save user assignments:', error);
    }
  }
}

// Predefined experiments for common features
export const MusicPlayerExperiments = {
  AUTOPLAY_NEXT: 'autoplay_next_song',
  SHUFFLE_ALGORITHM: 'shuffle_algorithm_v2',
  PLAYER_UI: 'player_ui_redesign',
  RECOMMENDATION_ENGINE: 'recommendation_engine_v3'
};
