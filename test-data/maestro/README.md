# Maestro Test Flows — VaibhavVivaaha

## Structure

```
maestro/
├── subflows/
│   ├── login.yaml          # Reusable login (uses MOBILE + PIN env vars)
│   └── logout.yaml         # Reusable logout
├── plans/
│   ├── free_plan.yaml      # Free plan test assertions
│   ├── starter_plan.yaml   # Starter plan test assertions
│   ├── classic_plan.yaml   # Classic plan test assertions
│   ├── silver_plan.yaml    # Silver plan test assertions
│   ├── gold_plan.yaml      # Gold plan test assertions
│   └── platinum_plan.yaml  # Platinum plan test assertions
├── credentials/            # 60 flows (5 castes × 6 plans × 2 genders)
│   ├── vanniyar_free_male.yaml
│   ├── vanniyar_free_female.yaml
│   ├── vanniyar_starter_male.yaml
│   ... (60 total)
├── run_all.sh              # Run all 60 flows
└── README.md
```

## Setup

```bash
# Install Maestro
brew tap mobile-dev-inc/tap
brew install maestro

# Verify install
maestro --version
```

## Run a single test

```bash
# Example: Gold plan VANNIYAR Male
maestro test credentials/vanniyar_gold_male.yaml

# Example: Free plan NAIDU Female
maestro test credentials/naidu_free_female.yaml
```

## Run all 60 tests

```bash
bash run_all.sh
```

## Run by plan (all castes + genders for one plan)

```bash
# All Gold plan tests
for f in credentials/*_gold_*.yaml; do maestro test "$f"; done

# All Platinum plan tests
for f in credentials/*_platinum_*.yaml; do maestro test "$f"; done
```

## Run by caste (all plans + genders for one caste)

```bash
# All VANNIYAR tests
for f in credentials/vanniyar_*.yaml; do maestro test "$f"; done

# All NAIDU tests
for f in credentials/naidu_*.yaml; do maestro test "$f"; done
```

## Run by gender (all plans + castes for one gender)

```bash
# All Male tests
for f in credentials/*_male.yaml; do maestro test "$f"; done

# All Female tests
for f in credentials/*_female.yaml; do maestro test "$f"; done
```

## All 60 Credential Files

| Caste | Plan | Male Flow | Female Flow |
|---|---|---|---|
| VANNIYAR | Free | vanniyar_free_male.yaml | vanniyar_free_female.yaml |
| VANNIYAR | Starter | vanniyar_starter_male.yaml | vanniyar_starter_female.yaml |
| VANNIYAR | Classic | vanniyar_classic_male.yaml | vanniyar_classic_female.yaml |
| VANNIYAR | Silver | vanniyar_silver_male.yaml | vanniyar_silver_female.yaml |
| VANNIYAR | Gold | vanniyar_gold_male.yaml | vanniyar_gold_female.yaml |
| VANNIYAR | Platinum | vanniyar_platinum_male.yaml | vanniyar_platinum_female.yaml |
| NAIDU | Free | naidu_free_male.yaml | naidu_free_female.yaml |
| NAIDU | Starter | naidu_starter_male.yaml | naidu_starter_female.yaml |
| NAIDU | Classic | naidu_classic_male.yaml | naidu_classic_female.yaml |
| NAIDU | Silver | naidu_silver_male.yaml | naidu_silver_female.yaml |
| NAIDU | Gold | naidu_gold_male.yaml | naidu_gold_female.yaml |
| NAIDU | Platinum | naidu_platinum_male.yaml | naidu_platinum_female.yaml |
| AADITRAVIDAR | Free | aaditravidar_free_male.yaml | aaditravidar_free_female.yaml |
| AADITRAVIDAR | Starter | aaditravidar_starter_male.yaml | aaditravidar_starter_female.yaml |
| AADITRAVIDAR | Classic | aaditravidar_classic_male.yaml | aaditravidar_classic_female.yaml |
| AADITRAVIDAR | Silver | aaditravidar_silver_male.yaml | aaditravidar_silver_female.yaml |
| AADITRAVIDAR | Gold | aaditravidar_gold_male.yaml | aaditravidar_gold_female.yaml |
| AADITRAVIDAR | Platinum | aaditravidar_platinum_male.yaml | aaditravidar_platinum_female.yaml |
| MUDALIAR | Free | mudaliar_free_male.yaml | mudaliar_free_female.yaml |
| MUDALIAR | Starter | mudaliar_starter_male.yaml | mudaliar_starter_female.yaml |
| MUDALIAR | Classic | mudaliar_classic_male.yaml | mudaliar_classic_female.yaml |
| MUDALIAR | Silver | mudaliar_silver_male.yaml | mudaliar_silver_female.yaml |
| MUDALIAR | Gold | mudaliar_gold_male.yaml | mudaliar_gold_female.yaml |
| MUDALIAR | Platinum | mudaliar_platinum_male.yaml | mudaliar_platinum_female.yaml |
| FREECASTEBAR | Free | freecastebar_free_male.yaml | freecastebar_free_female.yaml |
| FREECASTEBAR | Starter | freecastebar_starter_male.yaml | freecastebar_starter_female.yaml |
| FREECASTEBAR | Classic | freecastebar_classic_male.yaml | freecastebar_classic_female.yaml |
| FREECASTEBAR | Silver | freecastebar_silver_male.yaml | freecastebar_silver_female.yaml |
| FREECASTEBAR | Gold | freecastebar_gold_male.yaml | freecastebar_gold_female.yaml |
| FREECASTEBAR | Platinum | freecastebar_platinum_male.yaml | freecastebar_platinum_female.yaml |

## Screenshots

Maestro saves screenshots to `~/.maestro/tests/` automatically.
Each screenshot is named with the pattern: `{plan}_{test}_{caste}_{gender}.png`
