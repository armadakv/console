import { Plus, Save, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import ValueEditor from './ValueEditor';

import { useAddKeyValuePair } from '@/hooks/useApi';
import { Alert } from '@/ui/Alert';
import { Button } from '@/ui/Button';
import { Card, CardContent, CardHeader } from '@/ui/Card';

interface KeyValueFormProps {
  selectedTable: string;
  initialKey?: string;
  initialValue?: string;
  isEdit?: boolean;
  onSuccess?: () => void;
}

const KeyValueForm: React.FC<KeyValueFormProps> = ({
  selectedTable,
  initialKey = '',
  initialValue = '',
  isEdit = false,
  onSuccess,
}) => {
  const [key, setKey] = useState<string>(initialKey);
  const [val, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const mutation = useAddKeyValuePair();

  // Sync state with props when they change (e.g., switching from add to edit mode)
  useEffect(() => {
    setKey(initialKey);
    setValue(initialValue);
  }, [initialKey, initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedTable || !key || !val) {
      return;
    }

    try {
      await mutation.mutateAsync({
        table: selectedTable,
        key,
        value: val,
      });

      setSuccess(true);

      if (!isEdit) {
        // If adding a new KV pair, clear the form
        setKey('');
        setValue('');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save key-value pair');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Value' : 'Enter Key-Value Details'}
          </h2>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert variant="success" className="mb-6">
              Key-value pair {isEdit ? 'updated' : 'added'} successfully!
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <ValueEditor
                label="Key"
                name="key"
                value={key}
                onChange={setKey}
                placeholder="Enter key (max 1KB)"
                disabled={mutation.isLoading}
                readOnly={isEdit}
                maxLength={1024} // 1KB limit for keys
                rows={2}
                className="font-mono text-sm"
              />

              <ValueEditor
                label="Value"
                name="value"
                value={val}
                onChange={setValue}
                placeholder="Enter value (supports text, JSON, XML, or binary data)"
                disabled={mutation.isLoading}
                rows={8}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!key || !val || mutation.isLoading}
              className="inline-flex items-center space-x-2"
            >
              {mutation.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isEdit ? (
                <Save className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              <span>
                {mutation.isLoading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Key-Value Pair'}
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyValueForm;
