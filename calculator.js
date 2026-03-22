import { pricingConfig } from "./pricing-config.js";
import { calculatePricing } from "./pricing-engine.js";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    currencyDisplay: "symbol",
    maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
});

const formatCurrency = (value) => {
    const roundedValue = Math.round(value);
    const absoluteValue = Math.abs(roundedValue);

    if (absoluteValue < 100000) {
        return currencyFormatter.format(roundedValue);
    }

    const compactValue = compactNumberFormatter.format(absoluteValue);
    const sign = roundedValue < 0 ? "-" : "";

    return `${sign}₦${compactValue}`;
};

const clampNumber = (value, minimum = 0) => {
    if (!Number.isFinite(value)) {
        return minimum;
    }

    return Math.max(minimum, value);
};

const animateCurrency = (element, nextValue, formatter = formatCurrency) => {
    const previousValue = Number(element.dataset.value ?? nextValue);

    if (previousValue === nextValue) {
        element.textContent = formatter(nextValue);
        element.dataset.value = String(nextValue);
        return;
    }

    if (element._animationFrame) {
        cancelAnimationFrame(element._animationFrame);
    }

    const duration = 320;
    const startTime = performance.now();

    const step = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue =
            previousValue + (nextValue - previousValue) * easedProgress;

        element.textContent = formatter(Math.round(currentValue));

        if (progress < 1) {
            element._animationFrame = requestAnimationFrame(step);
            return;
        }

        element.dataset.value = String(nextValue);
        delete element._animationFrame;
    };

    element._animationFrame = requestAnimationFrame(step);
};

const setTrainingButtonState = (button, isActive) => {
    button.classList.toggle("bg-white", isActive);
    button.classList.toggle("dark:bg-slate-700", isActive);
    button.classList.toggle("shadow-sm", isActive);
    button.classList.toggle("text-primary", isActive);
    button.classList.toggle("text-slate-500", !isActive);
    button.classList.toggle("hover:text-slate-700", !isActive);
};

const resolveInfrastructureStatus = ({ hasNetwork, stablePower }) => {
    if (hasNetwork && stablePower) {
        return { label: "Low", className: "text-emerald-600" };
    }

    if (!hasNetwork && !stablePower) {
        return { label: "High", className: "text-rose-500" };
    }

    return { label: "Medium", className: "text-amber-500" };
};

const resolveTrainingStatus = (trainingLevel) => {
    switch (trainingLevel) {
        case "fullyTrained":
            return { label: "Low", className: "text-emerald-600" };
        case "noTraining":
            return { label: "High", className: "text-rose-500" };
        default:
            return { label: "Moderate", className: "text-amber-500" };
    }
};

const resolveComplexityStatus = ({ patientsPerMonth, servicePoints }) => {
    const complexityScore = patientsPerMonth / 1000 + servicePoints;

    if (complexityScore >= 12) {
        return { label: "Enterprise", className: "text-rose-500" };
    }

    if (complexityScore >= 7) {
        return { label: "Advanced", className: "text-amber-500" };
    }

    return {
        label: "Standard",
        className: "text-slate-700 dark:text-slate-300",
    };
};

const updateStatusElement = (element, nextState) => {
    element.textContent = nextState.label;
    element.className = `text-sm font-bold ${nextState.className}`;
};

const updateDeploymentBadge = (element, deploymentRecommendation) => {
    const normalizedDeployment = deploymentRecommendation.toUpperCase();
    element.textContent = normalizedDeployment;
};

const updatePatientSliderVisuals = (slider, valueLabel, track, thumb) => {
    const min = Number(slider.min || 0);
    const max = Number(slider.max || 100);
    const value = Number(slider.value || 0);
    const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;

    track.style.width = `${progress}%`;
    thumb.style.left = `calc(${progress}% - 10px)`;
    valueLabel.textContent =
        value >= max ? `${value.toLocaleString()}+` : value.toLocaleString();
};

const createInputReader = (elements) => () => ({
    patientsPerMonth: clampNumber(Number(elements.patientsPerMonth?.value), 0),
    servicePoints: clampNumber(Number(elements.servicePoints?.value), 1),
    hasNetwork: Boolean(elements.hasNetwork?.checked),
    stablePower: Boolean(elements.stablePower?.checked),
    trainingLevel:
        elements.trainingLevelGroup?.dataset?.selectedTrainingLevel ||
        "basicSkills",
});

