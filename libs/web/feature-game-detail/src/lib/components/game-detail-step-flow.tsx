import type { ActivationStep } from '../game-detail.constants';

export type GameDetailStepFlowProps = {
  steps: ActivationStep[];
};

export function GameDetailStepFlow({ steps }: GameDetailStepFlowProps) {
  return (
    <ol className="step-timeline">
      {steps.map((step) => (
        <li key={step.step} className="step-item">
          <div className="step-node" aria-hidden>
            {step.step}
          </div>
          <div className="step-content">
            <h4 className="step-title">{step.title}</h4>
            <p className="step-description">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
