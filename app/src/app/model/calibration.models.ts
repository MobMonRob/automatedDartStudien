export interface Calibration {
    currentZoomPosition: number[];
    errorMsg: string;
    isFinished: boolean;
    isCanceled: boolean;
    currentStep: number;
    maximumSteps: number;
}