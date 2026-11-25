import React from "react";
import { Check } from "lucide-react";

const steps = [
    {
        number: 1,
        title: "Category",
    },
    {
        number: 2,
        title: "Main Product",
    },
    {
        number: 3,
        title: "Brand Product",
    },
];

const WizardProgress = ({ currentStep }) => {
    return (
        <div className="mb-6">

            <div className="flex items-center">

                {steps.map((step, index) => {
                    const completed = currentStep > step.number;
                    const active = currentStep === step.number;

                    return (
                        <React.Fragment key={step.number}>

                            <div className="flex flex-col items-center">

                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                                        completed
                                            ? "border-orange-500 bg-orange-500 text-white"
                                            : active
                                            ? "border-orange-500 bg-orange-50 text-orange-600"
                                            : "border-slate-200 bg-white text-slate-400"
                                    }`}
                                >
                                    {completed ? (
                                        <Check size={17} />
                                    ) : (
                                        step.number
                                    )}
                                </div>

                                <span
                                    className={`mt-2 text-xs font-medium ${
                                        active || completed
                                            ? "text-orange-600"
                                            : "text-slate-400"
                                    }`}
                                >
                                    {step.title}
                                </span>

                            </div>

                            {index !== steps.length - 1 && (
                                <div
                                    className={`mx-3 mb-5 h-0.5 flex-1 ${
                                        currentStep > step.number
                                            ? "bg-orange-500"
                                            : "bg-slate-200"
                                    }`}
                                />
                            )}

                        </React.Fragment>
                    );
                })}

            </div>

        </div>
    );
};

export default WizardProgress;