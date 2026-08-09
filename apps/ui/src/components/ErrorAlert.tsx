import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ErrorAlertProps = {
  title: string;
  description: string;
};

const ErrorAlert = ({ title, description }: ErrorAlertProps) => {
  return (
    <Alert variant="destructive" className="w-full">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};

export default ErrorAlert;
