
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ProjectStats from "./dashboard/ProjectStats";
import ConversionOptions from "./dashboard/ConversionOptions";
import CodePreviewTabs from "./dashboard/CodePreviewTabs";
import ConversionProgress from "./dashboard/ConversionProgress";
import ConversionResult from "./dashboard/results/ConversionResult";
import { useConversion } from "@/context/ConversionContext";
import { ConversionExecutor } from "@/services/conversionExecutor";

interface ConversionDashboardProps {
  projectData: {
    files: File[];
    totalFiles: number;
    nextJsComponents: number;
    apiRoutes: number;
    dataFetchingMethods: number;
    complexityScore: number;
    packageJson?: Record<string, any>;
  };
  onStartConversion: () => void;
  isConverting: boolean;
}

const ConversionDashboard = ({ 
  projectData, 
  onStartConversion: parentOnStartConversion,
  isConverting: parentIsConverting 
}: ConversionDashboardProps) => {
  const { state, dispatch, toggleOption } = useConversion();
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  
  // Use parent state if provided, otherwise use local state
  const conversionInProgress = parentIsConverting || state.isConverting;

  const handleStartConversion = async () => {
    try {
      // Update local state
      setProgress(0);
      setProgressMessage("Starting conversion...");
      
      // Notify parent component
      parentOnStartConversion();
      
      // Update context state
      dispatch({ type: "SET_IS_CONVERTING", payload: true });
      
      toast.info("Starting Next.js to Vite conversion process...");
      
      if (projectData && projectData.files) {
        // Create conversion executor with the files and options
        const executor = new ConversionExecutor(
          projectData.files,
          state.conversionOptions
        );
        
        // Set up progress callback
        executor.setProgressCallback((progress, message) => {
          setProgress(progress);
          setProgressMessage(message);
          dispatch({ 
            type: "SET_CONVERSION_PROGRESS", 
            payload: { progress, message } 
          });
        });
        
        // Execute conversion process
        const result = await executor.execute();
        
        // Handle conversion result
        if (result.success) {
          toast.success("Conversion completed successfully!");
          dispatch({ 
            type: "SET_CONVERSION_RESULT", 
            payload: { success: true, result } 
          });
        } else {
          toast.error(`Conversion completed with ${result.errors.length} errors.`);
          dispatch({ 
            type: "SET_CONVERSION_RESULT", 
            payload: { success: false, result } 
          });
        }
      } else {
        toast.error("Project data is missing. Please upload a valid Next.js project.");
        dispatch({
          type: "SET_CONVERSION_ERROR",
          payload: "Project data is missing. Please upload a valid Next.js project."
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Error during conversion: ${errorMessage}`);
      dispatch({ 
        type: "SET_CONVERSION_ERROR", 
        payload: errorMessage
      });
    } finally {
      // Update context state
      dispatch({ type: "SET_IS_CONVERTING", payload: false });
    }
  };

  // When component mounts, update the context with project data
  useEffect(() => {
    if (projectData && projectData.files) {
      dispatch({ 
        type: "SET_PROJECT_DATA", 
        payload: { 
          files: projectData.files,
          packageJson: projectData.packageJson
        }
      });
    }
  }, [projectData, dispatch]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <ProjectStats projectData={projectData} />
        <ConversionOptions 
          options={state.conversionOptions}
          onOptionToggle={toggleOption}
          onStartConversion={handleStartConversion}
          isConverting={conversionInProgress}
        />
      </div>

      <CodePreviewTabs />

      {conversionInProgress && (
        <ConversionProgress 
          currentProgress={progress} 
          currentMessage={progressMessage}
        />
      )}
      
      {state.conversionResult && !conversionInProgress && (
        <ConversionResult result={state.conversionResult} />
      )}
    </div>
  );
};

export default ConversionDashboard;
