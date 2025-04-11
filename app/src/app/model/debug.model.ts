export interface DebugComponent {
    evaluateDebugThrow(value: number, valueString: string, position: number[]): void;

    disableConsoleButtons(): boolean;
}

export interface ThrowEditor {
    selectedDartIndex: number | null;
    changes: { value: number; valueString: string; position: number[]; replacementIndex: number }[];
    editingMode: boolean;
    selectDart(index: number): void;
    toggleEditingMode(reason: number): void;
    disableEditingMode(): void;
    setCurrentDarts(darts: string[]): void;
}

export interface CameraDebugComponent {
    cameraPopupVisible: boolean;
    toggleCameraPopup(index: number): void;
    closeCameraPopup(): void;
}

export interface CameraDebugPresenter {
    cameraStatus: boolean[];
    evaluateCameraStatusClick(index: number): void;
}
