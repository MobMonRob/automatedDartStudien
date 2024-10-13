export interface DebugComponent {
    evaluateDebugThrow(value: number, valueString: string): void;

    disableConsoleButtons(): boolean;
}
