import { ref } from 'vue';

type ActionErrorOptions = {
  title: string;
  description?: string;
};

export const useErrorDisplay = () => {
  const toast = useToast();
  const pageError = ref<string | null>(null);
  const pageErrorMessageKey = ref<string | null>(null);

  const setPageError = (message: string, messageKey?: string) => {
    pageError.value = message;
    pageErrorMessageKey.value = messageKey ?? null;
  };

  const clearPageError = () => {
    pageError.value = null;
    pageErrorMessageKey.value = null;
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
    pageErrorMessageKey,
    setPageError,
    clearPageError,
    notifyActionError,
  };
};
