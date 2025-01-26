export interface Calibration {
    currentZoomPosition: number[];
    instructionMsg: string;
    errorMsg: string;
    isFinished: boolean;
    isCanceled: boolean;
    currentStep: number;
    maximumSteps: number;
}