declare global {
    interface Function {
        $(...args: any[]): Promise<any>;
    }
}
export {};
