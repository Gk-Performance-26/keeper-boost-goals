import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";

const Privacy = () => {
  return (
    <div className="px-5 pt-6 pb-10 max-w-2xl mx-auto">
      <Link to="/profile">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </Link>
      <PrivacyPolicyContent />
    </div>
  );
};

export default Privacy;
