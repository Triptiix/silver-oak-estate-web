import type { PublicBookingErrorCode } from "@/types/booking";

type BookingErrorProps = {
  code: PublicBookingErrorCode;
  onRetry?: () => void;
};

export function BookingError({ code, onRetry }: BookingErrorProps) {
  const getErrorContent = () => {
    switch (code) {
      case "DATE_UNAVAILABLE":
        return {
          title: "Date No Longer Available",
          message: "We're sorry, but the date you selected has just been booked or placed on hold by someone else.",
          action: "Select a New Date",
        };
      case "IDEMPOTENCY_CONFLICT":
        return {
          title: "Request Conflict",
          message: "We encountered a temporary conflict while processing your request. Please try again.",
          action: "Try Again",
        };
      case "HOLD_LIMIT_REACHED":
        return {
          title: "Hold Limit Reached",
          message: "You already have an active hold. Please wait for it to expire before creating a new one.",
        };
      case "BOT_VERIFICATION_FAILED":
        return {
          title: "Security Verification Failed",
          message: "We couldn't verify your request. Please try submitting the form again.",
          action: "Retry",
        };
      case "ORIGIN_REJECTED":
      case "INVALID_REQUEST":
        return {
          title: "Invalid Request",
          message: "Please check your details and try again.",
          action: "Review Details",
        };
      case "PROPERTY_NOT_FOUND":
        return {
          title: "Property Not Found",
          message: "The property you are trying to book could not be found.",
        };
      case "INVALID_HOLD":
        return {
          title: "Invalid Hold",
          message: "The hold you are trying to release or interact with is invalid.",
        };
      case "SERVER_ERROR":
      default:
        return {
          title: "Temporary System Error",
          message: "We're experiencing technical difficulties. Your details have been saved, please try again.",
          action: "Retry",
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 my-4" role="alert">
      <h4 className="font-medium mb-1">{content.title}</h4>
      <p className="text-sm">{content.message}</p>
      {onRetry && content.action && (
        <button
          onClick={onRetry}
          type="button"
          className="mt-3 text-sm font-medium underline hover:text-red-900"
        >
          {content.action}
        </button>
      )}
    </div>
  );
}
