export {};

declare global {
  interface Window {
    confirmationResult: any; // Bạn có thể thay `any` bằng kiểu chính xác nếu biết
  }
}
