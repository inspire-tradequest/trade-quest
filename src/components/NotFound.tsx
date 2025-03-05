
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center">
      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => navigate("/")}>
        Return to Home
      </Button>
    </div>
  );
};

export default NotFound;
