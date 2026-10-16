import { ToastContainer, Bounce, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../CSSfileToast/SuccessToast.css";

// Call this from anywhere: showSuccessToast("Profile updated")
export const showSuccessToast = (message, options = {}) =>
    toast.success(message, options);

function SuccessToast() {
    return (
        <ToastContainer
            position="top-center"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss={false}
            pauseOnHover
            draggable
            theme="light"
            transition={Bounce}
            toastClassName="kb-success-toast"
            progressClassName="kb-success-progress"
        />
    );
}

export default SuccessToast;