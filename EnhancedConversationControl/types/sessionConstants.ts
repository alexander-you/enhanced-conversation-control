/** Picklist values for msdyn_sessioncreationreason */
export const SESSION_CREATION_REASON = {
    INITIAL:  192350000,
    TRANSFER: 192350001,
} as const;

/** Picklist values for msdyn_closurereason */
export const SESSION_CLOSURE_REASON = {
    DECLINED:    192350004,
    CLOSED:      192350005,
    TRANSFERRED: 192350006,
} as const;

/** Picklist values for msdyn_sessionparticipant.msdyn_mode */
export const PARTICIPANT_MODE = {
    PRIMARY:    192350002,
    CONSULTING: 192350003,
} as const;
