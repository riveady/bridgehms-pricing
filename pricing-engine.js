const roundCurrency = (value) => Math.round(value);

const resolvePatientTier = (patientsPerMonth, patientTiers) => {
    return (
        patientTiers.find((tier) => patientsPerMonth <= tier.max) ??
        patientTiers[patientTiers.length - 1]
    );
};

const resolveScalableInfrastructureCost = (adjustmentConfig, servicePoints) => {
    // Backward compatibility: allow legacy flat numeric adjustment values.
    if (typeof adjustmentConfig === "number") {
        return adjustmentConfig;
    }

    const normalizedPoints = Math.max(1, Number(servicePoints) || 1);
    const baseCost = Number(adjustmentConfig?.baseCost) || 0;
    const perServicePointCost =
        Number(adjustmentConfig?.perServicePointCost) || 0;
    const extraScalingThreshold =
        Number(adjustmentConfig?.extraScalingThreshold) || 0;
    const extraPerPointCost = Number(adjustmentConfig?.extraPerPointCost) || 0;
    const extraPoints = Math.max(0, normalizedPoints - extraScalingThreshold);

    return (
        baseCost +
        normalizedPoints * perServicePointCost +
        extraPoints * extraPerPointCost
    );
};

const resolveDeploymentRecommendation = (input, config) => {
    const { patientsPerMonth, stablePower } = input;
    const { cloudPatientThreshold, hybridPatientThreshold } =
        config.deploymentRecommendations;

    if (patientsPerMonth < cloudPatientThreshold && stablePower) {
        return "Cloud";
    }

    if (patientsPerMonth < hybridPatientThreshold) {
        return "Hybrid";
    }

    return "On-Premise";
};

export function calculatePricing(input, config) {
    const normalizedInput = {
        patientsPerMonth: Math.max(0, Number(input.patientsPerMonth) || 0),
        servicePoints: Math.max(0, Number(input.servicePoints) || 0),
        hasNetwork: Boolean(input.hasNetwork),
        stablePower: Boolean(input.stablePower),
        trainingLevel: input.trainingLevel,
    };

    let setupCost = config.baseSetupCost;
    let monthlyCost = config.baseMonthlyCost;

    // Scale the recurring platform cost to the expected patient load.
    const patientTier = resolvePatientTier(
        normalizedInput.patientsPerMonth,
        config.patientTiers,
    );
    const patientAdjustedMonthlyCost =
        config.baseMonthlyCost * patientTier.multiplier;
    const patientLoadAdjustment =
        patientAdjustedMonthlyCost - config.baseMonthlyCost;
    monthlyCost = patientAdjustedMonthlyCost;

    // Service points affect both rollout effort and recurring support overhead.
    const servicePointSetupCost =
        normalizedInput.servicePoints * config.servicePointCost;
    const servicePointMonthlyCost =
        normalizedInput.servicePoints * config.servicePointMonthlyCost;
    setupCost += servicePointSetupCost;
    monthlyCost += servicePointMonthlyCost;

    // Facilities without baseline infrastructure need extra setup work.
    const noNetworkCost = normalizedInput.hasNetwork
        ? 0
        : resolveScalableInfrastructureCost(
              config.infrastructureAdjustments.noNetwork,
              normalizedInput.servicePoints,
          );
    const unstablePowerCost = normalizedInput.stablePower
        ? 0
        : resolveScalableInfrastructureCost(
              config.infrastructureAdjustments.unstablePower,
              normalizedInput.servicePoints,
          );
    const infrastructureAdjustments = noNetworkCost + unstablePowerCost;
    setupCost += infrastructureAdjustments;

    // Training costs are selected from configuration for maintainability.
    const trainingCost =
        config.trainingCosts[normalizedInput.trainingLevel] ?? 0;
    setupCost += trainingCost;

    return {
        setupCost: roundCurrency(setupCost),
        monthlyCost: roundCurrency(monthlyCost),
        deploymentRecommendation: resolveDeploymentRecommendation(
            normalizedInput,
            config,
        ),
        breakdown: {
            basePlatformCost: roundCurrency(
                config.baseSetupCost + config.baseMonthlyCost,
            ),
            patientLoadAdjustment: roundCurrency(patientLoadAdjustment),
            servicePointCost: roundCurrency(
                servicePointSetupCost + servicePointMonthlyCost,
            ),
            infrastructureAdjustments: roundCurrency(infrastructureAdjustments),
            trainingCost: roundCurrency(trainingCost),
            patientMultiplier: patientTier.multiplier,
        },
    };
}
