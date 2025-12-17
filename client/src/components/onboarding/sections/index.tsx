import { useOnboarding } from "@/lib/onboarding-context";
import { DocumentUploadSection } from "../document-upload-section";
import { Section1 } from "./section-1";
import { Section2 } from "./section-2";
import { Section3 } from "./section-3";
import { Section4 } from "./section-4";
import { Section5 } from "./section-5";
import { Section6 } from "./section-6";
import { Section7 } from "./section-7";
import { Section8 } from "./section-8";
import { Section9 } from "./section-9";
import { Section10 } from "./section-10";
import { Section11 } from "./section-11";
import { Section12 } from "./section-12";
import { ScrollArea } from "@/components/ui/scroll-area";

function CurrentSection({ section }: { section: number }) {
  switch (section) {
    case 1:
      return <Section1 />;
    case 2:
      return <Section2 />;
    case 3:
      return <Section3 />;
    case 4:
      return <Section4 />;
    case 5:
      return <Section5 />;
    case 6:
      return <Section6 />;
    case 7:
      return <Section7 />;
    case 8:
      return <Section8 />;
    case 9:
      return <Section9 />;
    case 10:
      return <Section10 />;
    case 11:
      return <Section11 />;
    case 12:
      return <Section12 />;
    default:
      return <Section1 />;
  }
}

export function SectionRenderer() {
  const { currentSection } = useOnboarding();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <DocumentUploadSection />
      <div className="flex-1 overflow-hidden">
        <CurrentSection section={currentSection} />
      </div>
    </div>
  );
}
