/** ... (full file would be too long; key changes below) */
// At top
import { CURRENCY } from "@/const";
import PaymentVerificationModal from "@/components/PaymentVerificationModal";

// In handlePay or payment section:
setShowVerification(true); // instead of Deposit

// Prices:
{CURRENCY.symbol}{item.bid_amount.toLocaleString()}

// Add state & render modal
const [showVerification, setShowVerification] = useState(false);
// ... render <PaymentVerificationModal open={showVerification} ... />