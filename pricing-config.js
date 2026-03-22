// Central pricing controls for the estimator.
// Values below are estimated Nigerian market prices in NGN for healthcare IT and EMR deployments.
// Update values here to change pricing behavior without touching calculator logic.
export const pricingConfig = {
    // One-time EMR implementation and project kickoff fee typically charged per deployment.
    baseSetupCost: 3000000,
    // Starting recurring subscription for platform access, hosting, and baseline support.
    baseMonthlyCost: 35000,

    // Patient volume tiers that scale the monthly platform cost.
    // The first tier whose max is greater than or equal to the current volume is used.
    patientTiers: [
        // Up to 1000 patients per month keeps the base monthly cost unchanged.
        { max: 1000, multiplier: 1 },
        // Mid-size facilities get a moderate monthly multiplier.
        { max: 5000, multiplier: 1.2 },
        // Larger facilities require more system capacity and support.
        { max: 10000, multiplier: 1.5 },
        // Very high-volume facilities use the highest monthly multiplier.
        { max: Infinity, multiplier: 2 },
    ],

    // One-time setup cost added for each service point, department, or deployment location.
    servicePointCost: 450000,
    // Recurring monthly overhead added for each service point for support and maintenance.
    servicePointMonthlyCost: 12000,

    // One-time setup surcharges for missing or unreliable facility infrastructure.
    // These are modeled to scale with service points because larger footprints need
    // more cable distance, switching, access points, and backup power capacity.
    infrastructureAdjustments: {
        // Network build-out model for facilities with no existing internal network.
        // Formula: baseCost + (servicePoints * perServicePointCost) +
        //          (max(servicePoints - extraScalingThreshold, 0) * extraPerPointCost)
        noNetwork: {
            // Fixed baseline for core router, first switch, rack, patching, and commissioning.
            baseCost: 800000,
            // Incremental LAN rollout per service point (structured cabling, ports, AP extension, labor).
            perServicePointCost: 60000,
            // Beyond this count, longer cable runs and additional network segmentation become more common.
            extraScalingThreshold: 6,
            // Additional per-point uplift for larger footprints.
            extraPerPointCost: 80000,
        },
        // Power resilience model for facilities with unstable electricity.
        // Formula: baseCost + (servicePoints * perServicePointCost) +
        //          (max(servicePoints - extraScalingThreshold, 0) * extraPerPointCost)
        unstablePower: {
            // Fixed baseline for inverter/control gear, protection devices, and installation setup.
            baseCost: 1500000,
            // Incremental backup capacity and wiring per service point.
            perServicePointCost: 130000,
            // Above this point count, larger battery banks and distribution expansion are typical.
            extraScalingThreshold: 4,
            // Additional per-point uplift for high-load facilities.
            extraPerPointCost: 50000,
        },
    },

    // One-time onboarding and enablement costs based on staff IT readiness.
    trainingCosts: {
        // No added onboarding cost when staff are already proficient.
        fullyTrained: 0,
        // Moderate onboarding support for staff with basic IT familiarity.
        basicSkills: 400000,
        // Full onboarding package for teams with little or no prior training.
        noTraining: 900000,
    },

    // Patient-volume cutoffs used to recommend the best deployment model.
    deploymentRecommendations: {
        // Below this threshold, stable sites are recommended for full cloud deployment.
        cloudPatientThreshold: 1500,
        // Below this threshold, hybrid deployment is recommended before moving on-premise.
        hybridPatientThreshold: 10000,
    },
};

