import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  return (
    <div className="flex min-w-max items-center justify-center px-2 py-2 sm:px-4 sm:py-3">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => {
        const completed = step < currentStep;
        const active = step === currentStep;
        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                completed
                  ? 'border-primary bg-primary text-primary-foreground'
                  : active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/30 bg-muted text-muted-foreground'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {completed ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <span className="text-xs font-bold">{step}</span>
              )}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`mx-0.5 h-0.5 w-8 sm:w-12 ${
                  completed ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressIndicator;
