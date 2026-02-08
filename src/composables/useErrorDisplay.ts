import { ref } from 'vue';

type ActionErrorOptions = {
  title: string;
  description?: string;
};

export const useErrorDisplay = () => {
  const toast = useToast();
  const pageError = ref<string | null>(null);

  const setPageError = (message: string) => {
    pageError.value = message;
  };

  const clearPageError = () => {
    pageError.value = null;
  };

  const notifyActionError = (options: ActionErrorOptions) => {
    toast.add({
      title: options.title,
      description: options.description,
      color: 'error',
    });
  };

  return {
    pageError,
    setPageError,
    clearPageError,
    notifyActionError,
  };
};