/*
References and sources used for the NGN estimates above
Reviewed: 2026-03-13

1. Nigerian network infrastructure benchmarks used for infrastructureAdjustments.noNetwork
    Source: Jumia Nigeria search results for 24-port switches
    URL: https://www.jumia.com.ng/catalog/?q=24+port+switch
    Observed market range on page: about ₦95,000 to ₦1,650,000
    Example listings observed:
    - TP-Link TL-SG1024D 24-Port Gigabit Switch: about ₦139,990 to ₦180,000
    - Cisco CBS110-24T Unmanaged 24-Port Switch: about ₦570,000
    - Ubiquiti EdgeSwitch 24-Port PoE: about ₦850,000 to ₦865,000
    - Cisco Catalyst WS-C2960X-24TS-L: about ₦1,600,000

2. Nigerian LAN cabling benchmarks used for infrastructureAdjustments.noNetwork
    Source: Jumia Nigeria search results for Cat6 305m cable
    URL: https://www.jumia.com.ng/catalog/?q=cat6+cable+305m
    Observed market range on page: about ₦85,000 to ₦209,999
    Example listings observed:
    - TP-Link Cat6 305m cable: about ₦85,000 to ₦110,000
    - 100% copper outdoor Cat6 305m: about ₦120,000 to ₦150,000
    - Higher-priced Cat6 UTP 305m listings: about ₦195,000 to ₦209,999

3. Nigerian backup power benchmarks used for infrastructureAdjustments.unstablePower
    Source: Jumia Nigeria search results for 3.5kVA inverter systems
    URL: https://www.jumia.com.ng/catalog/?q=3.5kva+inverter
    Observed market range on page: about ₦405,000 to ₦1,980,000
    Example listings observed:
    - Blue Gate 3.5kVA inverter: about ₦427,000
    - Mercury 3.5kVA inverter: about ₦470,000
    - Felicity Solar 3.5kVA inverter: about ₦450,000 to ₦600,000
    - AFRIIPOWER 3.5kVA inverter: about ₦630,000
    - Higher-end rugged 3.5kVA models: about ₦799,999 to ₦897,180

4. Estimation method used for noNetwork
    The ₦4,500,000 estimate was not taken from a single public listing.
    It was derived as a realistic small-to-mid hospital LAN build in Nigeria using comparable local hardware pricing for:
    - 2 to 4 switches
    - multiple Cat6 cable boxes
    - patch panels, faceplates, connectors, racks, and access points
    - onsite installation labor, configuration, testing, and contingency

5. Estimation method used for unstablePower
    The model is not taken from a single public listing.
    It was derived from local inverter price benchmarks plus typical additional items needed in Nigerian facilities:
    - inverter hardware
    - batteries or extended backup capacity
    - UPS and surge protection
    - cabling, changeover/protection accessories, and installation labor

6. Infrastructure scaling logic (real-world deployment pattern)
    Infrastructure costs now scale with service points because each additional service point generally introduces:
    - more cable distance and termination work
    - additional switching and wireless distribution requirements
    - higher concurrent load and backup power demand
    - additional commissioning and validation effort
    This produces a more realistic cost gradient than fixed flat infrastructure surcharges.

7. Estimation method used for baseSetupCost, baseMonthlyCost, servicePointCost, servicePointMonthlyCost, staffUserCost, and trainingCosts
    Exact public Nigerian pricing for EMR implementation, software licensing, hospital onboarding, and support is usually quote-based rather than openly published.
    These values were therefore estimated from comparable Nigerian B2B healthcare IT and business software deployment patterns, using the infrastructure benchmarks above as the local market anchor.

8. Practical interpretation of the software and services estimates
    - baseSetupCost represents project kickoff, workflow discovery, configuration, data setup, and go-live support for one deployment
    - baseMonthlyCost represents baseline hosting, maintenance, and support retainership
    - servicePointCost represents per-department or per-location rollout effort
    - servicePointMonthlyCost represents recurring support overhead per active location
    - staffUserCost represents a reasonable per-user monthly licensing and support average for the Nigerian market
    - trainingCosts represent onsite onboarding sessions and staff enablement, scaled by staff readiness

9. Important note
    These are market-informed estimates for Nigeria, not vendor quotations.
    Actual bids can differ materially by hospital size, deployment model, hardware brand, power architecture, hosting choice, and whether the solution is locally hosted, hybrid, or fully cloud-based.
*/
