# Public Profile Fields

Fecha: 2026-07-13

## General

- `type`, `displayName`, `alias`, `photoUrl`, `headline`, `helpMessage`, `description`, `statusMessage`, `preferredLanguage`, `isPublic`.

## Persona

- `firstName`, `lastName`, `approximateAge`, `birthYear`, `genderOptional`.
- `communicationNotes`, `mobilityNotes`, `sensoryNotes`, `cognitiveNotes`.

## Medico opcional

- `bloodType`, `allergies`, `medicalConditions`, `medications`, `medicalInstructions`, `emergencyInstructions`, `organDonorOptional`, `healthProviderOptional`.

## Ubicacion o residencia

- `country`, `region`, `commune`, `generalArea`, `exactAddress`.
- `exactAddress` nunca se muestra por defecto.

## Mascotas

- `petName`, `species`, `breed`, `color`, `sex`, `sterilizedOptional`, `veterinaryNotes`, `microchipNumberOptional`, `petBehaviorNotes`, `rewardMessage`.

## Objetos

- `objectName`, `objectCategory`, `brand`, `model`, `color`, `objectDescription`, `returnInstructions`, `rewardMessage`.

Mascotas y objetos no exponen campos medicos de persona aunque existan datos antiguos.
