import React from 'react';

interface Step {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className = '' }: StepIndicatorProps) {
  return (
    <nav aria-label="Application progress" className={`mb-8 ${className}`}>
      <ol className="flex flex-wrap gap-1 md:gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <li
              key={step.id}
              className={`flex items-center text-sm md:text-base ${index < steps.length - 1 ? 'flex-1' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold
                    ${isCompleted ? 'bg-green-700 text-white' : ''}
                    ${isCurrent ? 'bg-blue-700 text-white' : ''}
                    ${isPending ? 'bg-gray-200 text-gray-600' : ''}`}
                  aria-hidden="true"
                >
                  {isCompleted ? '✓' : index + 1}
                </span>
                <span className={`hidden sm:inline ${isCurrent ? 'font-bold' : ''} ${isPending ? 'text-gray-500' : ''}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden md:block flex-1 h-0.5 mx-3 ${isCompleted ? 'bg-green-700' : 'bg-gray-300'}`} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
      <p className="sr-only">Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.label}</p>
    </nav>
  );
}
