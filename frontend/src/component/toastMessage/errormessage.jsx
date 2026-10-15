import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../CSSfileToast/errortoast.css";

function ErrorToastMessage() {
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
            toastClassName="kb-toast"
            progressClassName="kb-progress"
        />
    );
}

export default ErrorToastMessage;