import { useCallback, useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface QueuedMutation {
  id: string;
  key: string;
  variables: unknown;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'optimistic_mutation_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

function getQueue(): QueuedMutation[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  onMutate,
  onError,
  onSettled,
  offlineKey,
}: {
  mutationFn: (vars: TVariables) => Promise<TData>;
  onMutate: (vars: TVariables) => void;
  onError: (error: Error, vars: TVariables) => void;
  onSettled: (vars: TVariables) => void;
  offlineKey?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const queueRef = useRef<QueuedMutation[]>([]);
  const processingRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      processQueue();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    queueRef.current = getQueue();
    if (!isOffline) processQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline]);

  const processQueue = useCallback(async () => {
    if (processingRef.current || isOffline) return;
    processingRef.current = true;

    const queue = getQueue();
    const keyedQueue = offlineKey ? queue.filter(m => m.key === offlineKey) : queue;

    for (const mutation of keyedQueue) {
      if (mutation.retries >= MAX_RETRIES) {
        const filtered = queue.filter(m => m.id !== mutation.id);
        saveQueue(filtered);
        queueRef.current = filtered;
        toast.error(`Falló tras ${MAX_RETRIES} intentos: ${mutation.key}`);
        continue;
      }

      try {
        await mutationFn(mutation.variables as TVariables);
        const filtered = queue.filter(m => m.id !== mutation.id);
        saveQueue(filtered);
        queueRef.current = filtered;
      } catch (error) {
        const updatedQueue = queue.map(m =>
          m.id === mutation.id ? { ...m, retries: m.retries + 1 } : m
        );
        saveQueue(updatedQueue);
        queueRef.current = updatedQueue;
        await new Promise(r => setTimeout(r, RETRY_DELAY_BASE * Math.pow(2, mutation.retries)));
      }
    }

    processingRef.current = false;
  }, [mutationFn, offlineKey, isOffline]);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsPending(true);

      onMutate(variables);

      if (isOffline) {
        const mutation: QueuedMutation = {
          id: generateId(),
          key: offlineKey || 'default',
          variables,
          timestamp: Date.now(),
          retries: 0,
        };
        const queue = getQueue();
        queue.push(mutation);
        saveQueue(queue);
        queueRef.current = queue;
        toast.success('Guardado. Se enviará al reconectar.');
        setIsPending(false);
        onSettled(variables);
        return;
      }

      try {
        await mutationFn(variables);
        onSettled(variables);
      } catch (error) {
        onError(error as Error, variables);
      } finally {
        setIsPending(false);
      }
    },
    [mutationFn, onMutate, onError, onSettled, offlineKey, isOffline]
  );

  return { mutate, isPending, isOffline };
}

export function usePendingMutations(key?: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const queue = getQueue();
      setCount(key ? queue.filter(m => m.key === key).length : queue.length);
    };

    updateCount();
    const interval = setInterval(updateCount, 1000);
    window.addEventListener('storage', updateCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateCount);
    };
  }, [key]);

  return count;
}