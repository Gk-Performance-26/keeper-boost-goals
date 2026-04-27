import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TermsContent } from "@/components/TermsContent";
import { useLanguage } from "@/contexts/LanguageContext";

const Terms = () => {
  const { t } = useLanguage();
  return (
    <div className="px-5 pt-6 pb-10 max-w-2xl mx-auto">
      <Link to="/profile">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Button>
      </Link>
      <TermsContent />
    </div>
  );
};

export default Terms;
