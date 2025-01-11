export interface DebugComponent {
    evaluateDebugThrow(value: number, valueString: string, position: number[]): void;

    disableConsoleButtons(): boolean;
}
