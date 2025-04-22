
import { useState } from "react";
import ProjectStats from "./dashboard/ProjectStats";
import ConversionOptions from "./dashboard/ConversionOptions";
import CodePreviewTabs from "./dashboard/CodePreviewTabs";
import ConversionProgress from "./dashboard/ConversionProgress";

interface ConversionDashboardProps {
  projectData: any;
  onStartConversion: () => void;
  isConverting: boolean;
}

const ConversionDashboard = ({ 
  projectData, 
  onStartConversion,
  isConverting 
}: ConversionDashboardProps) => {
  const [options, setOptions] = useState({
    useReactRouter: true,
    convertApiRoutes: true,
    transformDataFetching: true,
    replaceComponents: true,
    updateDependencies: true,
    preserveTypeScript: true,
    handleMiddleware: true // új opció hozzáadva
  });

  const toggleOption = (option: keyof typeof options) => {
    setOptions({ ...options, [option]: !options[option] });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <ProjectStats projectData={projectData} />
        <ConversionOptions 
          options={options}
          onOptionToggle={toggleOption}
          onStartConversion={onStartConversion}
          isConverting={isConverting}
        />
      </div>

      <CodePreviewTabs />

      {isConverting && <ConversionProgress />}
    </div>
  );
};

export default ConversionDashboard;
