export class ComponentUtils {
    static delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
}