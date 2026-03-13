# BridgeHMS Pricing Calculator

A lightweight front-end pricing estimator for healthcare/EMR deployments in Nigeria.

The app calculates:

- One-time setup/implementation cost
- Recurring monthly subscription cost
- Deployment recommendation (`Cloud`, `Hybrid`, `On-Premise`)
- Cost breakdown components shown in the UI

## Project Structure

- `index.html`: UI layout (Tailwind via CDN) and calculator controls
- `calculator.js`: UI behavior, formatting, animations, and event wiring
- `pricing-engine.js`: Core pricing and recommendation logic
- `pricing-config.js`: Configurable NGN pricing inputs, tiers, and documented source notes

## How Pricing Works

Inputs from the UI:

- `patientsPerMonth`
- `servicePoints`
- `staffCount`
- `hasNetwork`
- `stablePower`
- `trainingLevel`

### Monthly Subscription

Monthly cost is computed as:

```text
monthlyCost = (baseMonthlyCost * patientTierMultiplier)
            + (servicePoints * servicePointMonthlyCost)
            + (staffCount * staffUserCost)
```

### Setup Cost

Setup cost is computed as:

```text
setupCost = baseSetupCost
          + (servicePoints * servicePointCost)
          + infrastructureAdjustments
          + trainingCost
```

Where:

- `infrastructureAdjustments` adds `noNetwork` if `hasNetwork` is false and `unstablePower` if `stablePower` is false.
- `trainingCost` comes from `trainingCosts[trainingLevel]`.

Infrastructure adjustments are service-point aware. Each model can use:

```text
adjustmentCost = baseCost
               + (servicePoints * perServicePointCost)
               + (max(servicePoints - extraScalingThreshold, 0) * extraPerPointCost)
```

This reflects real deployment behavior where larger facility footprints usually require longer network runs, additional distribution equipment, and higher backup power capacity.

Current infrastructure model values in `pricing-config.js`:

- `noNetwork`
- `baseCost: 1,800,000`
- `perServicePointCost: 650,000`
- `extraScalingThreshold: 6`
- `extraPerPointCost: 180,000`

- `unstablePower`
- `baseCost: 1,200,000`
- `perServicePointCost: 400,000`
- `extraScalingThreshold: 4`
- `extraPerPointCost: 150,000`

Worked examples (when `hasNetwork = false` and `stablePower = false`):

- `servicePoints = 2`
- `noNetwork = 1,800,000 + (2 x 650,000) = 3,100,000`
- `unstablePower = 1,200,000 + (2 x 400,000) = 2,000,000`
- `infrastructureAdjustments total = 5,100,000`

- `servicePoints = 8`
- `noNetwork = 1,800,000 + (8 x 650,000) + (2 x 180,000) = 7,360,000`
- `unstablePower = 1,200,000 + (8 x 400,000) + (4 x 150,000) = 5,000,000`
- `infrastructureAdjustments total = 12,360,000`

### Deployment Recommendation

Based on `patientsPerMonth` and `stablePower`:

- `Cloud`: below `cloudPatientThreshold` and stable power
- `Hybrid`: below `hybridPatientThreshold` otherwise
- `On-Premise`: higher patient volume

## Configuration

All pricing controls are centralized in `pricing-config.js`.

Key configurable areas:

- Base costs (`baseSetupCost`, `baseMonthlyCost`)
- Patient scaling tiers (`patientTiers`)
- Per-service-point and per-staff pricing
- Infrastructure surcharges
- Training costs
- Deployment thresholds

`pricing-config.js` also includes a detailed bottom comment block documenting the benchmark sources and estimation approach used for the current NGN values.

## Run Locally

Because this uses ES modules, run it through a local web server (not `file://`).

Option 1 (Python):

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

Option 2 (VS Code Live Server):

- Open the folder in VS Code
- Start Live Server from `index.html`

## Notes

- Currency output is formatted as NGN in `calculator.js`.
- Values are rounded before display.
- This repository is intentionally simple and dependency-light for quick iteration on pricing assumptions.
