import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import { App } from "./components/App";

export class EnhancedConversationControl implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private _context: ComponentFramework.Context<IInputs> | undefined;

    constructor() {
        // No initialization needed
    }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this._context = context;
        // Tell PCF to provide allocatedWidth on every updateView call as the form resizes
        context.mode.trackContainerResize(true);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        this._context = context;
        const modeAny = context.mode as unknown as { contextInfo?: { entityId?: string } };
        const entityId = modeAny.contextInfo?.entityId;
        return React.createElement(App, { context, entityId });
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        // No cleanup needed
    }
}
