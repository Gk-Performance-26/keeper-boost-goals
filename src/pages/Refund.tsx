import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefundPolicyContent } from "@/components/RefundPolicyContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Refund = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-10 max-w-2xl mx-auto">
        <Link to={user ? "/profile" : "/auth"}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Button>
        </Link>
        <RefundPolicyContent />
      </div>
    </div>
  );
};

export default Refund;