const initializeCounterButtons = (container, onChange) => {
    const buttons = container.querySelectorAll("[data-counter-action]");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.counterTarget;
            const input = document.getElementById(targetId);

            if (!input) {
                return;
            }

            const currentValue = Number(input.value) || 0;
            const minimum = Number(input.min || 0);
            const step = Number(input.step || 1);
            const nextValue =
                button.dataset.counterAction === "increment"
                    ? currentValue + step
                    : Math.max(minimum, currentValue - step);

            input.value = String(nextValue);
            onChange();
        });
    });
};

const initializeTrainingButtons = (trainingLevelGroup, onChange) => {
    const buttons = Array.from(
        trainingLevelGroup.querySelectorAll("[data-training-level]"),
    );

    const setSelectedTraining = (trainingLevel) => {
        trainingLevelGroup.dataset.selectedTrainingLevel = trainingLevel;
        buttons.forEach((button) => {
            setTrainingButtonState(
                button,
                button.dataset.trainingLevel === trainingLevel,
            );
        });
    };

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            setSelectedTraining(button.dataset.trainingLevel);
            onChange();
        });
    });

    setSelectedTraining(
        trainingLevelGroup.dataset.selectedTrainingLevel || "basicSkills",
    );
};

const initializeCalculator = () => {
    const elements = {
        patientsPerMonth: document.getElementById("patients-per-month"),
        patientsPerMonthValue: document.getElementById(
            "patients-per-month-value",
        ),
        patientsPerMonthTrack: document.getElementById(
            "patients-per-month-track",
        ),
        patientsPerMonthThumb: document.getElementById(
            "patients-per-month-thumb",
        ),
        servicePoints: document.getElementById("service-points"),
        hasNetwork: document.getElementById("has-network"),
        stablePower: document.getElementById("stable-power"),
        trainingLevelGroup: document.getElementById("training-level-group"),
        estimatedSetupCost: document.getElementById("estimated-setup-cost"),
        estimatedMonthlyCost: document.getElementById("estimated-monthly-cost"),
        deploymentRecommendation: document.getElementById(
            "deployment-recommendation",
        ),
        infrastructureStatus: document.getElementById("infrastructure-status"),
        trainingStatus: document.getElementById("training-status"),
        complexityStatus: document.getElementById("complexity-status"),
        breakdown: Object.fromEntries(
            Array.from(
                document.querySelectorAll("[data-breakdown-key]"),
                (element) => [element.dataset.breakdownKey, element],
            ),
        ),
    };

    elements.trainingLevelGroup.dataset.selectedTrainingLevel = "basicSkills";

    const readInput = createInputReader(elements);

    const recalculate = () => {
        const input = readInput();
        const pricing = calculatePricing(input, pricingConfig);

        updatePatientSliderVisuals(
            elements.patientsPerMonth,
            elements.patientsPerMonthValue,
            elements.patientsPerMonthTrack,
            elements.patientsPerMonthThumb,
        );

        animateCurrency(elements.estimatedSetupCost, pricing.setupCost);
        animateCurrency(elements.estimatedMonthlyCost, pricing.monthlyCost);

        Object.entries(pricing.breakdown).forEach(([key, value]) => {
            if (typeof value !== "number" || !elements.breakdown[key]) {
                return;
            }

            animateCurrency(elements.breakdown[key], value);
        });

        updateDeploymentBadge(
            elements.deploymentRecommendation,
            pricing.deploymentRecommendation,
        );
        updateStatusElement(
            elements.infrastructureStatus,
            resolveInfrastructureStatus(input),
        );
        updateStatusElement(
            elements.trainingStatus,
            resolveTrainingStatus(input.trainingLevel),
        );
        updateStatusElement(
            elements.complexityStatus,
            resolveComplexityStatus(input),
        );
    };

    initializeCounterButtons(document, recalculate);
    initializeTrainingButtons(elements.trainingLevelGroup, recalculate);

    [
        elements.patientsPerMonth,
        elements.servicePoints,
        elements.hasNetwork,
        elements.stablePower,
    ]
        .filter((element) => element)
        .forEach((element) => {
            element.addEventListener("input", recalculate);
            element.addEventListener("change", recalculate);
        });

    recalculate();
};

initializeCalculator();
