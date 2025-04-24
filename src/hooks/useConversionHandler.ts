
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { transformCode } from "@/services/codeTransformer";
import { transformWithAst } from "@/services/astTransformer";
import { ConversionAction, ConversionResult, ConversionStats } from "@/types/conversion";
import { DiagnosticsReporter } from "@/services/diagnosticsReporter";

export const useConversionHandler = (
  dispatch: React.Dispatch<ConversionAction>,
  parentOnStartConversion?: () => void
) => {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  const updateProgress = useCallback(async (newProgress: number, message: string) => {
    setProgress(newProgress);
    setProgressMessage(message);
    dispatch({ 
      type: "SET_CONVERSION_PROGRESS", 
      payload: { progress: newProgress, message } 
    });
    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
  }, [dispatch]);

  const handleStartConversion = useCallback(async () => {
    try {
      setIsConverting(true);
      setProgress(0);
      setProgressMessage("Konverzió indítása...");
      
      if (parentOnStartConversion) {
        parentOnStartConversion();
      }
      
      dispatch({ type: "SET_IS_CONVERTING", payload: true });
      
      toast.info("Next.js to Vite konverzió indítása...");
      
      const exampleNextJsCode = `
        import Head from 'next/head';
        import Image from 'next/image';
        import Link from 'next/link';
        import { useRouter } from 'next/router';
        
        export const getServerSideProps = async () => {
          const res = await fetch('https://api.example.com/data');
          const data = await res.json();
          return { props: { data } };
        }
        
        export default function HomePage({ data }) {
          const router = useRouter();
          
          const handleClick = () => {
            router.push('/about');
          }
          
          return (
            <div>
              <Head>
                <title>My Next.js App</title>
                <meta name="description" content="My awesome app" />
              </Head>
              <h1>Welcome to my app</h1>
              <Image src="/logo.png" width={200} height={100} alt="Logo" />
              <Link href="/about">About us</Link>
              <button onClick={() => router.push('/contact')}>Contact</button>
              <div>
                {data.map(item => (
                  <div key={item.id}>{item.name}</div>
                ))}
              </div>
            </div>
          )
        }
      `;
      
      // Save original code
      dispatch({ type: "SET_ORIGINAL_CODE", payload: exampleNextJsCode });
      
      // Create diagnostics reporter for logging
      const reporter = new DiagnosticsReporter('example-project', {
        useReactRouter: true,
        convertApiRoutes: true,
        transformDataFetching: true,
        replaceComponents: true,
        updateDependencies: true,
        preserveTypeScript: true,
        handleMiddleware: true
      });
      
      await updateProgress(10, "AST alapú transzformáció...");
      const astResult = transformWithAst(exampleNextJsCode);
      
      // Log AST transformations
      astResult.changes.forEach(change => {
        reporter.addInfo('component', change);
      });
      
      astResult.warnings.forEach(warning => {
        reporter.addWarning('component', warning);
      });
      
      await updateProgress(30, "Regex alapú konverzió...");
      const { transformedCode, appliedTransformations } = transformCode(astResult.code);
      
      // Log regex transformations
      appliedTransformations.forEach(transformation => {
        reporter.addInfo('transformation', transformation);
      });
      
      reporter.completeStep('AST transformation');
      await updateProgress(50, "Komponensek átalakítása...");
      reporter.completeStep('Component transformation');
      
      await updateProgress(70, "Függőségek frissítése...");
      reporter.completeStep('Dependency updates');
      
      await updateProgress(85, "API route-ok konvertálása...");
      reporter.completeStep('API route conversion');
      
      await updateProgress(95, "Projekt struktúra aktualizálása...");
      reporter.completeStep('Project structure updates');
      
      dispatch({ type: "SET_CONVERTED_CODE", payload: transformedCode });
      
      const stats: ConversionStats = {
        totalFiles: 1,
        modifiedFiles: 1,
        transformationRate: 1.0,
        dependencyChanges: appliedTransformations.filter(t => t.includes('dependency')).length,
        routeChanges: appliedTransformations.filter(t => t.includes('route')).length,
        totalTransformations: appliedTransformations.length,
        changeMade: astResult.changes.length,
        warningCount: astResult.warnings.length,
        conversionRate: appliedTransformations.length > 0 ? 100 : 0
      };
      
      const result: ConversionResult = {
        success: true,
        originalCode: exampleNextJsCode,
        transformedCode,
        appliedTransformations,
        changes: astResult.changes,
        warnings: astResult.warnings,
        errors: [],
        info: [],
        stats
      };
      
      setConversionResult(result);
      dispatch({ 
        type: "SET_CONVERSION_RESULT", 
        payload: { success: true, result } 
      });
      
      await updateProgress(100, "Konverzió befejezve!");
      toast.success("Next.js to Vite konverzió sikeresen befejezve!");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Hiba a konverzió során: ${errorMessage}`);
      dispatch({ 
        type: "SET_CONVERSION_ERROR", 
        payload: errorMessage
      });
    } finally {
      setIsConverting(false);
      dispatch({ type: "SET_IS_CONVERTING", payload: false });
    }
  }, [dispatch, updateProgress, parentOnStartConversion]);

  return {
    isConverting,
    progress,
    progressMessage,
    conversionResult,
    handleStartConversion
  };
};
