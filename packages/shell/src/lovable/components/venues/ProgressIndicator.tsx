import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center py-4 px-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`progress-step ${
              step < currentStep
                ? "completed"
                : step === currentStep
                ? "active"
                : "pending"
            }`}
          >
            {step < currentStep ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="sr-only">{step}</span>
            )}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`progress-connector w-8 sm:w-12 ${
                step < currentStep ? "active" : "pending"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgressIndicator;
