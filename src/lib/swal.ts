import Swal from "sweetalert2";

// Default toast configuration
const toastConfig = {
  position: "top-end" as const,
  timer: 3000,
  timerProgressBar: true,
  showConfirmButton: false,
  toast: true,
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

// Success toast
export const swalSuccess = (message: string) => {
  Swal.fire({
    ...toastConfig,
    icon: "success",
    title: message,
  });
};

// Error toast
export const swalError = (message: string) => {
  Swal.fire({
    ...toastConfig,
    icon: "error",
    title: message,
    timer: 4000,
  });
};

// Info toast
export const swalInfo = (message: string) => {
  Swal.fire({
    ...toastConfig,
    icon: "info",
    title: message,
  });
};

// Confirm dialog
export const swalConfirm = async (
  title: string,
  message: string,
  confirmText: string = "Yes",
  cancelText: string = "Cancel"
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    background: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
    confirmButtonColor: "hsl(var(--primary))",
    cancelButtonColor: "hsl(var(--muted))",
  });
  return result.isConfirmed;
};

// Loading dialog
export const swalLoading = (message: string) => {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    showConfirmButton: false,
    background: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close loading dialog
export const swalClose = () => {
  Swal.close();
};

// Custom dialog with HTML
export const swalCustom = async (options: {
  title?: string;
  html?: string;
  icon?: "success" | "error" | "warning" | "info" | "question";
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  confirmColor?: string;
}) => {
  const result = await Swal.fire({
    title: options.title,
    html: options.html,
    icon: options.icon,
    showCancelButton: options.showCancel,
    confirmButtonText: options.confirmText || "OK",
    cancelButtonText: options.cancelText,
    background: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
    confirmButtonColor: options.confirmColor || "hsl(var(--primary))",
  });
  return result.isConfirmed;
};